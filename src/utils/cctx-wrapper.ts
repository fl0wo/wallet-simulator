import {
    addProfits,
    arrayToObjectKeys,
    cctxTradeToWalletSimulatorTrade,
    getSafeNull,
    getSafeOrThrow,
    objToArrayKeys,
    removeEmpty
} from "./general";
import {Exchange, Order, Params, Trade} from 'ccxt';
import {daysBefore} from "./mock";
import {MyWalletAccount} from "../models/MyWalletAccount";
import {WalletSimulator} from "../index";
import * as crypto from 'crypto';

const ccxt = require('ccxt');

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

    triggerPrice?:number;
    stopLossPrice?:number;
    takeProfitPrice?:number;

}

interface CCTXOrderPayload {
    id: string;
    order: CCTXOrder;
}

export class CCTXWrapper {

    // TODO: let user set this from database
    // FIXME: be really careful
    private desiredAssets:Array<string> = [
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

    private constructor(private cctxExchange:Exchange) {
        if (!cctxExchange) {
            throw Error('null cctxExchange client object!');
        }
        cctxExchange.checkRequiredCredentials();
    }

    public static async getClientWith(
        api:string,
        secret:string,
        exchangeId = 'binance',
        loadMarketData:boolean=true):Promise<CCTXWrapper> {
        const exchangeClass = getSafeOrThrow(ccxt[exchangeId],`${exchangeId} exchange not supported.`);
        const wrapper = new CCTXWrapper(new exchangeClass({
            'apiKey': api,
            'secret': secret,
        }));

        if(loadMarketData){
            await wrapper.initMarketData();
        }

        return wrapper;
    }

    /**
     * Todo apply good Decorator + Iterator pattern
     */
    public async initWalletSimulator() {

        const holdings = await this.getAllHoldings();
        const ownedCryptoAssets = Object.keys(holdings);
        const pricesPromise = this.getAllTickerPrices(ownedCryptoAssets);
        const _tradesPromise = this.getMyTrades()

        const [prices,_trades] = await Promise.all([
            pricesPromise,_tradesPromise
        ])

        const w:WalletSimulator = new WalletSimulator(0,{
            holdings,
            prices,
            daySnapshots:[],
            _trades: addProfits(_trades.map(cctxTradeToWalletSimulatorTrade))
        });

        return w;
    }

    private async initMarketData(){
        return await this.wrapCatchableOperation(async (exchange: Exchange) => {
            return await exchange.loadMarkets();
        });
    }

    async allSymbols(): Promise<any> {
        return await this.wrapCatchableOperation(async (exchange: Exchange) => {
            return Promise.resolve(exchange.symbols)
        });
    }

    async sendOrder(payload: CCTXOrderPayload): Promise<Order> {
        const order:CCTXOrder = payload.order;

        function ifHas(a: any, fallback: any) {
            if(a!==undefined && a!==null) return fallback;
            return undefined;
        }

        // Order as Maker (provides liquidity)
        const params:Params = removeEmpty({
            // <- The event will be triggered when this price is passed by
            triggerPrice:order.triggerPrice,

            // <- We'll stop the loss at stopLossPrice limit
            stopLossPrice: ifHas(order.stopLossPrice,order.stopLossPrice),

            // <- We'll take the cash at takeProfitPrice limit
            takeProfitPrice: ifHas(order.takeProfitPrice,order.takeProfitPrice)
        })

        console.log('Sending an order:', {
            ...order,
            ...params
        })

        return this.wrapCatchableOperation<Order>(async (exchange) => {

            const side = getSafeOrThrow(order.side,'order.side missing')
            const type = getSafeOrThrow(order.type,'order.type missing')
            const symbol = getSafeOrThrow(order.symbol,'order.symbol missing');
            const amount = getSafeOrThrow(order.amount,'order.amount missing'); // amount in base currency BTC
            const price = getSafeOrThrow(order.price,'order.price missing'); // price in quote currency USDT
            const formattedAmount = exchange.amountToPrecision(symbol,amount);
            const formattedPrice = exchange.priceToPrecision(symbol,price)

            console.log({
                symbol,
                type,
                side,
                formattedAmount,
                formattedPrice,
                params
            })

            return await exchange.createOrder(
                symbol,
                type,
                side,
                formattedAmount,
                formattedPrice,
                params
            );
        })

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
    createOrderPayload(params:{
        side: 'sell'|'buy',
        symbol:string,
        amount: number,
        type:'market'|'limit',
        price?:number,// <- desired price (only for limit)
        triggerPrice?:number,
        stopLossPrice?:number,
        takeProfitPrice?:number
    }): CCTXOrderPayload {

        const newOrderPayload:CCTXOrder = {
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

        const x:CCTXOrderPayload = {
            id: tradeId, // use uuid4
            order:newOrderPayload
        }

        return x;
    }

    /**
     * Returns Account related information
     */
    async getAccount(): Promise<MyWalletAccount> {
        function CCTX2WalletAccount(cctxBalanceParam:any):MyWalletAccount {
            const balanceUSDTether = cctxBalanceParam.USDT
            const buyingPowerUSDTether = getSafeNull(balanceUSDTether?.free, '0');
            return {
                buyPowerUSDT: buyingPowerUSDTether,
                cctxBalance:cctxBalanceParam
            };
        }

       return await this.wrapCatchableOperation(async (exchange: Exchange) => {
            const fetchAccountOperation = await exchange.fetchBalance();
            const cctxBalance = getSafeOrThrow(fetchAccountOperation,'cctxExchange.fetchBalance error!');
            return CCTX2WalletAccount(cctxBalance);
        });
    }


    getCurrentTimeMs(): Promise<number> {
        return this.cctxExchange.fetchTime()
    }

    async getMyTrades(): Promise<Trade[]> {
        const allTradesPromises = this.desiredAssets.map((el) => {
            const symbol = this.toLocalAsset(el, 'USDT');
            return this.cctxExchange.fetchMyTrades(
                symbol,
                daysBefore(new Date(),30).getTime(),
                1000
            );
        })
        const allTrades = (await Promise.all(allTradesPromises)).flat()
        return allTrades.sort((a, b) => b.timestamp - a.timestamp)
    }

    async getAllHoldings(): Promise<any> {
        const allHoldings:any = await this.cctxExchange.fetchTotalBalance();
        const allSymbols:string[] = await this.allSymbols();

        return arrayToObjectKeys(objToArrayKeys(allHoldings)
            .filter((asset)=>allHoldings[asset]>0)
            .filter((asset:string)=>{
                return this.stableCoin(asset) || allSymbols.includes(asset+'/USDT')
            })
            .map((asset)=> {
                return {[asset]:allHoldings[asset]}
            })
        );
    }

    async getTotalBuyPower(): Promise<number> {
        const buyPower:string = getSafeNull(String((await this.getAccount()).buyPowerUSDT),'0');
        return Number.parseFloat(buyPower)
    }

    getTradeFee(): Promise<any> {
        throw Error('Method not implemented.')
    }

    toLocalAsset(crypto: string, base: string): string {
        return `${crypto}/${base}`;
    }

    async priceOf(symbol: string) {
        return this.getAllTickerPrices([this.toLocalAsset(symbol,'USDT')])
    }

    async getAllCurrencies() {
        return this.cctxExchange.fetchCurrencies();
    }

    async getAllCurrenciesNames() {
        return Object.keys(await this.cctxExchange.fetchCurrencies());
    }

    async getAllTickerPrices(desiredSymbols?:string[]) {
        let availableSymbols:string[] = await this.getOnlySymbolsInUSDT(desiredSymbols);
        return await this.cctxExchange.fetchTickers(availableSymbols)
    }

    private async getOnlySymbolsInUSDT(desiredSymbols?: string[]) {
        if (desiredSymbols) {
            return desiredSymbols
                .filter(this.notStableCoin)
                ?.map((el)=>el.toUpperCase())
                ?.map(el => el.includes('/USDT')?el:`${el}/USDT`);
        }

        const allSymbols:string[] = await this.allSymbols();

        return allSymbols
            .filter(this.notStableCoin)
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
        return this.desiredAssets.map((el)=>this.toLocalAsset(el,'USDT'))
    }

    private stableCoin(asset: string) {
        return asset==='USDT'||asset==='USD'||asset==='EUR'||asset==='BUSD'
    }
    private notStableCoin(asset: string) {
        return !this.stableCoin(asset);
    }

    private async wrapCatchableOperation<T=any>(fn: (exchange: Exchange) => Promise<T>) {
        const exchange = this.cctxExchange
        try {
            return await fn(exchange); // Run cctx function
        } catch (e: any) {
            if (e instanceof ccxt.DDoSProtection) {
                console.log(exchange.id, '[DDoSProtection] ' + e.message)
            } else if (e instanceof ccxt.RequestTimeout) {
                console.log(exchange.id, '[Request Timeout] ' + e.message)
            } else if (e instanceof ccxt.AuthenticationError) {
                console.log(exchange.id, '[Authentication Error] ' + e.message)
            } else if (e instanceof ccxt.ExchangeNotAvailable) {
                console.log(exchange.id, '[Exchange Not Available] ' + e.message)
            } else if (e instanceof ccxt.ExchangeError) {
                console.log(exchange.id, '[Exchange Error] ' + e.message)
            } else if (e instanceof ccxt.NetworkError) {
                console.log(exchange.id, '[Network Error] ' + e.message)
            } else {
                console.log(exchange.id, '[General Error] ' + e.message)
            }

            throw e;
        }
    }

}
