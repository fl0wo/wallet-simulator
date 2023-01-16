import {TradeMove} from "./Trade";

export interface DonutAssetInfo {
    ticker: string;
    value: number;
    percentage: number;
}

export interface TrendSnapshotInfo {
    date: Date;
    value: number;
    prices: { [ticker: string]: number };
}

export interface OrderMovementInfo {
    ticker: string;
    quantity: number;
    side: TradeMove;
    notional: string;
    priceAt: number;
    date: number;
    profit: number|undefined;
    fee: number;
    orderId:string;
}