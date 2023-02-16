import {
    addProfits,
    arrayToObjectKeys, cctxPriceToWalletSimulatorPrice,
    cctxTradeToWalletSimulatorTrade,
    getSafeNull,
    getSafeOrThrow, hideFields,
    objToArrayKeys,
    removeEmpty
} from "./general";
import {Exchange, Market, Order, Params, Ticker, Trade} from 'ccxt';
import {daysBefore} from "./mock";
import {MyWalletAccount} from "../models/MyWalletAccount";
import {WalletSimulator} from "../index";
import * as crypto from 'crypto';
import * as fs from "fs";

const ccxt = require('ccxt');

export interface CCTXPosition{
    symbol: string;
    positionSize: number;
    curPrice: number;
    spentPrice: number;
    positionValue: number;
    unrealizedPnl: number;
    unrealizedPnlPercentage: number;
}

export interface CCTXOrder {
    datetime: string;
    timestamp: number;
    symbol: string;
    type: string;
    timeInForce?: string;
    side: 'buy' | 'sell';
    price?: number;
    average?: number;
    amount: number;

    triggerPrice?: number;
    stopLossPrice?: number;
    takeProfitPrice?: number;

}
export interface CCTXPositions{
    [symbol:string]:CCTXPosition
}

interface CCTXOrderPayload {
    id: string;
    order: CCTXOrder;
}

export class CCTXWrapper {

    // TODO: let user set this from database
    // FIXME: be really careful
    private desiredAssets: Array<string> = [
        'BTC',
        'ETH',
        'LTC',
        'SOL',
        'DOT',
        'DOGE',
        'SHIB',
        'AVAX',
        'XRP',
        'ADA',
        'BUSD'
    ]

    private constructor(private cctxExchange: Exchange) {
        if (!cctxExchange) {
            throw Error('null cctxExchange client object!');
        }
        cctxExchange.checkRequiredCredentials();
    }

    public static async getClientWith(
        api: string,
        secret: string,
        exchangeId = 'binance',
        loadMarketData: boolean = true): Promise<CCTXWrapper> {
        const exchangeClass = getSafeOrThrow(ccxt[exchangeId], `${exchangeId} exchange not supported.`);
        const wrapper = new CCTXWrapper(new exchangeClass({
            'apiKey': api,
            'secret': secret
        }));

        if (loadMarketData) {
            await wrapper.initMarketData();
        }

        return wrapper;
    }

    /**
     * Todo apply good Decorator + Iterator pattern
     */
    public async initWalletSimulator():Promise<WalletSimulator>{

        const holdings = await this.getAllHoldings();
        const ownedCryptoAssets = Object.keys(holdings);
        const pricesPromise = this.getAllTickerPrices(ownedCryptoAssets);
        const _tradesPromise = this.getMyTrades();
        const _positionsPromise = this.getOpenedPositions();

        const [prices, _trades,_positions] = await Promise.all([
            pricesPromise, _tradesPromise, _positionsPromise
        ])

        const w: WalletSimulator = new WalletSimulator(0, {
            holdings,
            prices: cctxPriceToWalletSimulatorPrice(prices),
            daySnapshots: [],
            _trades: addProfits(_trades.map(cctxTradeToWalletSimulatorTrade)),
            positions: _positions
        });

        return w;
    }

    private async initMarketData() {
        return await this.wrapCatchableOperation(async (exchange: Exchange) => {
            return await exchange.loadMarkets();
        });
    }

    async allSymbols(): Promise<any> {
        return Promise.resolve(this.cctxExchange.symbols)
    }

