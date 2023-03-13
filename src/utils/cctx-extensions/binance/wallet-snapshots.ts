import {Exchange} from "ccxt";
import {daysBefore} from "../../mock";
import BinanceC, {
    Binance,
} from 'binance-api-node';

// @ts-ignore
import * as BinanceF from 'node-binance-api';

export interface WalletTrendSnapshot {
    amountInBTC:number|string;
    time:number;
    amountInUSDT:number|string;
}

export class BinanceConnector {

    private binanceF:any;

    constructor(private binance:Binance){
        // @ts-ignore
        this.binanceF = new BinanceF().options({
            // APIKEY:myKeys.myApi,
            // APISECRET:myKeys.mySecret
        });
    }

    static getClientWith(api:string, secret:string):Binance {
        const c:Binance = BinanceC({
            apiKey: api,
            apiSecret: secret,
        });

        return c;
    }

    public priceOf(symbol: string) {
        return this.binanceF.prices(symbol);
    }

    async walletSnapshots(
        howManyDaysBefore: number = 30
    ) {

        const BTCUSDTPriceNow = Number.parseFloat((await this.priceOf('BTCUSDT')).BTCUSDT);

        const el = await this.binance.accountSnapshot({
            type: 'SPOT',
            limit: 30,
            startTime: daysBefore(new Date(), howManyDaysBefore).getTime(),
        });

        // console.log('Snapshot:',el.snapshotVos)

        const snapshots: Array<WalletTrendSnapshot> = el.snapshotVos
            .map((singleSnapshot) => {
                const snap: WalletTrendSnapshot = {
                    time: singleSnapshot.updateTime,
                    amountInBTC: singleSnapshot.data.totalAssetOfBtc,
                    amountInUSDT: BTCUSDTPriceNow * singleSnapshot.data.totalAssetOfBtc,
                };
                return snap;
            });

        return snapshots
    }

}

export const defineWalletSnapshots = () => {
    Exchange.prototype.walletSnapshotsBINANCE = async (
        howManyDaysBefore: number = 30,
        apiKey:string,
        apiSecret:string
    ): Promise<Array<WalletTrendSnapshot>> => {

        const client = new BinanceConnector(
            BinanceConnector.getClientWith(apiKey,apiSecret)
        );

        return await client.walletSnapshots(howManyDaysBefore);
    }
}

