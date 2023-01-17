import {
    addFee,
    cloneObj,
    fillTimestreamGapsWithLastRecord,
    getSafeNull,
    getSafeOrThrow,
    objToArrayKeys,
    onlyNotBought,
    removeFee,
    toDate,
    todayDateNoTime,
    tradeOptionToTrade,
    updateAssetsOnWallet,
    updatePricesOnWallet
} from "./utils/general";
import {Trade, TradeMove, TradeOptions} from "./models/Trade";
import {DonutAssetInfo, OrderMovementInfo, TrendSnapshotInfo} from "./models/ExtractWalletInformation";
import {daysBefore} from "./utils/mock";
import {ExchangeTrade} from "./models/ExchangeModels";

export class WalletSimulator {

    private readonly holdings: { [ticker: string]: number };
    private readonly prices: { [ticker: string]: number };
    private costBasis: { [ticker: string]: number };
    private _trades: Array<Trade> = [];
    private daySnapshots: { [date: string]: TrendSnapshotInfo };
    public balanceAtWalletCreation: number = 0;
    private readonly _creationAt: string;
    private allowNegativeBalance:boolean = false;
    private allowNegativeHeld:boolean = false;

    constructor(public balance: number, overrides:any={}) {
        this.holdings = {};
        this.prices = {};
        this.costBasis = {};
        this.daySnapshots = {};
        this.balanceAtWalletCreation = this.balance;
        this._creationAt = getSafeNull(overrides.creationDate, new Date().toISOString());

        Object.keys(overrides).forEach((el)=>{
            if(overrides[el]){
                // @ts-ignore
                this[el]=overrides[el];
            }
        })
    }

    /**
     * First class commit
     * Update balance and holdings based on incTrade
     * @param incTrade the object to add
     */
    public addTrade(incTrade: TradeOptions) {
        const trade = tradeOptionToTrade(incTrade, this.getPriceIfDefined(incTrade.ticker));
        if (trade.type === TradeMove.BUY) {
            if (this.buy(trade)) {
                this._trades.push(trade);
            }
        } else if (trade.type === TradeMove.SELL) {
            if (this.sell(trade)) {
                this._trades.push(trade);
            }
        }

        this.updateTodayBalance(incTrade.createdTimestamp);

        return this;
    }

    /**
     * Set price for a particular asset
     * @param ticker the asset
     * @param price its new price
     * @param nowTimestamp
     */
    public updatePrice(ticker: string, price: number,nowTimestamp?:number) {
        if(!this.isPriceDefined(ticker) || price!==this.getPrice(ticker)){
            this.prices[ticker]=price;
            this.updateTodayBalance(nowTimestamp);
        }
        return this;
    }

    /**
     * @return the quantity of a particular asset held in the wallet.
     * @param ticker
     * @private
     */
    public getPositionQuantity(ticker: string) {
        return getSafeNull(this.holdings[ticker], 0);
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
        return getSafeOrThrow(this.prices[ticker],`Price for ${ticker} is unknown`);
    }

    public isPriceDefined(ticker: string): boolean {
        return !!this.prices[ticker]
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
        const costBasisForTicker = getSafeOrThrow(this.costBasis[ticker], 'Cost basis for ' + ticker + ' is unknown');
        // console.log('paid',costBasisForTicker,'for',quantity)
        return costBasisForTicker / quantity;
    }

    /**
     * @return sum of all funds in this wallet
     */
    public getTotalValue(): number {
        let totalValue = this.balance;
        for (const ticker of Object.keys(this.holdings)) {
            totalValue += this.getPositionValue(ticker);
        }
        return totalValue;
    }

    /**
     * Return the value owned on this wallet of a particular asset
     * @param ticker asset
     */
    public getPositionValue(ticker: string): number {
        const quantity = getSafeNull(this.holdings[ticker],0);
        const price = this.getPrice(ticker);
        return quantity * price;
    }