    async sendOrder(payload: CCTXOrderPayload): Promise<Order> {
        const order: CCTXOrder = payload.order;

        const ifHas = (a: number | undefined, fallback?: any) => {
            if (a !== undefined && a !== null) {
                if (fallback !== undefined && fallback !== null) {
                    return fallback;
                }
                return this.cctxExchange.priceToPrecision(order.symbol, a);
            }
            return undefined;
        }

        // Order as Maker (provides liquidity)
        const params: Params = removeEmpty({
            // <- The event will be triggered when this price is passed by
            triggerPrice: order.triggerPrice,

            // <- We'll stop the loss at stopLossPrice limit
            stopLossPrice: ifHas(order.stopLossPrice),

            // <- We'll take the cash at takeProfitPrice limit
            takeProfitPrice: ifHas(order.takeProfitPrice)
        })

        const exchange = this.cctxExchange;
        const side = getSafeOrThrow(order.side, 'order.side missing')
        const type = getSafeOrThrow(order.type, 'order.type missing')
        const symbol = getSafeOrThrow(order.symbol, 'order.symbol missing');
        const amount = getSafeOrThrow(order.amount, 'order.amount missing'); // amount in base currency BTC
        const price = getSafeOrThrow(order.price, 'order.price missing'); // price in quote currency USDT
        // const curPrice = getSafeNull((await this.priceOf(symbol))[symbol].close,0)

        const formattedAmount = exchange.amountToPrecision(symbol, amount);
        const formattedPrice = exchange.priceToPrecision(symbol, price);
        // round_step_size(price - (price * (stop_percent / 100)), tick);

        return await exchange.createOrder(
            symbol,
            type,
            side,
            formattedAmount,
            formattedPrice,
            params
        );

    }

    /**
     * Creates a payload object for the sendOrder method
     * @param params Object with all details of the behaviour of this order
     * @side Buy or Sell?
     * @symbol Example: BTC/USDT
     * @amount How many coins?
     * @type The type of order, Market=made instantly, limit=based on triggers
     * @price [limit only] the desired price to fire this order
     * @triggerPrice [limit only] when goes under/over this trigger the order gets fired
     * @stopLossPrice [limit only] like triggerPrice, but only if it goes from top-bottom (sell orders)
     * @takeProfitPrice [limit only] takeProfitPrice when goes from bottom-up (sells)
     *
     *
     */
    createOrderPayload(params: {
        side: 'sell' | 'buy',
        symbol: string,
        amount: number,
        type: 'market' | 'limit',
        price?: number,// <- desired price (only for limit)
        triggerPrice?: number,
        stopLossPrice?: number,
        takeProfitPrice?: number
    }): CCTXOrderPayload {

        const newOrderPayload: CCTXOrder = {
            datetime: new Date().toISOString(),
            timestamp: Date.now(),
            amount: params.amount,
            side: params.side,
            symbol: params.symbol,
            type: params.type,
            price: params.price,
            triggerPrice: params.triggerPrice,
            stopLossPrice: params.stopLossPrice,
            takeProfitPrice: params.takeProfitPrice,
        }

        const tradeId = crypto.randomUUID();

        const x: CCTXOrderPayload = {
            id: tradeId, // use uuid4
            order: newOrderPayload
        }

        return x;
    }

    /**
     * Returns Account related information
     */
    async getAccount(): Promise<MyWalletAccount> {
        function CCTX2WalletAccount(cctxBalanceParam: any): MyWalletAccount {
            const balanceUSDTether = cctxBalanceParam.USDT
            const buyingPowerUSDTether = getSafeNull(balanceUSDTether?.free, '0');
            return {
                buyPowerUSDT: buyingPowerUSDTether,
                cctxBalance: cctxBalanceParam
            };
        }
        const fetchAccountOperation = await this.cctxExchange.fetchBalance();
        const cctxBalance = getSafeOrThrow(fetchAccountOperation, 'cctxExchange.fetchBalance error!');
        return CCTX2WalletAccount(cctxBalance);
    }

    getCurrentTimeMs(): Promise<number> {
        return this.cctxExchange.fetchTime()
    }

    async getMyTrades(): Promise<Trade[]> {
        const allTradesPromises = this.desiredAssets.map((el) => {
            const symbol = this.toLocalAsset(el, 'USDT');
            return this.cctxExchange.fetchMyTrades(
                symbol,
                daysBefore(new Date(), 30).getTime(),
                1000
            );
        })
        const allTrades = (await Promise.all(allTradesPromises)).flat()
        return allTrades.sort((a, b) => b.timestamp - a.timestamp)
    }

