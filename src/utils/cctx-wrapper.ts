import {
    arrayToObjectKeys,
    getSafeNull,
    getSafeOrThrow,
    objToArrayKeys,
    cctxTradeToWalletSimulatorTrade, addProfits
} from "./general";
import {Exchange, Trade} from 'ccxt';
import {TradeMove} from "../models/Trade";
import {daysBefore} from "./mock";
import {MyWalletAccount} from "../models/MyWalletAccount";
import {WalletSimulator} from "../index";
import {defineWalletSnapshots, WalletTrendSnapshot} from "./cctx-extensions/binance/wallet-snapshots";

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

    public static getClientWith(api:string, secret:string,exchangeId = 'binance'):CCTXWrapper {
        const exchangeClass = getSafeOrThrow(ccxt[exchangeId],`${exchangeId} exchange not supported.`);
        return new CCTXWrapper(new exchangeClass({
            'apiKey': api,
            'secret': secret,
        }));
    }

    public async initWalletSimulator() {

        const holdings = await this.getAllHoldings();
        const ownedCryptoAssets = Object.keys(holdings)
            .filter(el=>el!=='USDT' && el!=='EUR' && el!='USD')
            ?.map(el=>`${el}/USDT`)
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

        // Extra functions
        defineWalletSnapshots();
        cctxExchange.checkRequiredCredentials();
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
                cctxBalance:cctxBalanceParam
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

    async getAllCurrenciesNames() {
        return Object.keys(await this.cctxExchange.fetchCurrencies());
    }

    async getAllTickerPrices(desiredSymbols?:Array<string>) {

        const tickers = await this.cctxExchange.fetchTickers(desiredSymbols);

        return arrayToObjectKeys(
            objToArrayKeys(tickers)
            .filter((asset)=>tickers[asset] && tickers[asset].close)
            .map((asset)=> {
                    return {[asset.split('/')[0]]:tickers[asset].close}
            }).concat({'USDT':1})
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
