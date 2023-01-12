import {WalletSimulator} from "../index";
import {TradeMove, TradeOptions} from "../models/Trade";
import {mockDate} from "../utils/mock";

describe('get trades', () => {

    let resetDateMock:any;

    beforeEach(() => {
        jest.resetModules(); // it clears the cache
        resetDateMock = mockDate(new Date('2019-10-01T00:00:01.30Z')); // Time is ❄
    });

    afterAll(() => {
        resetDateMock();
    });

    test('get trades', () => {
        const trade1:TradeOptions = { ticker: 'ETH', price: 20, quantity: 2, type: TradeMove.BUY }
        const trade2:TradeOptions = { ticker: 'BTC', price: 20, quantity: 2, type: TradeMove.BUY }
        const trade3:TradeOptions = { ticker: 'LTC', price: 20, quantity: 2, type: TradeMove.BUY }

        const wallet = new WalletSimulator(1000)

        resetDateMock = mockDate(new Date('2019-10-01T00:00:01.30Z')); // Time 1
        wallet.addTrade(trade1)
        resetDateMock = mockDate(new Date('2020-10-01T00:00:01.30Z')); // Time 2
        wallet.addTrade(trade2)
        resetDateMock = mockDate(new Date('2021-10-01T00:00:01.30Z')); // Time 3
        wallet.addTrade(trade3)

        const trades = wallet.trades

        expect(trades.length).toBe(3);
        expect(trades[0].ticker).toBe('ETH');
        expect(trades[1].ticker).toBe('BTC');
        expect(trades[2].ticker).toBe('LTC');

        // Ensure that the trades are sorted by createdTimestamp
        expect(trades[0].createdTimestamp).toBeLessThan(trades[1].createdTimestamp);
        expect(trades[1].createdTimestamp).toBeLessThan(trades[2].createdTimestamp);
    });
});