import { Request, Response } from 'lambda-api';
import {
    getUser as getUserFromDal,
    updateUserProfile as updateUserProfileFromDal,
    updateUserNotificationSettings as updateUserNotificationSettingsFromDal,
    updateUserAlertSettings as updateUserAlertSettingsFromDal,
    equipStoreItemForUser as equipStoreItemForUserFromDal,
    addHeartsForUser as addHeartsForUserFromDal,
    spendHearts,
    getStoreItem as getStoreItemFromDal,
    Slot,
    resetStoreItemsForUser,
    StoreItem,
    hasPurchasedItem,
} from '@eddii-backend/dal';
import {
    validPhoneNumber,
    validSmallString,
    validLocale,
    validStoreItemSlot,
    isValidDate,
} from '@eddii-backend/utils';

const GAME_PRICE = 2;

/**
 * Calculates the age based on a given date.
 * @param birthday The date object representing the birthday.
 * @returns The calculated age as a number.
 */
const getAge = (birthday: Date): number => {
    const today = new Date();
    let age = today.getFullYear() - birthday.getFullYear();
    const monthDifference = today.getMonth() - birthday.getMonth();

    if (
        monthDifference < 0 ||
        (monthDifference === 0 && today.getDate() < birthday.getDate())
    ) {
        age--;
    }

    return age;
};

export const getUser = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const email = request.userEmail;
    const user = await getUserFromDal(email);
    if (!user) {
        response.status(404).json({ message: 'User not found.' });
        return;
    }
    let avatarWithCdnInfo = null;
    if (user.avatar) {
        avatarWithCdnInfo = getStoreItemFromDal(user.avatar, Slot.avatar);
    }
    let badgesWithCdnInfo = null;
    if (user.badges?.length > 0) {
        badgesWithCdnInfo = user.badges.map(badge =>
            getStoreItemFromDal(badge, Slot.badge),
        );
    }
    let eddiiEquippedItemsWithCdnInfo = {};
    if (user.eddiiEquippedItems) {
        eddiiEquippedItemsWithCdnInfo = Object.keys(
            user.eddiiEquippedItems,
        ).reduce((acc, slot) => {
            const oldItem = user.eddiiEquippedItems[slot] ?? null;
            if (oldItem && typeof oldItem === 'string') {
                acc[slot] = getStoreItemFromDal(oldItem, Slot[slot]);
            } else if (oldItem) {
                acc[slot] = getStoreItemFromDal(
                    (oldItem as StoreItem).name,
                    Slot[slot],
                );
            }
            return acc;
        }, {});
    }
    // Check if eddii color is set, if not, set it to the default.
    if (!eddiiEquippedItemsWithCdnInfo[Slot.eddiiColor]) {
        eddiiEquippedItemsWithCdnInfo[Slot.eddiiColor] = getStoreItemFromDal(
            'original',
            Slot.eddiiColor,
        );
    }
    const isChild = user.birthday
        ? getAge(new Date(user.birthday)) < 18
        : user.ageRange && user.ageRange !== 'More than 21';

    response.status(200).json({
        ...user,
        // Fill out the full store attributes so that it includes the CDN information.
        ...(user.avatar ? { avatar: avatarWithCdnInfo } : {}),
        ...(user.badges?.length > 0 ? { badges: badgesWithCdnInfo } : {}),
        eddiiEquippedItems: eddiiEquippedItemsWithCdnInfo,
        mode: isChild ? 'child' : 'adult',
    });
};

export const equipStoreItemForUserEddii = async (
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
    const user = await getUserFromDal(email);
    if (!user) {
        response.status(404).json({ message: 'User not found.' });
        return;
    }
    const itemId = `${itemSlot}/${itemName}`;
    const purchasedQuantity = await hasPurchasedItem(email, itemId);
    if (purchasedQuantity === 0) {
        response.status(400).json({ message: 'Item not purchased.' });
        return;
    }
    const item = getStoreItemFromDal(itemName, Slot[itemSlot]);
    const userToReturn = await equipStoreItemForUserFromDal(email, item);
    response.status(200).json(userToReturn);
};

