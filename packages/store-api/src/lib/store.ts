import { Request, Response } from 'lambda-api';
import { getDeviceDataFromDexcom } from '@eddii-backend/dexcom';
import { DeviceRecords } from '@eddii-backend/types';
import {
    listStoreInventory as listStoreInventoryFromDal,
    getStoreItem as getStoreItemFromDal,
    listPurchasedItems as listPurchasedItemsFromDal,
    getPurchasedItem as getPurchasedItemFromDal,
    redeemGiftCard as redeemGiftCardFromDal,
    Slot,
    getUser,
    purchaseItem,
    spendHearts,
    ItemBundle,
    StoreItem,
    getHighScoreForGame,
    UnlockCondition,
    getSession,
    getReferrals,
    getSubscription,
    listPurchasedItemsBySlot,
    PurchasedItem,
    SessionType,
    OAuthSession,
} from '@eddii-backend/dal';
import {
    validNumber,
    validSmallString,
    validStoreItemBundleByValue,
    validStoreItemSlot,
} from '@eddii-backend/utils';
import { sendGiftCardEmail } from '@eddii-backend/email';

const DAY_IN_MS = 1000 * 60 * 60 * 24;

const doesValidSessionExist = async (email: string): Promise<boolean> => {
    const session = await getSession(email, SessionType.dexcom);
    if (!session) {
        return false;
    }
    const deviceInfo: DeviceRecords = await getDeviceDataFromDexcom(
        session as OAuthSession,
    );
    return deviceInfo?.records ? deviceInfo.records.length > 0 : false;
};

const getUnlockConditionWithProgress = async (
    email: string,
    storeItem: StoreItem,
    purchasedItem?: PurchasedItem,
): Promise<UnlockCondition | undefined> => {
    if (!storeItem.unlockCondition) {
        return undefined;
    }
    const unlockConditionStatus = storeItem.unlockCondition;
    if (storeItem.unlockCondition.streak !== undefined) {
        const streakLeaderboardEntry = await getHighScoreForGame(
            'streak',
            email,
        );
        let currentStreak = streakLeaderboardEntry
            ? streakLeaderboardEntry.score
            : 0;
        // If the user purchased the item, check if the purchase date is at least the streak days ago
        if (purchasedItem?.purchasedAt && storeItem.maxQuantity > 1) {
            const startDate = new Date(purchasedItem.purchasedAt);
            const endDate = new Date();
            const numberOfDays = Math.floor(
                (endDate.getTime() - startDate.getTime()) / DAY_IN_MS,
            );
            currentStreak = Math.min(currentStreak, numberOfDays);
        }
        unlockConditionStatus.progress =
            Math.min(currentStreak, storeItem.unlockCondition.streak) /
            storeItem.unlockCondition.streak;
    }
    if (storeItem.unlockCondition.cgmConnection) {
        const sessionExists = await doesValidSessionExist(email);
        unlockConditionStatus.progress = sessionExists ? 1 : 0;
    }
    if (storeItem.unlockCondition.cgmConnectionReferral !== undefined) {
        const referrals = await getReferrals(email);
        let cgmConnectionReferralCount = 0;
        for await (const referral of referrals) {
            const sessionExists = await doesValidSessionExist(
                referral.referredEmail,
            );
            if (sessionExists) {
                cgmConnectionReferralCount++;
            }
        }
        if (purchasedItem?.quantity) {
            cgmConnectionReferralCount %=
                purchasedItem.quantity *
                storeItem.unlockCondition.cgmConnectionReferral;
        }
        unlockConditionStatus.progress =
            Math.min(
                cgmConnectionReferralCount,
                storeItem.unlockCondition.cgmConnectionReferral,
            ) / storeItem.unlockCondition.cgmConnectionReferral;
    }
    if (storeItem.unlockCondition.isPremium) {
        const subscription = await getSubscription(email);
        let progress = 0;
        const now = new Date();
        if (subscription && now <= new Date(subscription.endDate)) {
            progress = 1;
        }
        unlockConditionStatus.progress = progress;
    }
    if (storeItem.unlockCondition.daysSinceLastPurchase !== undefined) {
        const daysSinceLastPurchase = purchasedItem?.purchasedAt
            ? Math.floor(
                  (new Date().getTime() -
                      new Date(purchasedItem.purchasedAt).getTime()) /
                      DAY_IN_MS,
              )
            : storeItem.unlockCondition.daysSinceLastPurchase;
        unlockConditionStatus.progress =
            Math.min(
                daysSinceLastPurchase,
                storeItem.unlockCondition.daysSinceLastPurchase,
            ) / storeItem.unlockCondition.daysSinceLastPurchase;
    }
    return unlockConditionStatus;
};

