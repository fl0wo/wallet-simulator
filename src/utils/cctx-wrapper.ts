import {entries, getSafeNull, getSafeOrThrow, objToArrayKeys} from "./general";

const ccxt = require('ccxt')
import {Exchange, Trade} from 'ccxt';
import {TradeMove} from "../models/Trade";
import {daysBefore} from "./mock";
import {MyWalletAccount} from "../models/MyWalletAccount";

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
        // Call reverse engineering function of WalletSimulator
    }

    private constructor(private cctxExchange:Exchange) {
        if (!cctxExchange) {
            throw Error('null cctxExchange client object!');
        }
        cctxExchange.checkRequiredCredentials()
    }

    async getLedger(ticker:string){
        return this.cctxExchange.fetchLedger()
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
        function CCTX2WalletAccount(cctxBalance:any) {
            const balanceUSDTether = cctxBalance['USDT']
            const buyingPowerUSDTether = getSafeNull(balanceUSDTether?.free, '0');

            return {
                buyPowerUSDT: buyingPowerUSDTether,
                cctxBalance: cctxBalance
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
        return objToArrayKeys(allHoldings)
            .filter((asset)=>allHoldings[asset]>0)
            .map((asset)=> {
                return {
                    asset:asset,
                    amount: allHoldings[asset]
                }
            });
    }

    async getTotalBuyPower(): Promise<any> {
        return (await this.getAccount()).buyPowerUSDT;
    }

    getTradeFee(): Promise<any> {
        throw Error('Method not implemented.')
    }

    toLocalAsset(crypto: string, base: string): string {
        return `${crypto}/${base}`;
    }

    async loadAllFiltersFor() {

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
        return objToArrayKeys(tickers)
            .filter((asset)=>tickers[asset] && tickers[asset].close)
            .map((asset)=> {
                return {
                    asset:asset.split('/')[0],
                    close: tickers[asset].close
                }
            });
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
