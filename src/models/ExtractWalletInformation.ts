export interface DonutAssetInfo {
    ticker: string;
    value: number;
    percentage: number;
}

export interface TrendSnapshotInfo {
    date: Date;
    value: number;
    prices: Map<string,number>;
}

export interface OrderMovementInfo {
    symbol: string;
    volume: string;
    side: string;
    notional: string;
    valueAt: string;
    date: string;
    profit: number|undefined;
    fees: string;
    order_id:string;
}