    /**
     * @return the list of assets owned, with their balance and % occupying on the wallet
     */
    public getDonutAssetInformation(): Array<DonutAssetInfo> {
        const totalValue = this.getTotalValue();
        const assetsInfo = Array.from(Object.keys(this.holdings)).map(ticker => {
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

    public getTrendBalanceSnapshots(backDays: number, now?:Date): Array<TrendSnapshotInfo> {
        const nowDate:Date = getSafeNull(now,new Date());
        const today = daysBefore(nowDate,1).getTime();
        const pastDate = daysBefore(nowDate,backDays).getTime();

        const result = this.sortedDaySnapshotsOnRange(pastDate, today);

        return fillTimestreamGapsWithLastRecord(result, nowDate,{
            date:nowDate.toISOString(),
            value:-1,
            prices:this.prices
        });
    }

    public getTrendBalanceSnapshotsBuyAndHold(backDays: number,now?:Date): Array<TrendSnapshotInfo> {
        const allAssetsToBuy = this.getAllOwnedAssets();
        const allAssetsToHold:Array<string> = []

        const nowDate:Date = getSafeNull(now,new Date());
        const today = daysBefore(nowDate,1).getTime();
        const pastDate = daysBefore(nowDate,backDays).getTime();

        const result:Array<TrendSnapshotInfo> = [];

        const totBuyHoldBalance = this.balanceAtWalletCreation;
        const sliceForEveryAsset = (totBuyHoldBalance/(allAssetsToBuy.length+1)) // a slice also for base currency

        const buyHoldWallet = new WalletSimulator(totBuyHoldBalance);

        const sortedResults = this.sortedDaySnapshotsOnRange(pastDate, today);

        sortedResults.forEach((value) => {
            const dateValue = value.date
            const allKnownAssetPrices:Array<string> = objToArrayKeys(value.prices);

            // Among all known assets, take the one we still have to buy and haven't bought yet
            const toBuyNowAssets = onlyNotBought(allKnownAssetPrices,allAssetsToBuy,allAssetsToHold)

            // Now start holding it
            toBuyNowAssets.forEach((buyNowAsset)=>allAssetsToHold.push(buyNowAsset));

            // Add new bought assets to the buy/hold wallet
            toBuyNowAssets.forEach(updateAssetsOnWallet(value, buyHoldWallet, sliceForEveryAsset))

            // Update the pricing hashmap on buy/hold wallet
            allKnownAssetPrices.forEach(updatePricesOnWallet(value, buyHoldWallet));

            // Push new snapshot
            result.push({date: dateValue, value: buyHoldWallet.getTotalValue(), prices:value.prices });
        });

        return fillTimestreamGapsWithLastRecord(result, nowDate,{
            date:nowDate.toISOString(),
            value:-1,
            prices:this.prices
        });
    }

    private sortedDaySnapshotsOnRange(pastDate: number, today: number) {
        const result:Array<TrendSnapshotInfo> = [];
        objToArrayKeys(this.daySnapshots)
            .forEach((key:string) => {
                const value = this.daySnapshots[key]
                const dateValue = value.date
                if (toDate(dateValue).getTime() >= pastDate && toDate(dateValue).getTime() <= today) {
                    result.push(value);
                }
        });
        return result
            .sort((a, b) => toDate(a.date).getTime() - toDate(b.date).getTime());
    }

    /**
     * Returns the list of trades made, but as 'order movement info'
     * It also includes an info related to each trade decision showing the profit/loss each (sell) order has done to the wallet.
     *
     * @param orders
     */
    plMadeByOrders(orders?: Trade[]): Array<OrderMovementInfo> {
        const allOrders = getSafeNull(orders,this.trades);

        const profitsMap:any = this.calculateProfitsMap(allOrders);

        const movements = allOrders.map((el:Trade) => {
            const notionalCalculated:number = el.quantity * el.price;
            const profitCalculated = getSafeNull(profitsMap[el.id], undefined);

            const x: OrderMovementInfo = {
                date: el.createdTimestamp,
                fee: el.fee,
                notional: String(notionalCalculated),
                orderId: el.id,
                profit: profitCalculated,
                side: el.type,
                ticker: el.ticker,
                priceAt: el.price,
                quantity: el.quantity
            };

            return x;
        });

        return movements;
    }

    calculateProfitsMap(orders: Trade[]): Array<OrderMovementInfo> {

        const ordersWithProfits:any = {};
        const totals:any = {};
        const recentBuyOrders: any = {};

        for (let i = orders.length - 1; i >= 0; i--) {
            const order: Trade = orders[i];

            const volume = order.quantity;
            const valueAt = order.price;
            const fees = order.fee;
            const notional = volume * valueAt;
            const symbol = order.ticker;

            let profit;
            if (order.type === TradeMove.SELL) {
                // If the order is a sell, initialize the running totals for this symbol
                totals[symbol] = {
                    volume: 0,
                    cost: 0,
                    buyOrders: []
                };
                // Find the last 5 buy orders for this symbol
                for (let j = i - 1; j >= 0; j--) {
                    const oldOrder:Trade = orders[j];
                    if (oldOrder.type === TradeMove.BUY && oldOrder.ticker === symbol) {
                        totals[symbol].buyOrders.push(oldOrder);
                        if(totals[symbol].buyOrders.length === 5) {
                            break;
                        }
                    } else if (oldOrder.type === TradeMove.SELL && oldOrder.ticker === symbol) {
                        break;
                    }
                }

                // Calculate the average cost basis using the last 5 buy orders for this symbol
                let costBasis = 0;
                if (totals[symbol].buyOrders.length > 0) {
                    for (const buyOrder of totals[symbol].buyOrders) {
                        const oldVolume = buyOrder.quantity;
                        const oldValueAt = buyOrder.price;
                        // Update the running totals for this symbol
                        totals[symbol].volume += oldVolume;
                        totals[symbol].cost += oldVolume * oldValueAt;
                    }
                    costBasis = totals[symbol].cost / totals[symbol].volume;
                }
                // Calculate the profit using the average cost basis for this symbol
                profit = (notional - costBasis * volume) + (fees);
            }

            ordersWithProfits[order.id] = profit;
        }

        return ordersWithProfits;
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
        if (!this.allowNegativeHeld && ownedAssetQuantity < trade.quantity) {
            throw new Error(`Cannot sell ${trade.quantity} ${trade.ticker} because only ${ownedAssetQuantity} are held`);
        }
        this.updatePrice(trade.ticker,trade.price);

        const tradeCost = trade.price * trade.quantity;
        this.balance += removeFee(tradeCost,trade.fee);
        this.holdings[trade.ticker]= Math.max(0,ownedAssetQuantity - trade.quantity);

        this.updateCostBasis(trade, -trade.price);

        return true;
    }

    /**
     * Affects the holdings with a buy operation
     * @param trade
     * @private
     */
    private buy(trade: Trade) {
        const completeCostNoFees = trade.price * trade.quantity
        const completeCost = addFee(trade.price * trade.quantity,trade.fee)
        if (!this.allowNegativeBalance && this.balance < completeCost) {
            throw new Error(`Insufficient funds to buy ${trade.quantity} ${trade.ticker} at $${trade.price}`);
        }

        this.updatePrice(trade.ticker,trade.price,trade.createdTimestamp);

        this.balance -= completeCost;
        const currentQuantity = this.getPositionQuantity(trade.ticker);
        this.holdings[trade.ticker]=(currentQuantity + trade.quantity);

        this.updateCostBasis(trade, completeCostNoFees);

        return true;
    }

    /**
     *
     * @param trade
     * @param tradeCost
     * @private
     */
    private updateCostBasis(trade: Trade, tradeCost: number) {
        const currentCostForTicker = getSafeNull(this.costBasis[trade.ticker],0);
        this.costBasis[trade.ticker]= currentCostForTicker + tradeCost;
    }

    /**
     * Returns when this wallet was instantiated
     */
    get creationAt(): string {
        return this._creationAt;
    }

    private getPriceIfDefined(ticker: string) {
        if(this.isPriceDefined(ticker)){
            return this.getPrice(ticker)
        }
        return undefined;
    }

    private updateTodayBalance(updateDateMs?:number) {
        const todayKey = todayDateNoTime(updateDateMs);

        this.daySnapshots[todayKey]={
            date: new Date(getSafeNull(updateDateMs,Date.now())).toISOString(),
            value: this.getTotalValue(),
            prices: cloneObj(this.prices)
        }
    }

    public getAllOwnedAssets(): Array<string>{
        return objToArrayKeys(this.holdings)
    }

    public exportToJson(){
        return JSON.stringify(this)
    }

    static importFromJsonString(walletJsonString: string) {
        const parsed:any = JSON.parse(walletJsonString);
        // console.log('PARSED->',parsed)
        return new WalletSimulator(0, parsed);
    }

    public clone(){
        return WalletSimulator.importFromJsonString(this.exportToJson())
    }

    /*
     My Trades:
     [
        timestamp: 1673967653101,
        symbol: 'ETH/USDT',
        id: '1058571462',
        order: '12208032776',
        type: undefined,
        side: 'sell',
        takerOrMaker: 'taker',
        price: 1581.86,
        amount: 0.0066,
        cost: 10.440276,
        fee: { cost: 0.01044028, currency: 'USDT' }
        ]
     */

    public static reverseParsingRealTrades(
        prices: { [ticker: string]: number },
        holdings: { [ticker: string]: number },
        allTrades:Array<ExchangeTrade>
    ){
        allTrades.sort((a, b) => a.timestamp - b.timestamp);

        const usdtHold = getSafeNull(holdings['USDT'],'0');
        const currentBalance = Number.parseFloat(usdtHold);

        const wallet = new WalletSimulator(130,{
            allowNegativeHeld:true
        });

        for(const ticker in prices){
            wallet.updatePrice(ticker,prices[ticker])
            wallet.updatePrice('USDT',1);
        }

        for (let i=0;i<allTrades.length;i++) {
            const trade = allTrades[i];
            const tradeFee =  0//trade.fee.currency==='USDT' ? 0 : trade.fee.cost;
            const tradeQuantity = trade.amount - tradeFee;
            const tradeType = trade.side === 'buy' ? TradeMove.BUY : TradeMove.SELL;
            const tradeSymbol = trade.symbol.split('/')[0]

            const opt:TradeOptions = {
                ticker: tradeSymbol,
                price: trade.price,
                quantity: tradeQuantity,
                type: tradeType,
                createdTimestamp: trade.timestamp
            }

            // Add the trade to the wallet simulator
            wallet.addTrade(opt);
        }

        wallet.balanceAtWalletCreation = currentBalance + -wallet.balance;
        console.log('initial balanceGap ->',wallet.balance);
        console.log('starting holdings ->',wallet.holdings);
        console.log('starting date ->', wallet.getFirstDate())

        const wallet2 = wallet.clone();
        wallet2.allowNegativeBalance = false
        wallet2.allowNegativeHeld = true

        wallet2.trades = allTrades.map((el)=>{
            const t:Trade = {
                createdTimestamp: el.timestamp,
                fee: 0,
                id: el.id,
                price: el.price,
                quantity: el.amount,
                ticker: el.symbol.split('/')[0],
                type: el.side==='buy'?TradeMove.BUY:TradeMove.SELL
            }
            return t;
        })

        return wallet2;
    }

    private getFirstDate() {
        return Object.keys(this.daySnapshots).sort((a,b)=>a.localeCompare(b))[0]
    }
}