    async getAllHoldings(): Promise<{ [asset: string]: number }> {
        const allHoldings: any = await this.cctxExchange.fetchTotalBalance();
        const allSymbols: string[] = await this.allSymbols();

        return arrayToObjectKeys(objToArrayKeys(allHoldings)
            .filter((asset) => allHoldings[asset] > 0)
            .filter((asset: string) => {
                return this.stableCoin(asset) || allSymbols.includes(asset + '/USDT')
            })
            .map((asset) => {
                return {[asset]: allHoldings[asset]}
            })
        );
    }

    async getTotalBuyPower(): Promise<number> {
        const buyPower: string = getSafeNull(String((await this.getAccount()).buyPowerUSDT), '0');
        return Number.parseFloat(buyPower)
    }

    getTradeFee(symbol: string): Promise<any> {
        return this.cctxExchange.fetchTradingFee(symbol)
    }

    toLocalAsset(coin: string, base: string): string {
        return `${coin}/${base}`;
    }

    async priceOf(symbol: string) {
        const symbolWithBaseCurrency = symbol.includes('USDT') ? symbol : this.toLocalAsset(symbol, 'USDT')
        return this.getAllTickerPrices([symbolWithBaseCurrency])
    }

    async getAllCurrencies() {
        return this.cctxExchange.fetchCurrencies();
    }

    async getAllCurrenciesNames() {
        return Object.keys(await this.cctxExchange.fetchCurrencies());
    }

    async getAllTickerPrices(desiredSymbols?: string[]): Promise<{ [asset: string]: Ticker }> {
        const availableSymbols: string[] = await this.getOnlySymbolsInUSDT(desiredSymbols);
        return await this.cctxExchange.fetchTickers(availableSymbols)
    }

    private async getOnlySymbolsInUSDT(desiredSymbols?: string[]) {
        if (desiredSymbols) {
            return desiredSymbols
                .filter((el) => this.notStableCoin(el))
                ?.map((el) => el.toUpperCase())
                ?.map(el => this.concatUSDT(el));
        }

        const allSymbols: string[] = await this.allSymbols();

        return allSymbols
            .filter((el) => this.notStableCoin(el))
    }

    showRequiredCredentials() {
        return this.cctxExchange.requiredCredentials
    }

    checkCredentials() {
        // FIXME: actually perform a call to see any error
        this.cctxExchange.checkRequiredCredentials();
        return true;
    }

    private desiredSymbols() {
        return this.desiredAssets.map((el) => this.toLocalAsset(el, 'USDT'))
    }

    private stableCoin(asset: string) {
        return asset === 'USDT' || asset === 'USD' || asset === 'EUR' || asset === 'BUSD'
    }

    private notStableCoin(asset: string) {
        return !this.stableCoin(asset);
    }

    private async wrapCatchableOperation<T = any>(fn: (exchange: Exchange) => Promise<T>) {
        const exchange = this.cctxExchange
        try {
            return await fn(exchange); // Run cctx function
        } catch (e: any) {
            if (e instanceof ccxt.DDoSProtection) {
                // console.log(exchange.id, '[DDoSProtection] ' + e.message)
            } else if (e instanceof ccxt.RequestTimeout) {
                // console.log(exchange.id, '[Request Timeout] ' + e.message)
            } else if (e instanceof ccxt.AuthenticationError) {
                // console.log(exchange.id, '[Authentication Error] ' + e.message)
            } else if (e instanceof ccxt.ExchangeNotAvailable) {
                // console.log(exchange.id, '[Exchange Not Available] ' + e.message)
            } else if (e instanceof ccxt.ExchangeError) {
                // console.log(exchange.id, '[Exchange Error] ' + e.message)
            } else if (e instanceof ccxt.NetworkError) {
                // console.log(exchange.id, '[Network Error] ' + e.message)
            } else {
                // console.log(exchange.id, '[General Error] ' + e.message)
            }

            throw e;
        }
    }


