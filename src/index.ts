import {getSafeNull, getSafeOrThrow} from "./utils";

export class WalletSimulator {

    private holdings: Map<string,number>;
    private prices: Map<string,number>;
    private costBasis: Map<string,number>;

    constructor(public balance: number) {
        this.holdings = new Map<string,number>();
        this.prices = new Map<string,number>();
        this.costBasis = new Map<string,number>();
    }

    /**First class commit
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
        const ownedAssetQuantity = this.getPositionQuantity(trade.ticker);
        if (ownedAssetQuantity < trade.quantity) {
            throw new Error(`Cannot sell ${trade.quantity} ${trade.ticker} because only ${ownedAssetQuantity} are held`);
        }
        const tradeCost = trade.price * trade.quantity;
        this.balance += tradeCost;
        this.holdings.set(trade.ticker, ownedAssetQuantity - trade.quantity);
    }

    /**
     * Affects the holdings with a buy operation
     * @param trade
     * @private
     */
    private buyPosition(trade: Trade) {
        const tradeCost = trade.price * trade.quantity;

        if (this.balance < tradeCost) {
            throw new Error(`Insufficient funds to buy ${trade.quantity} ${trade.ticker} at $${trade.price}`);
        }
        this.balance -= tradeCost;
        const currentTickerQuantity = this.getPositionQuantity(trade.ticker);
        this.holdings.set(trade.ticker, currentTickerQuantity + trade.quantity);

        this.updateCostBasis(trade, currentTickerQuantity, tradeCost);
    }

    /**
     *
     * @param trade
     * @param currentTickerQuantity
     * @param tradeCost
     * @private
     */
    private updateCostBasis(trade: Trade, currentTickerQuantity:number, tradeCost: number) {
        if (this.costBasis.hasOwnProperty(trade.ticker)) {
            const costBasisForTicker = getSafeNull(this.costBasis.get(trade.ticker),0);
            const costBase = (costBasisForTicker * currentTickerQuantity + tradeCost) / (currentTickerQuantity + trade.quantity);
            this.costBasis.set(trade.ticker, costBase);
        } else {
            this.costBasis.set(trade.ticker, tradeCost / trade.quantity);
        }
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
        const price = this.getPrice(ticker);
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
     * @return the quantity of a particular asset held in the wallet.
     * @param ticker
     * @private
     */
    getPositionQuantity(ticker: string) {
        return getSafeNull(this.holdings.get(ticker),0);
    }


    /**
     * @return the average cost of a position in a particular asset.
     * @param ticker
     */
    public getPositionAverageCost(ticker: string): number {
        return getSafeNull(this.costBasis.get(ticker),0);
    }

    /**
     * @return the current price of a particular asset.
     * @param ticker
     */
    public getPrice(ticker: string): number {
        return getSafeOrThrow(this.prices.get(ticker),`Price for ${ticker} is unknown`);
    }

    /**
     * @return the estimated price at which all of a particular asset could be sold to fully liquidate the position.
     * @param ticker
     */
    public getEstimatedLiquidationPrice(ticker: string): number {
        const quantity = this.getPositionQuantity(ticker);
        const totalCost = getSafeNull(this.costBasis.get(ticker),0) * quantity;
        return (totalCost + this.balance) / quantity;
    }

    /**
     * @return the estimated profit or loss on a particular asset, assuming it is sold at the current market price.
     * @param ticker
     */
    public getEstimatedUnrealizedProfitLoss(ticker: string): number {
        return this.getPositionValue(ticker) - getSafeNull(this.costBasis.get(ticker),0) * this.getPositionQuantity(ticker);
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
