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

        mockDate(now);
        const trendData = wallet.getTrendBalanceGraph(3,now);

        expect(trendData).toHaveLength(3);
        console.log(trendData)
        expect(trendData[0].value).toEqual(26)
        expect(trendData[1].value).toEqual(31)//105+(5*2));
        expect(trendData[2].value).toEqual(20)//94+(10));

    });
})