export interface Purchase {
    productId: string;
    txId: string;
    startDate: string;
    endDate: string;
    isCancelled: boolean;
    isExpired: boolean;
}
