import {getSafeNull, getSafeOrThrow} from "./utils";

export class WalletSimulator {

    private holdings: Map<string,number>;
    private prices: Map<string,number>;

    constructor(private balance: number) {
        this.holdings = new Map<string,number>();
        this.prices = new Map<string,number>();
    }

    /**
     * Update balance and holdings based on trade
     * @param trade the object to add
     */
    public addTrade(trade: Trade) {
        if (trade.type === TradeMove.BUY) {
            this.buyPosition(trade);
        } else if (trade.type === TradeMove.SELL) {
            this.sellPosition(trade);
        }
    }

    /**
     * Affects the holdings with a sell operation
     * @param trade
     * @private
     */
    private sellPosition(trade: Trade) {
        // TODO: check if there are enough holdings
        const tradeCost = trade.price * trade.quantity;
        this.balance += tradeCost;
        this.holdings.set(trade.ticker, this.getPositionQuantity(trade.ticker) - trade.quantity);
    }

    /**
     * Affects the holdings with a buy operation
     * @param trade
     * @private
     */
    private buyPosition(trade: Trade) {
        // TODO: check if there are enough balance

        const tradeCost = trade.price * trade.quantity;
        this.balance -= tradeCost;
        const currentTickerQuantity = this.getPositionQuantity(trade.ticker);
        this.holdings.set(trade.ticker, currentTickerQuantity + trade.quantity);
    }

    /**
     * Set price for a particular asset
     * @param ticker the asset
     * @param price its new price
     */
    public updatePrice(ticker: string, price: number) {
        this.prices.set(ticker, price);
    }

    /**
     * Return the value owned on this wallet of a particular asset
     * @param ticker asset
     */
    public getPositionValue(ticker: string): number {
        const quantity = getSafeNull(this.holdings.get(ticker),0);
        const price = getSafeOrThrow(this.prices.get(ticker),'Price for '+ticker+' unknown!');
        return quantity * price;
    }

    /**
     * @return sum of all funds in this wallet
     */
    public getTotalValue(): number {
        let totalValue = this.balance;
        for (const ticker of this.holdings.keys()) {
            totalValue += this.getPositionValue(ticker);
        }
        return totalValue;
    }

    /**
     *
     * @param ticker
     * @private
     */
    private getPositionQuantity(ticker: string) {
        return getSafeNull(this.holdings.get(ticker),0);
    }
}

export interface Trade {
    ticker: string;
    price: number;
    quantity: number;
    type: TradeMove;
}

export enum TradeMove {
    BUY='BUY',
    SELL='SELL'
}
