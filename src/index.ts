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
            this.buy(trade);
        } else if (trade.type === TradeMove.SELL) {
            this.sell(trade);
        }
    }

    /**
     * Affects the holdings with a sell operation
     * @param trade
     * @private
     */
    private sell(trade: Trade) {
        const ownedAssetQuantity = this.getPositionQuantity(trade.ticker);
        if (ownedAssetQuantity < trade.quantity) {
            throw new Error(`Cannot sell ${trade.quantity} ${trade.ticker} because only ${ownedAssetQuantity} are held`);
        }
        this.updatePrice(trade.ticker,trade.price);

        const tradeCost = trade.price * trade.quantity;
        this.balance += tradeCost;
        this.holdings.set(trade.ticker, ownedAssetQuantity - trade.quantity);

        this.updateCostBasis(trade, -trade.price);
    }

    /**
     * Affects the holdings with a buy operation
     * @param trade
     * @private
     */
    private buy(trade: Trade) {
        const completeCost = trade.price * trade.quantity;
        if (this.balance < completeCost) {
            throw new Error(`Insufficient funds to buy ${trade.quantity} ${trade.ticker} at $${trade.price}`);
        }

        this.updatePrice(trade.ticker,trade.price);

        this.balance -= completeCost;
        const currentQuantity = this.getPositionQuantity(trade.ticker);
        this.holdings.set(trade.ticker, currentQuantity + trade.quantity);

        this.updateCostBasis(trade, completeCost);
    }

    /**
     *
     * @param trade
     * @param tradeCost
     * @private
     */
    private updateCostBasis(trade: Trade, tradeCost: number) {
        const currentCostForTicker = getSafeNull(this.costBasis.get(trade.ticker),0);
        this.costBasis.set(trade.ticker, currentCostForTicker + tradeCost);
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
        const quantity = this.getPositionQuantity(ticker);
        if (quantity === 0) {
            return 0;
        }
        const costBasisForTicker = getSafeOrThrow(this.costBasis.get(ticker), 'Cost basis for ' + ticker + ' is unknown');
        // console.log('paid',costBasisForTicker,'for',quantity)
        return costBasisForTicker / quantity;
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
        if (quantity === 0) {
            return 0;
        }
        return this.getPositionAverageCost(ticker);
    }

    /**
     * @return the estimated profit or loss on a particular asset, assuming it is sold at the current market price.
     * @param ticker
     */
    public getEstimatedUnrealizedProfitLoss(ticker: string): number {
        const quantity = this.getPositionQuantity(ticker);
        if (quantity === 0) {
            return 0;
        }
        const costBasisForTicker = this.getPositionAverageCost(ticker);
        const price = this.getPrice(ticker);
        return (price - costBasisForTicker) * quantity;
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