export const listStoreInventory = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const { itemBundleLimit } = request.query || {};
    const { itemBundle } = request.multiValueQuery || {};
    if (
        itemBundleLimit !== undefined &&
        (!validNumber(itemBundleLimit) ||
            Number(itemBundleLimit) <= 0 ||
            Number(itemBundleLimit) > 6)
    ) {
        response.status(400).json({
            message: 'Preview Limit must be between 0 and 6.',
        });
        return;
    }
    if (itemBundle && itemBundle.length > 0) {
        for (const bundle of itemBundle) {
            if (!validStoreItemBundleByValue(bundle)) {
                response.status(400).json({
                    message: 'Invalid item bundle.',
                });
                return;
            }
        }
    }

    let storeInventory =
        itemBundle && itemBundle.length > 0
            ? listStoreInventoryFromDal().filter(item =>
                  itemBundle.includes(item.itemBundle),
              )
            : listStoreInventoryFromDal();

    if (itemBundleLimit !== undefined) {
        const previewItems: StoreItem[] = [];
        const itemBundles = Object.values(ItemBundle);
        for (const itemBundle of itemBundles) {
            const itemsForBundle = storeInventory.filter(
                item => item.itemBundle === itemBundle,
            );
            if (itemsForBundle.length > 0) {
                previewItems.push(
                    ...itemsForBundle.slice(0, Number(itemBundleLimit)),
                );
            }
        }
        storeInventory = previewItems;
    }
    response.status(200).json(storeInventory);
};

export const getStoreItem = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const email = request.userEmail;
    const itemName = request.params.itemName;
    if (!itemName || !validSmallString(itemName)) {
        response.status(400).json({ message: 'Valid Item name is required.' });
        return;
    }
    const itemSlot = request.params.itemSlot;
    if (!itemSlot || !validStoreItemSlot(itemSlot)) {
        response.status(400).json({ message: 'Valid Item slot is required.' });
        return;
    }
    const storeItem = getStoreItemFromDal(itemName, Slot[itemSlot]);
    if (!storeItem) {
        response.status(404).json({ message: 'Item not found' });
        return;
    }
    if (storeItem.unlockCondition) {
        const itemId = `${itemSlot}/${itemName}`;
        const purchasedItem = await getPurchasedItemFromDal(email, itemId);
        const unlockConditionStatus = await getUnlockConditionWithProgress(
            email,
            storeItem,
            purchasedItem,
        );
        storeItem.unlockCondition = unlockConditionStatus;
    }
    response.status(200).json(storeItem);
};

export const purchaseStoreItem = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const email = request.userEmail;
    const itemName = request.params.itemName;
    const itemSlot = request.params.itemSlot;
    if (!itemName || !validSmallString(itemName)) {
        response.status(400).json({ message: 'Valid Item name is required.' });
        return;
    }
    if (!itemSlot || !validStoreItemSlot(itemSlot)) {
        response.status(400).json({ message: 'Valid Item slot is required.' });
        return;
    }
    const storeItem = getStoreItemFromDal(itemName, Slot[itemSlot]);
    if (!storeItem) {
        response.status(404).json({ message: 'Item not found.' });
        return;
    }
    if (storeItem.slot === Slot.redeemableGiftCard) {
        response.status(400).json({ message: 'Item not purchasable.' });
        return;
    }
    const user = await getUser(email);
    if (user.hearts < storeItem.cost) {
        response.status(400).json({ message: 'Not enough hearts.' });
        return;
    }
    const itemId = `${itemSlot}/${itemName}`;
    const purchasedItem = await getPurchasedItemFromDal(email, itemId);
    const purchasedQuantity = purchasedItem ? purchasedItem.quantity : 0;
    if (purchasedQuantity >= storeItem.maxQuantity) {
        response.status(400).json({ message: 'Item already purchased.' });
        return;
    }
    if (itemSlot === Slot.giftCardTask) {
        const sessionExists = await doesValidSessionExist(email);
        if (!sessionExists) {
            response.status(400).json({
                message: 'Must be connected to a CGM to purchase gift card.',
            });
            return;
        }
    }
    if (storeItem.unlockCondition) {
        const unlockConditionStatus = await getUnlockConditionWithProgress(
            email,
            storeItem,
            purchasedItem,
        );
        if (unlockConditionStatus.progress < 1) {
            response.status(400).json({ message: 'Item not unlocked.' });
            return;
        }
    }
    const purchasedItemToReturn = await purchaseItem(
        email,
        itemId,
        purchasedQuantity + 1,
        purchasedItem?.redeemCount,
        purchasedItem?.redeemedAt,
    );
    let userToReturn = undefined;
    if (storeItem.cost > 0) {
        userToReturn = await spendHearts(email, storeItem.cost);
        if (!userToReturn) {
            // Race condition if hearts are depleted between the check and the purchase
            response.status(400).json({ message: 'Not enough hearts.' });
            return;
        }
    }
    response
        .status(200)
        .json({ purchasedItem: purchasedItemToReturn, user: userToReturn });
};

