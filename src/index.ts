import {tradeOptionToTrade, getSafeNull, getSafeOrThrow} from "./utils/general";
import {Trade, TradeMove, TradeOptions} from "./models/Trade";
import {DonutAssetInfo} from "./models/ExtractWalletInformation";

export class WalletSimulator {

    private holdings: Map<string,number>;
    private prices: Map<string,number>;
    private costBasis: Map<string,number>;
    private _trades: Array<Trade> =[];

    private readonly _creationAt:Date;

    constructor(public balance: number) {
        this.holdings = new Map<string,number>();
        this.prices = new Map<string,number>();
        this.costBasis = new Map<string,number>();
        this._creationAt = new Date();
    }

    /**
     * First class commit
     * Update balance and holdings based on incTrade
     * @param incTrade the object to add
     */
    public addTrade(incTrade: TradeOptions) {
        const trade = tradeOptionToTrade(
            incTrade,
            this.getPriceIfDefined(incTrade.ticker)
        );
        if (trade.type === TradeMove.BUY) {
            if(this.buy(trade)) {
                this._trades.push(trade);
            }
        }
        else if (trade.type === TradeMove.SELL) {
            if(this.sell(trade)){
                this._trades.push(trade);
            }
        }
        return this;
    }

    /**
     * Set price for a particular asset
     * @param ticker the asset
     * @param price its new price
     */
    public updatePrice(ticker: string, price: number) {
        if(!this.isPriceDefined(ticker) || price!==this.getPrice(ticker)){
            this.prices.set(ticker, price);
        }
        return this;
    }

    /**
     * @return the quantity of a particular asset held in the wallet.
     * @param ticker
     * @private
     */
    public getPositionQuantity(ticker: string) {
        return getSafeNull(this.holdings.get(ticker),0);
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

    /**
     * @return the current price of a particular asset.
     * @param ticker
     */
    public getPrice(ticker: string): number {
        return getSafeOrThrow(this.prices.get(ticker),`Price for ${ticker} is unknown`);
    }

    public isPriceDefined(ticker: string): boolean {
        return this.prices.has(ticker)
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
     * Return the value owned on this wallet of a particular asset
     * @param ticker asset
     */
    public getPositionValue(ticker: string): number {
        const quantity = getSafeNull(this.holdings.get(ticker),0);
        const price = this.getPrice(ticker);
        return quantity * price;
    }

    /**
     * @return the list of assets owned, with their balance and % occupying on the wallet
     */
    public getDonutAssetInformation(): Array<DonutAssetInfo> {
        const totalValue = this.getTotalValue();
        const assetsInfo = Array.from(this.holdings.keys()).map(ticker => {
            const value = this.getPositionValue(ticker);
            return {
                ticker,
                value,
                percentage: (value/totalValue) * 100
            };
        });
        assetsInfo.push({ ticker: "$", value: this.balance, percentage: (this.balance/totalValue) * 100 });
        return assetsInfo;
    }

    /**
     * @return all trades made so far
     */
    get trades(): Array<Trade> {
        return this._trades;
    }

    set trades(value: Array<Trade>) {
        this._trades = value;
        // Simulate all new trades
        this.trades.forEach((el)=>this.addTrade(el));
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

        return true;
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

        return true;
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
     * Returns when this wallet was instantiated
     */
    get creationAt(): Date {
        return this._creationAt;
    }

    private getPriceIfDefined(ticker: string) {
        if(this.isPriceDefined(ticker)){
            return this.getPrice(ticker)
        }

        return undefined;
    }
}
