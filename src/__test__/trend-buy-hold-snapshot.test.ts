import {WalletSimulator} from "../index";
import {TradeMove} from "../models/Trade";

describe('getTrendBalanceSnapshotsBuyAndHold',()=>{

    test('getTrendBalanceSnapshotsBuyAndHold ok', ()=>{
        const wallet = new WalletSimulator(100);

        const now = new Date();

        // Adding trades and updating prices for the last 5 days
        const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
        wallet
            .addTrade({ ticker: 'AAPL', price: 10, quantity: 1, type: TradeMove.BUY, createdTimestamp: fiveDaysAgo.getTime() })
            .updatePrice('AAPL', 20, fiveDaysAgo.getTime());


        const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
        wallet
            .addTrade({ ticker: 'NVDA', price: 13, quantity: 3, type: TradeMove.BUY, createdTimestamp: threeDaysAgo.getTime() })
            .addTrade({ ticker: 'BTC', price: 1, quantity: 15, type: TradeMove.BUY, createdTimestamp: threeDaysAgo.getTime() })
            .addTrade({ ticker: 'ETH', price: 2, quantity: 5, type: TradeMove.BUY, createdTimestamp: threeDaysAgo.getTime() })
            .addTrade({ ticker: 'TSLA', price: 1, quantity: 5, type: TradeMove.BUY, createdTimestamp: threeDaysAgo.getTime() })
            .updatePrice('BTC', 2, threeDaysAgo.getTime())
            .updatePrice('ETH', 2, threeDaysAgo.getTime())
            .updatePrice('NVDA', 10, threeDaysAgo.getTime())
            .updatePrice('TSLA', 10, threeDaysAgo.getTime())


        const trendData = wallet.getTrendBalanceSnapshots(5, now);

        expect(trendData).toHaveLength(5);
        expect(trendData[0].value).toEqual(110);
        expect(trendData[1].value).toEqual(110);
        expect(trendData[2].value).toEqual(161);
        expect(trendData[3].value).toEqual(161);
        expect(trendData[4].value).toEqual(161);
    })
})