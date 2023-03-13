import {Trade, TradeMove} from "../../models/Trade";
import {addProfits} from "../../utils/general";

describe('calc profits of trades',()=>{

    it('should correctly add profit to sell orders', () => {
        const trades: Trade[] = [
            { id: '1', ticker: 'AAPL', price: 100, quantity: 10, type: TradeMove.BUY, createdTimestamp: 1, fee: 1 },
            { id: '2', ticker: 'AAPL', price: 110, quantity: 10, type: TradeMove.BUY, createdTimestamp: 2, fee: 1 },
            { id: '3', ticker: 'AAPL', price: 120, quantity: 20, type: TradeMove.SELL, createdTimestamp: 3, fee: 1 },
            { id: '4', ticker: 'GOOG', price: 200, quantity: 5, type: TradeMove.BUY, createdTimestamp: 4, fee: 1 },
            { id: '5', ticker: 'GOOG', price: 250, quantity: 5, type: TradeMove.SELL, createdTimestamp: 5, fee: 1 },
        ];

        const tradesWithProfits = addProfits(trades);

        expect(tradesWithProfits[0]).toEqual({id: '1', ticker: 'AAPL', price: 100, quantity: 10, type: TradeMove.BUY, createdTimestamp: 1, fee: 1 });
        expect(tradesWithProfits[1]).toEqual({ id: '2', ticker: 'AAPL', price: 110, quantity: 10, type: TradeMove.BUY, createdTimestamp: 2, fee: 1 });
        expect(tradesWithProfits[2])
            .toEqual({
                id: '3',
                ticker: 'AAPL',
                price: 120,
                quantity: 20,
                type: TradeMove.SELL,
                createdTimestamp: 3,
                fee: 1,
                profit: 200
            });
        expect(tradesWithProfits[3]).toEqual({ id: '4', ticker: 'GOOG', price: 200, quantity: 5, type: TradeMove.BUY, createdTimestamp: 4, fee: 1 });
        expect(tradesWithProfits[4]).toEqual({
            id: '5', ticker: 'GOOG',
            price: 250,
            quantity: 5,
            type: TradeMove.SELL,
            createdTimestamp: 5,
            fee: 1,
            profit: 250
        });
    });

})