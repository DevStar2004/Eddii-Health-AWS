export enum ItemBundle {
    // eslint-disable-next-line no-unused-vars
    clothes = 'Clothes',
    // eslint-disable-next-line no-unused-vars
    assets = 'Assets',
    // eslint-disable-next-line no-unused-vars
    eddiiColors = 'eddii Colors',
    // eslint-disable-next-line no-unused-vars
    eddiiPals = 'eddii Pals',
    // eslint-disable-next-line no-unused-vars
    meters = 'Meters',
    // eslint-disable-next-line no-unused-vars
    backgrounds = 'Backgrounds',
    // eslint-disable-next-line no-unused-vars
    halloween = 'Halloween',
    // eslint-disable-next-line no-unused-vars
    thanksgiving = 'Thanksgiving',
    // eslint-disable-next-line no-unused-vars
    badges = 'Badges',
    // eslint-disable-next-line no-unused-vars
    giftCards = 'Gift Cards',
    // eslint-disable-next-line no-unused-vars
    giftCardsTasks = 'Gift Cards Tasks',
    // eslint-disable-next-line no-unused-vars
    redeemableGiftCards = 'Redeemable Gift Cards',
    // eslint-disable-next-line no-unused-vars
    avatars = 'Avatars',
    // eslint-disable-next-line no-unused-vars
    christmas = 'Christmas',
    // eslint-disable-next-line no-unused-vars
    newYear = 'New Year',
    // eslint-disable-next-line no-unused-vars
    bonuses = 'Bonuses',
    // eslint-disable-next-line no-unused-vars
    easter = 'Easter',
}

export enum Slot {
    // eslint-disable-next-line no-unused-vars
    eddiiShoe = 'eddiiShoe',
    // eslint-disable-next-line no-unused-vars
    eddiiNeck = 'eddiiNeck',
    // eslint-disable-next-line no-unused-vars
    eddiiColor = 'eddiiColor',
    // eslint-disable-next-line no-unused-vars
    eddiiBottomRight = 'eddiiBottomRight',
    // eslint-disable-next-line no-unused-vars
    eddiiBottomLeft = 'eddiiBottomLeft',
    // eslint-disable-next-line no-unused-vars
    eddiiTopLeft = 'eddiiTopLeft',
    // eslint-disable-next-line no-unused-vars
    eddiiTopRight = 'eddiiTopRight',
    // eslint-disable-next-line no-unused-vars
    eddiiLeftHand = 'eddiiLeftHand',
    // eslint-disable-next-line no-unused-vars
    eddiiFarLeft = 'eddiiFarLeft',
    // eslint-disable-next-line no-unused-vars
    eddiiCenter = 'eddiiCenter',
    // eslint-disable-next-line no-unused-vars
    meter = 'meter',
    // eslint-disable-next-line no-unused-vars
    background = 'background',
    // eslint-disable-next-line no-unused-vars
    badge = 'badge',
    // eslint-disable-next-line no-unused-vars
    giftCard = 'giftCard',
    // eslint-disable-next-line no-unused-vars
    giftCardTask = 'giftCardTask',
    // eslint-disable-next-line no-unused-vars
    redeemableGiftCard = 'redeemableGiftCard',
    // eslint-disable-next-line no-unused-vars
    avatar = 'avatar',
}

export interface StoreInventoryByItemId {
    [itemId: string]: StoreItem;
}

export interface UnlockCondition {
    streak?: number;
    cgmConnection?: boolean;
    cgmConnectionReferral?: number;
    isPremium?: boolean;
    progress?: number;
    daysSinceLastPurchase?: number;
}

export interface StoreItem {
    name: string;
    cost: number;
    slot: Slot;
    itemBundle: ItemBundle;
    maxQuantity: number;
    itemDescription?: string;
    assetUrl?: string;
    previewUrl?: string;
    unlockCondition?: UnlockCondition;
    filterFromInventory?: boolean;
    disabled?: boolean;
}

export interface PurchasedItem {
    email: string;
    itemId: string;
    quantity: number;
    purchasedAt?: string;
    storeItem?: StoreItem;
    redeemCount?: number;
    redeemedAt?: string;
}
