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