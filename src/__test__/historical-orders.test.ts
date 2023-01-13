import {WalletSimulator} from "../index";
import {mockDate} from "../utils/mock";
import {TradeMove} from "../models/Trade";

describe.skip('order list ',()=>{
    test('orders list',()=>{
        mockDate(new Date('2019-10-01T00:00:01.30Z')); // Time is ❄
        const w = new WalletSimulator(100)
            .addTrade({ ticker: 'BTC', quantity: 1, price:1, type: TradeMove.BUY })
            .addTrade({ ticker: 'BTC', quantity: 1, price:1, type: TradeMove.BUY })
            .addTrade({ ticker: 'BTC', quantity: 1, price:1, type: TradeMove.BUY })
            .addTrade({ ticker: 'BTC', quantity: 1, price:1, type: TradeMove.BUY })
            .addTrade({ ticker: 'BTC', quantity: 1, price:1, type: TradeMove.BUY })

        const orderList = w.plMadeByOrders();

        expect(orderList).toHaveLength(w.trades.length)
    })

})