export const resetItemsForUserEddii = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const email = request.userEmail;
    const user = await getUserFromDal(email);
    if (!user) {
        response.status(404).json({ message: 'User not found.' });
        return;
    }
    const userToReturn = await resetStoreItemsForUser(email);
    response.status(200).json(userToReturn);
};

export const playGame = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const email = request.userEmail;
    const user = await getUserFromDal(email);
    if (!user) {
        response.status(404).json({ message: 'User not found.' });
        return;
    }
    if (user.hearts < GAME_PRICE) {
        response.status(400).json({ message: 'Not enough hearts.' });
        return;
    }
    const userToReturn = await spendHearts(email, GAME_PRICE);
    if (!userToReturn) {
        // Race condition if hearts are depleted between the check and the play
        response.status(400).json({ message: 'Not enough hearts.' });
        return;
    }
    response.status(200).json(userToReturn);
};

export const finishQuiz = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const email = request.userEmail;
    const user = await getUserFromDal(email);
    const fetchedUser = await addHeartsForUserFromDal(
        email,
        1,
        user.dailyHeartsLimit,
        user.dailyHeartsLimitDate,
    );
    response.status(200).json({ user: fetchedUser });
};

function isValidTimeZone(tz) {
    if (!Intl || !Intl.DateTimeFormat().resolvedOptions().timeZone) {
        throw new Error('Time zones are not available in this environment');
    }

    try {
        Intl.DateTimeFormat(undefined, { timeZone: tz });
        return true;
    } catch (ex) {
        return false;
    }
}

export const updateUserProfile = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const email = request.userEmail;
    if (!request.body) {
        response.status(400).json({ message: 'Missing body.' });
        return;
    }
    const {
        nickname,
        locale,
        zoneinfo,
        ageRange,
        birthday,
        diabetesInfo,
        phoneNumber,
        avatar,
        badges,
    } = request.body;
    if (
        !nickname &&
        !locale &&
        !zoneinfo &&
        !ageRange &&
        !birthday &&
        !diabetesInfo &&
        !phoneNumber &&
        !avatar &&
        !badges
    ) {
        response.status(400).json({
            message:
                'At least one of nickname, locale, zoneinfo, ageRange, birthday, diabetesInfo, phoneNumber, avatar, badges is required.',
        });
        return;
    }
    if (nickname && !validSmallString(nickname)) {
        response.status(400).json({ message: 'Invalid nickname.' });
        return;
    }
    if (locale && !validLocale(locale)) {
        response.status(400).json({ message: 'Invalid locale.' });
        return;
    }
    if (zoneinfo && !isValidTimeZone(zoneinfo)) {
        response.status(400).json({ message: 'Invalid zoneinfo.' });
        return;
    }
    if (ageRange && !validSmallString(ageRange)) {
        response.status(400).json({ message: 'Invalid ageRange.' });
        return;
    }
    if (birthday && !isValidDate(birthday)) {
        response.status(400).json({ message: 'Invalid birthday.' });
        return;
    }
    if (diabetesInfo && !validSmallString(diabetesInfo)) {
        response.status(400).json({ message: 'Invalid diabetesInfo.' });
        return;
    }
    if (phoneNumber && !validPhoneNumber(phoneNumber)) {
        response.status(400).json({ message: 'Invalid phoneNumber.' });
        return;
    }

    if (phoneNumber) {
        // Validate that the phone number provided matches that in the users cognito attributes
        const userAttributes = request.requestContext.authorizer.claims;
        if (userAttributes['phone_number'] !== phoneNumber) {
            response.status(400).json({
                message:
                    'Phone number does not match that in the user profile.',
            });
            return;
        }
        if (userAttributes['phone_number_verified'] !== 'true') {
            response.status(400).json({
                message: 'Phone number is not verified.',
            });
            return;
        }
    }
    if (avatar) {
        const itemId = `${Slot.avatar}/${avatar}`;
        const storeItem = getStoreItemFromDal(avatar, Slot.avatar);
        const purchasedQuantity = await hasPurchasedItem(email, itemId);
        if (purchasedQuantity === 0 && storeItem?.cost > 0) {
            response.status(400).json({ message: 'Item not purchased.' });
            return;
        }
    }
    if (badges) {
        if (!Array.isArray(badges)) {
            response.status(400).json({ message: 'Badges must be an array.' });
            return;
        }
        if (badges.length > 20) {
            response.status(400).json({ message: 'Too many badges.' });
            return;
        }
        const badgeSet = new Set(badges);
        for (const badge of badgeSet) {
            const itemId = `${Slot.badge}/${badge}`;
            const purchasedQuantity = await hasPurchasedItem(email, itemId);
            if (purchasedQuantity === 0) {
                response.status(400).json({ message: 'Item not purchased.' });
                return;
            }
        }
    }

    const user = await updateUserProfileFromDal({
        email,
        nickname,
        locale,
        zoneinfo,
        ageRange,
        birthday,
        diabetesInfo,
        phoneNumber,
        avatar,
        badges,
    });
    response.status(200).json(user);
};

