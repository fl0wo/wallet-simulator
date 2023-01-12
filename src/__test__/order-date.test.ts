import {Trade, TradeMove} from "../models/Trade";
import {addTimeStampIfNotDefined} from "../utils";

describe('createdTimestamp', () => {
    it('should add a timestamp to the Trade object when it is not provided', () => {
        const tradeWithoutTimestamp: Trade = {
            ticker: 'BTC',
            price: 10,
            quantity: 1,
            type: TradeMove.BUY
        }

        const tradeWithTimestamp = addTimeStampIfNotDefined(tradeWithoutTimestamp);
        expect(tradeWithTimestamp.createdTimestamp).toBeDefined();
    });

    it('should use the provided timestamp if it is defined', () => {
        const providedTimestamp = Date.now();
        const tradeWithProvidedTimestamp: Trade = {
            ticker: 'BTC',
            price: 10,
            quantity: 1,
            type: TradeMove.BUY,
            createdTimestamp: providedTimestamp
        }
        const tradeWithTimestamp = addTimeStampIfNotDefined(tradeWithProvidedTimestamp);
        expect(tradeWithTimestamp.createdTimestamp).toEqual(providedTimestamp);
    });
});