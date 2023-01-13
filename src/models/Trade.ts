export interface Trade {
    ticker: string;
    price: number;
    quantity: number;
    type: TradeMove;
    createdTimestamp: number;
}

export interface TradeOptions {
    ticker: string;
    price?: number;
    quantity: number;
    type: TradeMove;
    createdTimestamp?: number;
}

export enum TradeMove {
    BUY='BUY',
    SELL='SELL'
}