    /**
     * Returns CCTXPositions object containing currently running orders already filled.
     * It's similar to AllHoldings but returns more information such as % p&l & price.
     */
    async getOpenedPositions():Promise<CCTXPositions> {
        const account: MyWalletAccount = await this.getAccount();
        const ownedHoldings: {
            [asset: string]: {
                free: number, used: number, total: number
            }
        } = hideFields(account.cctxBalance, ['info', 'timestamp', 'datetime', 'free', 'used', 'total'])

        const ownedAssets = Object.keys(ownedHoldings)
            .filter((el)=>ownedHoldings[el].total>0)
            .filter((el)=>this.notStableCoin(el))

        const assetsCurrentPrices: { [asset: string]: Ticker } = await this.getAllTickerPrices(ownedAssets
            .map(this.concatUSDT)
        );

        const fetchLastOrdersForEachOwnedAsset = ownedAssets
            .map(async (ownedAsset) => {
                const obj = ownedHoldings[ownedAsset];
                const symbol = this.concatUSDT(ownedAsset);
                try{
                    const lastBuyOrder = (await this.getLastOrder(symbol, 'buy'));
                    return {
                        [symbol]:{
                            ...obj, // free,used,total
                            costBasis: getSafeNull(lastBuyOrder?.cost,0),
                            lastBuyPrice: getSafeNull(lastBuyOrder?.price,0),
                        }
                    }
                }catch (e){
                    // console.error('error processing ',ownedAsset)
                    return null;
                }
            })

        const ownedPositions = arrayToObjectKeys(
            (await Promise.all(fetchLastOrdersForEachOwnedAsset))
                .filter((el)=>!!el)
        )

        const positions = Object.keys(ownedPositions).map((symbol) => {
            try{
                const holdingAmount = getSafeOrThrow(ownedPositions[symbol], 'missing holding information');
                const curPrice = getSafeOrThrow(assetsCurrentPrices[symbol].close, 'Unknown curPrice for ' + symbol);
                const spentPrice = getSafeNull(holdingAmount.lastBuyPrice,0);

                const positionSize = holdingAmount.total; // quantity
                const positionValue = positionSize * curPrice; // value

                const unrealizedPnl = positionSize * (1 / curPrice - 1 / spentPrice);
                const unrealizedPnlPercentage = (curPrice - spentPrice) / spentPrice * 100;

                return {
                    [symbol]:{
                        symbol,
                        positionSize,
                        curPrice,
                        spentPrice,
                        positionValue,
                        unrealizedPnl,
                        unrealizedPnlPercentage,
                    }
                };
            }catch (e){
                // console.log('error processing ',symbol)
                return null;
            }
        })

        return arrayToObjectKeys(
            positions
                .filter((el)=>!!el)
        )
    }

    concatUSDT(asset: string) {
        if (asset.endsWith('/USDT')) {
            return asset;
        }
        return `${asset}/USDT`;
    }

    public static removeUSDT(symbol:string){
        return symbol.replace('/USDT','')
    }

    async getLastOrder(symbol: string,type?:string):Promise<Order | undefined> {
        const recentOrders:Order[] = await this.cctxExchange.fetchClosedOrders(symbol,undefined,50)
        fs.writeFileSync('./src/__mock__/fetchClosedOrders'+symbol.replace('/','_')+'.json',JSON.stringify(recentOrders))
        return recentOrders
            .sort((a,b)=>b.timestamp-a.timestamp)
            .find((el)=> (!type || el.side === type.toLowerCase()))
    }

    async cancelAllOrders() {
        const allOwnings = await this.getAllHoldings();
        const allCancelOperations = Object.keys(allOwnings)
            .filter((el)=>this.notStableCoin(el))
            .map(this.concatUSDT)
            .map(async (symbol) => {
                try{
                    const res =  await this.cctxExchange.cancelAllOrders(symbol);
                    return res;
                }catch (e){
                    // do nothing
                    return null;
                }
            })

        return (await Promise.all(allCancelOperations))
            .filter((el)=>!!el)

    }

    getMinimumBuyAmountForSymbol(symbol: string):Market {
        return this.cctxExchange.market(symbol)
    }
}
