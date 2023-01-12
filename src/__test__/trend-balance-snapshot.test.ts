import {WalletSimulator} from "../index";
import {TradeMove} from "../models/Trade";
import {daysBefore, mockDate} from "../utils/mock";

describe('trend balance snapshot test',()=>{

    let resetDateMock:any;

    beforeEach(() => {
        jest.resetModules(); // it clears the cache
        resetDateMock = mockDate(new Date('2019-10-01T00:00:01.30Z')); // Time is ❄
    });

    afterAll(() => {
        resetDateMock();
    });

    test('getTrendBalanceGraph', () => {
        const wallet = new WalletSimulator(16);

        const now = new Date('2020-10-10T00:00:01.30Z');

        let twoDaysAgo = mockDate(daysBefore(now,2)); // Two days ago
        wallet
            .addTrade({ ticker: 'AAPL', price: 1, quantity: 10, type: TradeMove.BUY })
            .updatePrice('AAPL',2);

        let yesterday = mockDate(daysBefore(now,1)); // Day before
        wallet
            .addTrade({ ticker: 'TSLA', price: 1, quantity: 5, type: TradeMove.BUY })
            .updatePrice('TSLA',2)

        let today = mockDate(now); // Today
        wallet.addTrade({ ticker: 'GOOG', price: 1, quantity: 1, type: TradeMove.BUY })
            .updatePrice('AAPL',0)
            .updatePrice('GOOG',10);

        let tomorrow = daysBefore(now,-1)
        mockDate(tomorrow); // tomorrow
        const trendData = wallet.getTrendBalanceGraph(3,tomorrow);

        expect(trendData).toHaveLength(3);
        console.log(trendData)
        expect(trendData[0].value).toEqual(6 + (10*2))
        expect(trendData[1].value).toEqual(21 + (5*2))//105+(5*2));
        expect(trendData[2].value).toEqual(30 + (10 - 20))//94+(10));
    });

    test('getTrendBalanceGraph passing date', () => {

        const oneDayInMs = 24 * 60 * 60 * 1000;
        const now = new Date();

        const twoDaysAgo = now.getTime()-2*oneDayInMs;
        const wallet = new WalletSimulator(16,new Date(twoDaysAgo));

        wallet
            .addTrade({ ticker: 'TSLA', price: 1, quantity: 6, type: TradeMove.BUY,
                createdTimestamp: twoDaysAgo})
            .updatePrice('TSLA',2, twoDaysAgo);

        const totalValueAfterOneDay = wallet.getTotalValue()

        const oneDayAgo = now.getTime()-oneDayInMs;
        wallet.addTrade({ ticker: 'GOOG', price: 1, quantity: 1, type: TradeMove.BUY,
            createdTimestamp: oneDayAgo})
            .updatePrice('AAPL',0,oneDayAgo)
            .updatePrice('GOOG',10,oneDayAgo);

        const totalValueAfterTwoDays = wallet.getTotalValue()

        let tomorrow = daysBefore(now,-1)
        mockDate(tomorrow); // tomorrow
        const trendData = wallet.getTrendBalanceGraph(3,tomorrow);

        expect(trendData).toHaveLength(2);
        console.log(trendData)
        expect(trendData[0].value).toEqual(22)
        expect(trendData[1].value).toEqual(31)

    });

    test.skip('getTrendBalanceGraph with no snapshots in the specified date range', () => {
        const now = new Date();

        // Adding trades and updating prices 5 days ago
        const fiveDaysAgo = daysBefore(now,5);

        const wallet = new WalletSimulator(100);

        wallet
            .addTrade({ ticker: 'AAPL', price: 10, quantity: 10, type: TradeMove.BUY,
                createdTimestamp: fiveDaysAgo.getTime() })
            .updatePrice('AAPL', 20, fiveDaysAgo.getTime());

        // Getting trend data for the last 3 days
        const trendData = wallet.getTrendBalanceGraph(3, now);

        // Expecting an empty array since there are no snapshots in the specified date range
        expect(trendData).toEqual([]);
    });

})