export const updateUserNotificationSettings = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const email = request.userEmail;
    if (!request.body) {
        response.status(400).json({ message: 'Missing body.' });
        return;
    }
    const { glucoseAlerts, dailyAlerts } = request.body;
    if (glucoseAlerts === undefined && dailyAlerts === undefined) {
        response.status(400).json({
            message: 'At least one of glucoseAlerts, dailyAlerts is required.',
        });
        return;
    }
    if (
        glucoseAlerts !== undefined &&
        glucoseAlerts !== true &&
        glucoseAlerts !== false
    ) {
        response.status(400).json({ message: 'Invalid glucoseAlerts value.' });
        return;
    }

    if (
        dailyAlerts !== undefined &&
        dailyAlerts !== true &&
        dailyAlerts !== false
    ) {
        response.status(400).json({ message: 'Invalid dailyAlerts value.' });
        return;
    }

    const user = await updateUserNotificationSettingsFromDal(
        email,
        glucoseAlerts,
        dailyAlerts,
    );
    response.status(200).json(user);
};

export const updateUserAlertSettings = async (
    request: Request,
    response: Response,
): Promise<void> => {
    const email = request.userEmail;
    if (!request.body) {
        response.status(400).json({ message: 'Missing body.' });
        return;
    }
    const { lowGlucoseAlertThreshold, highGlucoseAlertThreshold } =
        request.body;

    if (
        lowGlucoseAlertThreshold !== undefined &&
        (typeof lowGlucoseAlertThreshold !== 'number' ||
            lowGlucoseAlertThreshold < 0)
    ) {
        response
            .status(400)
            .json({ message: 'Invalid lowGlucoseAlertThreshold value.' });
        return;
    }
    if (
        lowGlucoseAlertThreshold !== undefined &&
        lowGlucoseAlertThreshold > 80
    ) {
        response
            .status(400)
            .json({ message: 'Low Glucose Alert must be <=80.' });
        return;
    }

    if (
        highGlucoseAlertThreshold !== undefined &&
        (typeof highGlucoseAlertThreshold !== 'number' ||
            highGlucoseAlertThreshold < 0)
    ) {
        response
            .status(400)
            .json({ message: 'Invalid highGlucoseAlertThreshold value.' });
        return;
    }
    if (
        highGlucoseAlertThreshold !== undefined &&
        highGlucoseAlertThreshold < 120
    ) {
        response
            .status(400)
            .json({ message: 'High Glucose Alert must be >=120.' });
        return;
    }

    const user = await updateUserAlertSettingsFromDal(
        email,
        lowGlucoseAlertThreshold,
        highGlucoseAlertThreshold,
    );
    response.status(200).json(user);
};
