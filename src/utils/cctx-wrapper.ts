import {
    arrayToObjectKeys,
    getSafeNull,
    getSafeOrThrow,
    objToArrayKeys,
    cctxTradeToWalletSimulatorTrade
} from "./general";

const ccxt = require('ccxt');

import {Exchange, Trade} from 'ccxt';
import {TradeMove} from "../models/Trade";
import {daysBefore} from "./mock";
import {MyWalletAccount} from "../models/MyWalletAccount";
import {WalletSimulator} from "../index";
import {defineWalletSnapshots} from "./cctx-extensions/binance/wallet-snapshots";

export class CCTXWrapper {

    // TODO: let user set this from database
    private desiredAssets:Array<string> = [
        'BTC', 'ETH', 'LTC', 'SOL', 'DOT', 'DOGE', 'SHIB', 'AVAX'
    ]

    public static getClientWith(api:string, secret:string,exchangeId = 'binance'):CCTXWrapper {
        const exchangeClass = getSafeOrThrow(ccxt[exchangeId],`${exchangeId} exchange not supported.`);
        return new CCTXWrapper(new exchangeClass({
            'apiKey': api,
            'secret': secret,
        }));
    }

    public async initWalletSimulator() {

        const holdingsPromise = this.getAllHoldings();
        const pricesPromise = this.getAllTickerPrices();
        const daySnapshotsPromise:any = this.walletSnapshots()
        const _tradesPromise = this.getMyTrades()

        const [holdings,prices,daySnapshots,_trades] = await Promise.all([
            holdingsPromise,pricesPromise,daySnapshotsPromise,_tradesPromise
        ])

        const w:WalletSimulator = new WalletSimulator(0,{
            holdings,
            prices,
            daySnapshots,
            _trades:_trades.map(cctxTradeToWalletSimulatorTrade)
        });

        return w;
    }

    private constructor(private cctxExchange:Exchange) {
        if (!cctxExchange) {
            throw Error('null cctxExchange client object!');
        }

        // Extra functions
        defineWalletSnapshots();
        cctxExchange.checkRequiredCredentials();
    }

    public async walletSnapshots(){
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

    allSymbols(): Promise<any> {
        throw Error('Method not implemented.')
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
                cctxBalance
            };
        }

        const cctxBalance = getSafeOrThrow(await this.cctxExchange.fetchBalance(),'cctxExchange.fetchBalance error!');
        return CCTX2WalletAccount(cctxBalance);
    }

    getBotDetailsLive(): Promise<any> {
        throw Error('Method not implemented.')
    }

    getDate(): Promise<any> {
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
                daysBefore(new Date(),30).getTime(), // Use this.fetchTime instead
                1000
            );
        })
        const allTrades = (await Promise.all(allTradesPromises)).flat()
        return allTrades.sort((a, b) => b.timestamp - a.timestamp)
    }
    // @ts-ignore
    getPositionWithSymbol(symbol: string): Promise<Position[]> {
        return Promise.resolve([]);
    }

    getPositions(): Promise<any> {
        return this.cctxExchange.fetchPositions([
            this.toLocalAsset('BTC','USDT')
        ])
    }

    async getAllHoldings(): Promise<any> {
        const allHoldings:any = await this.cctxExchange.fetchTotalBalance();
        return arrayToObjectKeys(objToArrayKeys(allHoldings)
            .filter((asset)=>allHoldings[asset]>0)
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

    async getAllTickerPrices(desiredSymbols?:Array<string>) {
        const desSymbols = getSafeNull(desiredSymbols,this.desiredSymbols());
        const tickers = await this.cctxExchange.fetchTickers(desSymbols);
        return arrayToObjectKeys(
            objToArrayKeys(tickers)
            .filter((asset)=>tickers[asset] && tickers[asset].close)
            .map((asset)=> {
                    return {[asset.split('/')[0]]:tickers[asset].close}
            })
                .concat({'USDT':1})
        )
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
}