export const listPurchasedItems = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const email = request.userEmail;
    const items = await listPurchasedItemsFromDal(email);
    const filteredInventory = items.filter(
        item => !item.storeItem?.filterFromInventory,
    );
    response.status(200).json(filteredInventory);
};

export const listBonusItems = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const email = request.userEmail;
    const streakLeaderboardEntry = await getHighScoreForGame('streak', email);
    const currentStreak = streakLeaderboardEntry
        ? streakLeaderboardEntry.score
        : 0;
    const bonusItems = listStoreInventoryFromDal().filter(
        item => ItemBundle.bonuses === item.itemBundle,
    );
    const purchasedItems = await listPurchasedItemsFromDal(email);
    const unpurchasedBonusItems = bonusItems.filter(
        item =>
            !purchasedItems.find(
                purchasedItem =>
                    purchasedItem.itemId === `${item.slot}/${item.name}`,
            ),
    );
    const unlockedItems = unpurchasedBonusItems.filter(
        item =>
            !item.unlockCondition ||
            item.unlockCondition.streak <= currentStreak,
    );
    const lockedItems = unpurchasedBonusItems.filter(
        item =>
            item.unlockCondition && item.unlockCondition.streak > currentStreak,
    );
    lockedItems.sort(
        (a, b) => a.unlockCondition.streak - b.unlockCondition.streak,
    );
    const nextItemsToUnlock = lockedItems.slice(0, 4);
    const itemsToShow = [...unlockedItems, ...nextItemsToUnlock];
    response.status(200).json(itemsToShow);
};

export const listGiftCardTasks = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const email = request.userEmail;
    const allGiftCardTasks = listStoreInventoryFromDal().filter(
        item => Slot.giftCardTask === item.slot,
    );
    const purchasedGiftCardTasks = await listPurchasedItemsBySlot(
        email,
        Slot.giftCardTask,
    );
    const giftCardTasks: PurchasedItem[] = [];
    for await (const item of allGiftCardTasks) {
        const foundItem = purchasedGiftCardTasks.find(
            purchasedItem =>
                purchasedItem.itemId === `${item.slot}/${item.name}`,
        );
        if (foundItem) {
            const unlockConditionStatus = await getUnlockConditionWithProgress(
                email,
                foundItem.storeItem,
                foundItem,
            );
            if (unlockConditionStatus) {
                foundItem.storeItem.unlockCondition = unlockConditionStatus;
            }
            giftCardTasks.push(foundItem);
        } else if (!item.disabled) {
            const unlockConditionStatus = await getUnlockConditionWithProgress(
                email,
                item,
            );
            item.unlockCondition = unlockConditionStatus;
            giftCardTasks.push({
                email: email,
                itemId: `${item.slot}/${item.name}`,
                quantity: 0,
                storeItem: item,
            });
        }
    }
    response.status(200).json(giftCardTasks);
};

export const listRedeemableGiftCards = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const email = request.userEmail;
    const redeemableGiftCards = await listPurchasedItemsBySlot(
        email,
        Slot.redeemableGiftCard,
    );
    response.status(200).json(redeemableGiftCards);
};

export const getPurchasedItem = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const email = request.userEmail;
    const itemName = request.params.itemName;
    const itemSlot = request.params.itemSlot;
    if (!itemName || !validSmallString(itemName)) {
        response.status(400).json({ message: 'Valid Item name is required.' });
        return;
    }
    if (!itemSlot || !validStoreItemSlot(itemSlot)) {
        response.status(400).json({ message: 'Valid Item slot is required.' });
        return;
    }
    const storeItem = getStoreItemFromDal(itemName, Slot[itemSlot]);
    if (!storeItem) {
        response.status(404).json({ message: 'Item not found.' });
        return;
    }
    const itemId = `${itemSlot}/${itemName}`;
    const purchasedItem = await getPurchasedItemFromDal(email, itemId);
    if (!purchasedItem) {
        response.status(404).json({ message: 'Item not purchased.' });
        return;
    }
    const unlockConditionStatus = await getUnlockConditionWithProgress(
        email,
        purchasedItem.storeItem,
        purchasedItem,
    );
    if (unlockConditionStatus) {
        purchasedItem.storeItem.unlockCondition = unlockConditionStatus;
    }
    response.status(200).json(purchasedItem);
};

