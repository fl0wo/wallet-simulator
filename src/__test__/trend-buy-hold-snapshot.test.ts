import {WalletSimulator} from "../index";
import {TradeMove} from "../models/Trade";
import {daysBefore} from "../utils/mock";

describe('getTrendBalanceSnapshotsBuyAndHold',()=>{

    test('getTrendBalanceSnapshotsBuyAndHold ok', ()=>{
        const wallet = new WalletSimulator(100);

        const now = new Date();

        // Adding trades and updating prices for the last 5 days
        const fiveDaysAgo = daysBefore(now,5);
        wallet
            .addTrade({ ticker: 'AAPL', price: 10, quantity: 1, type: TradeMove.BUY, createdTimestamp: fiveDaysAgo.getTime() })


        const fourDaysAgo = daysBefore(now,4);
        wallet.updatePrice('AAPL', 20, fourDaysAgo.getTime());

        const threeDaysAgo = daysBefore(now,3);
        wallet
            .addTrade({ ticker: 'NVDA', price: 13, quantity: 3, type: TradeMove.BUY, createdTimestamp: threeDaysAgo.getTime() })
            .addTrade({ ticker: 'BTC', price: 1, quantity: 15, type: TradeMove.BUY, createdTimestamp: threeDaysAgo.getTime() })
            .addTrade({ ticker: 'ETH', price: 2, quantity: 5, type: TradeMove.BUY, createdTimestamp: threeDaysAgo.getTime() })
            .addTrade({ ticker: 'TSLA', price: 1, quantity: 5, type: TradeMove.BUY, createdTimestamp: threeDaysAgo.getTime() })

        const oneDayAgo = daysBefore(now,1);

        wallet
            .updatePrice('BTC', 2, oneDayAgo.getTime())
            .updatePrice('ETH', 2, oneDayAgo.getTime())
            .updatePrice('NVDA', 10, oneDayAgo.getTime())
            .updatePrice('TSLA', 10, oneDayAgo.getTime());

        const trendData = wallet.getTrendBalanceSnapshotsBuyAndHold(5, now);

        expect(trendData).toHaveLength(5);
        expect(trendData[0].value).toEqual(100);
        expect(trendData[1].value.toFixed(2)).toEqual('116.67');
        expect(trendData[2].value.toFixed(2)).toEqual('116.67');
        expect(trendData[3].value.toFixed(2)).toEqual('116.67');
        expect(trendData[4].value.toFixed(2)).toEqual('279.49');
    })
})