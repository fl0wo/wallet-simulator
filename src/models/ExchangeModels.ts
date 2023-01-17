export interface ExchangeTrade {
    timestamp: number;
    symbol: string;
    id:string;
    order: string;
    side: 'sell'|'buy',
    price: number,
    amount: number,
    cost: number, // notional
    fee: {
        cost: number,
        currency: string
    },
    fees: Array<any>
}