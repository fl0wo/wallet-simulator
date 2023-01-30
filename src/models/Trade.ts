export interface Trade {
    ticker: string;
    price: number;
    quantity: number;
    type: TradeMove;
    createdTimestamp: number;
    fee:number;
    id:string;
    profit?:number;
}

export interface TradeOptions {
    ticker: string;
    price?: number;
    quantity: number;
    type: TradeMove;
    createdTimestamp?: number;
    fee?:number;
    id?:string;
}

export enum TradeMove {
    BUY='BUY',
    SELL='SELL'
}

