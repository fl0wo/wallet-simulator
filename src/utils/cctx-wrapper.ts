import {
    addProfits,
    arrayToObjectKeys,
    cctxTradeToWalletSimulatorTrade,
    getSafeNull,
    getSafeOrThrow,
    objToArrayKeys
} from "./general";
import {Exchange, Trade} from 'ccxt';
import {TradeMove} from "../models/Trade";
import {daysBefore} from "./mock";
import {MyWalletAccount} from "../models/MyWalletAccount";
import {WalletSimulator} from "../index";
import {WalletTrendSnapshot} from "./cctx-extensions/binance/wallet-snapshots";

export enum CCTXWrapperError {
    DDOS='DDOS',
    NETWORK='NETWORK',
    AUTH='AUTH',
    EXCHANGE_NOT_AVAILABLE='EXCHANGE_NOT_AVAILABLE',
    EXCHANGE_ERROR='EXCHANGE_ERROR',
    TIMEOUT='TIMEOUT',
    GENERAL='GENERAL',
}

const ccxt = require('ccxt');

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

    public static async getClientWith(api:string, secret:string,exchangeId = 'binance'):Promise<CCTXWrapper> {
        const exchangeClass = getSafeOrThrow(ccxt[exchangeId],`${exchangeId} exchange not supported.`);
        const wrapper = new CCTXWrapper(new exchangeClass({
            'apiKey': api,
            'secret': secret,
        }));
        const res:any = await wrapper.initMarketData();

        if(res in CCTXWrapperError) {
            throw Error(res);
        }

        return wrapper;
    }

    public async initWalletSimulator() {

        const holdings = await this.getAllHoldings();
        const ownedCryptoAssets = Object.keys(holdings);
        const pricesPromise = this.getAllTickerPrices(ownedCryptoAssets);
        const daySnapshotsPromise:Promise<Array<WalletTrendSnapshot>> = this.walletSnapshots()
        const _tradesPromise = this.getMyTrades()

        const [prices,daySnapshots,_trades] = await Promise.all([
            pricesPromise,daySnapshotsPromise,_tradesPromise
        ])

        const daySnapshotsModel = daySnapshots.map((item:WalletTrendSnapshot) => {
            return {
                date: new Date(item.time).toISOString(),
                value: String(item.amountInUSDT),
                prices: { USDT: String(item.amountInUSDT), BTC: String(item.amountInBTC) }
            };
        });

        const w:WalletSimulator = new WalletSimulator(0,{
            holdings,
            prices,
            daySnapshots:daySnapshotsModel,
            _trades: addProfits(_trades.map(cctxTradeToWalletSimulatorTrade))
        });

        return w;
    }

    private constructor(private cctxExchange:Exchange) {
        if (!cctxExchange) {
            throw Error('null cctxExchange client object!');
        }
        cctxExchange.checkRequiredCredentials();
    }

    public async initMarketData(){
        return await this.wrapCatchableOperation(async (exchange: Exchange) => {
            return await exchange.loadMarkets();
        });
    }

    private async wrapCatchableOperation<T=any>(fn: (exchange: Exchange) => Promise<T>) {
        const exchange = this.cctxExchange
        try {
            return await fn(exchange); // Run cctx function
        } catch (e: any) {
            if (e instanceof ccxt.DDoSProtection) {
                console.log(exchange.id, '[DDoSProtection] ' + e.message)
                return CCTXWrapperError.DDOS
            } else if (e instanceof ccxt.RequestTimeout) {
                console.log(exchange.id, '[Request Timeout] ' + e.message)
                return CCTXWrapperError.TIMEOUT
            } else if (e instanceof ccxt.AuthenticationError) {
                console.log(exchange.id, '[Authentication Error] ' + e.message)
                return CCTXWrapperError.AUTH
            } else if (e instanceof ccxt.ExchangeNotAvailable) {
                console.log(exchange.id, '[Exchange Not Available] ' + e.message)
                return CCTXWrapperError.EXCHANGE_NOT_AVAILABLE
            } else if (e instanceof ccxt.ExchangeError) {
                console.log(exchange.id, '[Exchange Error] ' + e.message)
                return CCTXWrapperError.EXCHANGE_ERROR
            } else if (e instanceof ccxt.NetworkError) {
                console.log(exchange.id, '[Network Error] ' + e.message)
                return CCTXWrapperError.NETWORK
            } else {
                console.log(exchange.id, '[General Error] ' + e.message)
                return CCTXWrapperError.GENERAL;
            }
        }
    }

    public async walletSnapshots():Promise<Array<WalletTrendSnapshot>>{
        // TODO: replace 'BINANCE' with the current exchange
        if(this.cctxExchange.walletSnapshotsBINANCE) {
            return await this.cctxExchange.walletSnapshotsBINANCE(
                30,
                this.cctxExchange.apiKey,
                this.cctxExchange.secret
            );
        }

        return []
    }

    async allSymbols(): Promise<any> {
        return Promise.resolve(this.cctxExchange.symbols)
    }

    createOrder(payload: any, forReal: boolean=false): Promise<any> {
        throw Error('Method not implemented.')
    }

    createOrderPayload(side: TradeMove, coin: string, baseCurrency:string, amount: number): Promise<any> {
        throw Error('Method not implemented.')
    }

    async getAccount(): Promise<MyWalletAccount> {
        function CCTX2WalletAccount(cctxBalanceParam:any) {
            const balanceUSDTether = cctxBalanceParam.USDT
            const buyingPowerUSDTether = getSafeNull(balanceUSDTether?.free, '0');
            return {
                buyPowerUSDT: buyingPowerUSDTether,
                cctxBalance:cctxBalanceParam
            };
        }

        const cctxBalance = getSafeOrThrow(await this.cctxExchange.fetchBalance(),'cctxExchange.fetchBalance error!');
        return CCTX2WalletAccount(cctxBalance);
    }

    getCurrentTimeMs(): Promise<number> {
        return this.cctxExchange.fetchTime()
    }

    getMinimumBuyAmountFor(symbol: string): number {
        return 0;
    }

    getOrders(): Promise<any> {
        throw Error('Method not implemented.')
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

    getPositions(): Promise<any> {
        return this.cctxExchange.fetchPositions([
            this.toLocalAsset('BTC','USDT')
        ])
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
                .filter(el => el !== 'USDT' && el !== 'EUR' && el !== 'USD')
                ?.map((el)=>el.toUpperCase())
                ?.map(el => el.includes('/USDT')?el:`${el}/USDT`);
        }

        const allSymbols:string[] = await this.allSymbols();

        return allSymbols
            .filter(el => el !== 'USDT' && el !== 'EUR' && el !== 'USD')
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
}
