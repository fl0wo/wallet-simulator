import {WalletSimulator} from "../index";
import {daysBefore, mockDate} from "../utils/mock";
import {TradeMove} from "../models/Trade";

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

        console.log(w.getTotalValue(), ' == ',startBalance + sumPL)

        expect(startBalance + sumPL)
            .toStrictEqual(w.getTotalValue())
    })
})