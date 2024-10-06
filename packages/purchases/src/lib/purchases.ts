import {
    config,
    setup,
    validate,
    getPurchaseData,
    isCanceled,
    isExpired,
} from 'in-app-purchase';
import { Purchase } from './purchases-types';

const GOOGLE_PLAY_RECEIPT_VALIDATOR_EMAILS: { [key: string]: string } = {
    dev: 'receipt-validator@eddii-dev.iam.gserviceaccount.com',
    sandbox: 'receipt-validator@eddii-sandbox.iam.gserviceaccount.com',
    staging: 'receipt-validator@eddii-staging.iam.gserviceaccount.com',
    prod: 'receipt-validator@eddii-prod.iam.gserviceaccount.com',
};

const setupConfig = async (
    appleSharedSecret: string | undefined,
    googlePrivateKey: string | undefined,
) => {
    if (!process.env['ENV']) {
        throw new Error("Missing 'ENV' environment variable.");
    }
    config({
        appleExcludeOldTransactions: true,
        applePassword: appleSharedSecret,
        googleServiceAccount: googlePrivateKey
            ? {
                  clientEmail:
                      GOOGLE_PLAY_RECEIPT_VALIDATOR_EMAILS[process.env['ENV']],
                  privateKey: googlePrivateKey,
              }
            : undefined,
        test:
            process.env['ENV'] === 'dev' ||
            process.env['ENV'] === 'sandbox' ||
            process.env['ENV'] === 'staging',
    });
    await setup();
};

export const isValidReceipt = async (
    receipt:
        | string
        | {
              packageName: string;
              productId: string;
              purchaseToken: string;
              subscription: boolean;
          },
    appleSharedSecret: string | undefined,
    googlePrivateKey: string | undefined,
): Promise<boolean> => {
    await setupConfig(appleSharedSecret, googlePrivateKey);
    try {
        await validate(receipt);
        return true;
    } catch (err) {
        console.error(err);
        return false;
    }
};

export const processPurchase = async (
    platform: string,
    receipt:
        | string
        | {
              packageName: string;
              productId: string;
              purchaseToken: string;
              subscription: boolean;
          },
    appleSharedSecret: string | undefined,
    googlePrivateKey: string | undefined,
): Promise<Purchase | undefined> => {
    await setupConfig(appleSharedSecret, googlePrivateKey);
    const validationResponse: any = await validate(receipt);
    const purchaseData: any = getPurchaseData(validationResponse);
    if (!purchaseData || purchaseData.length === 0) {
        return undefined;
    }
    const firstPurchaseItem = purchaseData[0];
    const productId =
        platform === 'ios'
            ? firstPurchaseItem.productId
            : `${firstPurchaseItem.productId}.${firstPurchaseItem.lineItems[0].offerDetails.basePlanId}`;
    const txId =
        platform === 'ios'
            ? firstPurchaseItem.originalTransactionId
            : firstPurchaseItem.transactionId;
    const startDate =
        platform === 'ios'
            ? new Date(firstPurchaseItem.originalPurchaseDateMs).toISOString()
            : new Date(firstPurchaseItem.startTime).toISOString();
    const endDate =
        platform === 'ios'
            ? new Date(firstPurchaseItem.expiresDateMs).toISOString()
            : new Date(firstPurchaseItem.expirationDate).toISOString();
    return {
        productId,
        txId,
        startDate,
        endDate,
        isCancelled: isCanceled(firstPurchaseItem),
        isExpired: isExpired(firstPurchaseItem),
    };
};