export const redeemGiftCard = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const email = request.userEmail;
    const giftCardName = request.params.giftCardName;
    if (!giftCardName || !validSmallString(giftCardName)) {
        response
            .status(400)
            .json({ message: 'Valid Gift Card name is required.' });
        return;
    }
    const storeItem = getStoreItemFromDal(giftCardName, Slot.giftCardTask);
    if (!storeItem) {
        response.status(404).json({ message: 'Item not found.' });
        return;
    }
    const itemId = `${storeItem.slot}/${storeItem.name}`;
    const purchasedItem = await getPurchasedItemFromDal(email, itemId);
    if (!purchasedItem) {
        response.status(404).json({ message: 'Item not purchased.' });
        return;
    }
    if (
        purchasedItem.redeemCount !== undefined &&
        purchasedItem.redeemCount >= purchasedItem.quantity
    ) {
        response.status(400).json({ message: 'Gift card already redeemed.' });
        return;
    }
    const giftCards = listStoreInventoryFromDal().filter(
        item => ItemBundle.redeemableGiftCards === item.itemBundle,
    );
    const { giftCardType } = request.body || {};
    const giftCardTypeNames = giftCards.map(item => item.name);
    if (!giftCardType || !giftCardTypeNames.includes(giftCardType)) {
        response
            .status(400)
            .json({ message: 'Valid Gift Card type is required.' });
        return;
    }
    const redeemableGiftCardItem = getStoreItemFromDal(
        giftCardType,
        Slot.redeemableGiftCard,
    );
    const purchasedRedeemableGiftCard = await getPurchasedItemFromDal(
        email,
        `${Slot.redeemableGiftCard}/${giftCardType}`,
    );
    const purchasedQuantity = purchasedRedeemableGiftCard
        ? purchasedRedeemableGiftCard.quantity
        : 0;
    if (purchasedQuantity >= redeemableGiftCardItem.maxQuantity) {
        response.status(400).json({ message: 'Item already purchased.' });
        return;
    }
    if (purchasedRedeemableGiftCard && redeemableGiftCardItem.unlockCondition) {
        const unlockConditionStatus = await getUnlockConditionWithProgress(
            email,
            redeemableGiftCardItem,
            purchasedRedeemableGiftCard,
        );
        if (unlockConditionStatus.progress < 1) {
            response.status(400).json({ message: 'Item not unlocked.' });
            return;
        }
    }
    const giftCardSplit = giftCardType.split('-');
    const amount = parseInt(giftCardSplit[1]);
    await sendGiftCardEmail(email, giftCardSplit[0], amount);
    await purchaseItem(
        email,
        `${Slot.redeemableGiftCard}/${giftCardType}`,
        purchasedQuantity + 1,
        purchasedRedeemableGiftCard?.redeemCount,
        purchasedRedeemableGiftCard?.redeemedAt,
    );
    await redeemGiftCardFromDal(email, itemId);
    response.status(200).json({ message: 'Gift card redeemed.' });
};

export const listAvailableGiftCards = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const email = request.userEmail;
    let giftCards = listStoreInventoryFromDal().filter(
        item => ItemBundle.redeemableGiftCards === item.itemBundle,
    );
    giftCards = giftCards.flatMap(giftCard =>
        giftCard.unlockCondition ? [giftCard] : Array(6).fill(giftCard),
    );
    giftCards = giftCards.sort(() => Math.random() - 0.5);
    const purchasedRedeemableGiftCard = await listPurchasedItemsBySlot(
        email,
        Slot.redeemableGiftCard,
    );
    for await (const giftCard of giftCards) {
        if (giftCard.unlockCondition) {
            const unlockConditionStatus = await getUnlockConditionWithProgress(
                email,
                giftCard,
                purchasedRedeemableGiftCard.find(
                    purchasedItem =>
                        purchasedItem.itemId ===
                        `${Slot.redeemableGiftCard}/${giftCard.name}`,
                ),
            );
            giftCard.unlockCondition = unlockConditionStatus;
        }
    }
    response.status(200).json(giftCards);
};
