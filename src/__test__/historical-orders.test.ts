import {WalletSimulator} from "../index";
import {daysBefore, mockDate} from "../utils/mock";
import {Trade, TradeMove} from "../models/Trade";

describe('order list ',()=>{

    test('orders list',()=>{
        const now = new Date('2019-10-01T00:00:01.30Z')
        mockDate(now); // Time is ❄
        const startBalance = 100;
        const w = new WalletSimulator(startBalance)
            .addTrade({ ticker: 'BTC', quantity: 1, price:1, type: TradeMove.BUY, createdTimestamp: daysBefore(now,10).getTime() })
            .addTrade({ ticker: 'BTC', quantity: 1, price:1, type: TradeMove.BUY, createdTimestamp: daysBefore(now,7).getTime()})
            .addTrade({ ticker: 'BTC', quantity: 1, price:2, type: TradeMove.SELL, createdTimestamp: daysBefore(now,6).getTime() })
            .addTrade({ ticker: 'BTC', quantity: 1, price:1, type: TradeMove.BUY, createdTimestamp: daysBefore(now,5).getTime() })
            .addTrade({ ticker: 'BTC', quantity: 1, price:2, type: TradeMove.SELL, createdTimestamp: daysBefore(now,2).getTime() })

            .addTrade({ ticker: 'BTC', quantity: 1, price:1, type: TradeMove.BUY, createdTimestamp: daysBefore(now,6).getTime() })
            .addTrade({ ticker: 'BTC', quantity: 1, price:1, type: TradeMove.BUY, createdTimestamp: daysBefore(now,5).getTime() })
            .addTrade({ ticker: 'BTC', quantity: 3, price:0.1, type: TradeMove.SELL, createdTimestamp: daysBefore(now,2).getTime() })

        const orderList = w.plMadeByOrders();
        const sumPL = orderList.reduce((acc, cur) => acc + (cur.profit || 0), 0);

        // console.log(w.getTotalValue(), ' == ',startBalance + sumPL)

        expect(startBalance + sumPL)
            .toStrictEqual(w.getTotalValue())
    })

})

describe.skip('calculateProfitsMap', () => {
    it('should calculate the profit for sell orders using the average cost basis of the last 5 buy orders for the same symbol', () => {
        const w=new WalletSimulator(100000);

        w.addTrade({ id: '1', ticker: 'AAPL', type: TradeMove.BUY, quantity: 10, price: 100, fee: 5 })
            .addTrade({ id: '2', ticker: 'AAPL', type: TradeMove.BUY, quantity: 20, price: 110, fee: 5 })
            .addTrade({ id: '3', ticker: 'AAPL', type: TradeMove.BUY, quantity: 30, price: 120, fee: 5 })
            .addTrade({ id: '4', ticker: 'AAPL', type: TradeMove.SELL, quantity: 40, price: 130, fee: 5 })
            .addTrade({ id: '5', ticker: 'AAPL', type: TradeMove.BUY, quantity: 10, price: 140, fee: 5 })
            .addTrade({ id: '6', ticker: 'AAPL', type: TradeMove.BUY, quantity: 20, price: 150, fee: 5 })
            .addTrade({ id: '7', ticker: 'AAPL', type: TradeMove.SELL, quantity: 30, price: 160, fee: 5 })

        const expectedResult: any = {
            '4': 515,
            '7': 165,
        };

        expect(w.calculateProfitsMap(w.trades)).toEqual(expectedResult);
    });
});