export interface Trade {
    ticker: string;
    price: number;
    quantity: number;
    type: TradeMove;
    createdTimestamp: number;
    fee:number;
}

export interface TradeOptions {
    ticker: string;
    price?: number;
    quantity: number;
    type: TradeMove;
    createdTimestamp?: number;
    fee?:number;
}

export enum TradeMove {
    BUY='BUY',
    SELL='SELL'
}

