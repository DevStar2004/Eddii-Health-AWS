import { isValidReceipt, processPurchase } from './purchases';
import {
    setup,
    validate,
    getPurchaseData,
    isCanceled,
    isExpired,
} from 'in-app-purchase';

jest.mock('in-app-purchase');

describe('iOS Purchases', () => {
    beforeEach(() => {
        process.env['ENV'] = 'dev';
        jest.resetAllMocks();
    });

    describe('isValidReceipt', () => {
        it('should validate receipt', async () => {
            const mockReceipt = 'mockReceipt';
            const mockValidationResponse = { isValid: true };
            (validate as jest.Mock).mockResolvedValue(mockValidationResponse);

            const result = await isValidReceipt(mockReceipt, 'TEST', undefined);

            expect(setup).toHaveBeenCalled();
            expect(validate).toHaveBeenCalledWith(mockReceipt);
            expect(result).toEqual(true);
        });
    });

    describe('processPurchase', () => {
        it('should process purchase', async () => {
            const mockPlatform = 'ios';
            const mockReceipt = 'mockReceipt';
            const mockValidationResponse = {
                latest_receipt: 'mockLatestReceipt',
            };
            const mockPurchaseData = [
                {
                    productId: 'mockProductId',
                    originalTransactionId: 'mockOriginalTransactionId',
                    originalPurchaseDateMs: new Date().getTime(),
                    expiresDateMs: 60000,
                },
            ];
            (validate as jest.Mock).mockResolvedValue(mockValidationResponse);
            (getPurchaseData as jest.Mock).mockReturnValue(mockPurchaseData);
            (isCanceled as jest.Mock).mockReturnValue(false);
            (isExpired as jest.Mock).mockReturnValue(false);

            const result = await processPurchase(
                mockPlatform,
                mockReceipt,
                'TEST',
                undefined,
            );

            expect(setup).toHaveBeenCalled();
            expect(validate).toHaveBeenCalledWith(mockReceipt);
            expect(getPurchaseData).toHaveBeenCalledWith(
                mockValidationResponse,
            );
            expect(result).toEqual({
                productId: mockPurchaseData[0].productId,
                txId: mockPurchaseData[0].originalTransactionId,
                startDate: new Date(
                    mockPurchaseData[0].originalPurchaseDateMs,
                ).toISOString(),
                endDate: new Date(
                    mockPurchaseData[0].expiresDateMs,
                ).toISOString(),
                isCancelled: false,
                isExpired: false,
            });
        });
    });
});

describe('Google Purchases', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    describe('isValidReceipt', () => {
        it('should validate receipt', async () => {
            const mockReceipt = {
                packageName: 'mockPackageName',
                productId: 'mockProductId',
                purchaseToken: 'mockPurchaseToken',
                subscription: true,
            };
            const mockValidationResponse = { isValid: true };
            (validate as jest.Mock).mockResolvedValue(mockValidationResponse);

            const result = await isValidReceipt(mockReceipt, undefined, 'TEST');

            expect(setup).toHaveBeenCalled();
            expect(validate).toHaveBeenCalledWith(mockReceipt);
            expect(result).toEqual(true);
        });
    });

    describe('processPurchase', () => {
        it('should process purchase', async () => {
            const mockPlatform = 'android';
            const mockReceipt = {
                packageName: 'mockPackageName',
                productId: 'mockProductId',
                purchaseToken: 'mockPurchaseToken',
                subscription: true,
            };
            const mockValidationResponse = {
                latest_receipt: 'mockLatestReceipt',
            };
            const mockPurchaseData = [
                {
                    productId: 'mockProductId',
                    transactionId: 'mockOriginalTransactionId',
                    startTime: new Date().getTime(),
                    expirationDate: new Date().getTime() + 60000,
                    lineItems: [
                        {
                            offerDetails: {
                                basePlanId: 'mockBasePlanId',
                            },
                        },
                    ],
                },
            ];
            (validate as jest.Mock).mockResolvedValue(mockValidationResponse);
            (getPurchaseData as jest.Mock).mockReturnValue(mockPurchaseData);
            (isCanceled as jest.Mock).mockReturnValue(false);
            (isExpired as jest.Mock).mockReturnValue(false);

            const result = await processPurchase(
                mockPlatform,
                mockReceipt,
                undefined,
                'TEST',
            );

            expect(setup).toHaveBeenCalled();
            expect(validate).toHaveBeenCalledWith(mockReceipt);
            expect(getPurchaseData).toHaveBeenCalledWith(
                mockValidationResponse,
            );
            expect(result).toEqual({
                productId: 'mockProductId.mockBasePlanId',
                txId: mockPurchaseData[0].transactionId,
                startDate: new Date(
                    mockPurchaseData[0].startTime,
                ).toISOString(),
                endDate: new Date(
                    mockPurchaseData[0].expirationDate,
                ).toISOString(),
                isCancelled: false,
                isExpired: false,
            });
        });
    });
});
