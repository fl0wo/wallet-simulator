import {TradeMove, TradeOptions} from "../models/Trade";
import {tradeOptionToTrade} from "../utils/general";
import {mockDate} from "../utils/mock";

describe('createdTimestamp', () => {

    let resetDateMock:any;

    beforeEach(() => {
        jest.resetModules(); // it clears the cache
        resetDateMock = mockDate(new Date('2019-10-01T00:00:01.30Z')); // Time is ❄
    });

    afterAll(() => {
        resetDateMock();
    });

    it('should add a timestamp to the Trade object when it is not provided', () => {
        const tradeWithoutTimestamp: TradeOptions = {
            ticker: 'BTC',
            price: 10,
            quantity: 1,
            type: TradeMove.BUY
        }

        const tradeWithTimestamp = tradeOptionToTrade(tradeWithoutTimestamp);
        expect(tradeWithTimestamp.createdTimestamp).toBeDefined();
        expect(tradeWithTimestamp.createdTimestamp).toBe(new Date('2019-10-01T00:00:01.30Z').getTime())
    });

    it('should use the provided timestamp if it is defined', () => {
        const providedTimestamp = Date.now();
        const tradeWithProvidedTimestamp: TradeOptions = {
            ticker: 'BTC',
            price: 10,
            quantity: 1,
            type: TradeMove.BUY,
            createdTimestamp: providedTimestamp
        }
        const tradeWithTimestamp = tradeOptionToTrade(tradeWithProvidedTimestamp);
        expect(tradeWithTimestamp.createdTimestamp).toEqual(providedTimestamp);
    });

    it('if price not defined on trade still works', () => {
        const providedTimestamp = Date.now();
        const tradeWithProvidedTimestamp: TradeOptions = {
            ticker: 'BTC',
            quantity: 1,
            type: TradeMove.BUY,
            createdTimestamp: providedTimestamp
        }
        const tradeWithTimestamp = tradeOptionToTrade(
            tradeWithProvidedTimestamp,
            1000
        );
        expect(tradeWithTimestamp.price).toEqual(1000);
    });
});