import {
    AutoRenewStatus,
    NotificationSubtype,
    NotificationType,
    OfferType,
    SubscriptionStatus,
} from 'app-store-server-api';

export enum SubscriptionPlatform {
    // eslint-disable-next-line no-unused-vars
    ios = 'ios',
    // eslint-disable-next-line no-unused-vars
    android = 'android',
}

export abstract class Subscription {
    email: string;
    platform: SubscriptionPlatform;
    startDate: string;
    endDate: string;
    subscriptionId: string;
    txId: string;
    lastSyncedDate?: string;

    constructor(
        email: string,
        startDate: string,
        endDate: string,
        subscriptionId: string,
        txId: string,
        platform: SubscriptionPlatform,
    ) {
        this.email = email;
        this.startDate = startDate;
        this.endDate = endDate;
        this.subscriptionId = subscriptionId;
        this.txId = txId;
        this.platform = platform;
    }
}

export class AppleSubscription extends Subscription {
    constructor(
        email: string,
        startDate: string,
        endDate: string,
        productId: string,
        txId: string,
    ) {
        super(
            email,
            startDate,
            endDate,
            productId,
            txId,
            SubscriptionPlatform.ios,
        );
    }

    // Apple-specific fields
    latestNotificationType?: NotificationType;
    latestNotificationSubtype?: NotificationSubtype;
    status?: SubscriptionStatus;

    // Renewal info - https://developer.apple.com/documentation/appstoreservernotifications/jwsrenewalinfodecodedpayload
    autoRenewStatus?: AutoRenewStatus;
    autoRenewProductId?: string;
    expirationIntent?: number;
    offerType?: OfferType;

    // Transaction info - https://developer.apple.com/documentation/appstoreservernotifications/jwstransactiondecodedpayload
    revocationDate?: number;
    revocationReason?: number;
}

export class GoogleSubscription extends Subscription {
    constructor(
        email: string,
        startDate: string,
        endDate: string,
        productId: string,
        txId: string,
    ) {
        super(
            email,
            startDate,
            endDate,
            productId,
            txId,
            SubscriptionPlatform.android,
        );
    }

    // Google-specific fields
    notificationType?: number;
    linkedPurchaseToken?: string;
    subscriptionState?: string;
    autoRenewingPlan?: boolean;
    offerId?: string;
}
