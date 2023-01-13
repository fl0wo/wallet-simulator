import {WalletSimulator} from "../index";
import {mockDate} from "../utils/mock";
import {TradeMove} from "../models/Trade";

describe('id on trades test',()=>{

    test('id passed ok',()=>{
        mockDate(new Date('2019-10-01T00:00:01.30Z')); // Time is ❄
        const wallet = new WalletSimulator(100)
            .addTrade({ id:'hi :)', ticker: 'BTC', quantity: 1, price:1, type: TradeMove.BUY })

        expect(wallet.trades[0].id)
            .toEqual('hi :)');
    })

    test('id not passed ok',()=>{
        mockDate(new Date('2019-10-01T00:00:01.30Z')); // Time is ❄
        const wallet = new WalletSimulator(100)
            .addTrade({ ticker: 'BTC', quantity: 1, price:1, type: TradeMove.BUY })

        expect(wallet.trades[0].id)
            .toHaveLength(36)
    })

})