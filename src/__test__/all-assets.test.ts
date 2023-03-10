import {WalletSimulator} from "../index";
import {TradeMove} from "../models/Trade";

describe('getAllAssets',()=>{

    test('getAllOwnedAssets empty',()=>{
        const w = new WalletSimulator(100)
        const act = w.getAllOwnedAssets();

        expect(act).toHaveLength(1)
    })

    test('getAllOwnedAssets 1',()=>{
        const w = new WalletSimulator(100)
            .addTrade({ ticker: 'BTC', quantity: 1, price:1, type: TradeMove.BUY })
        const act = w.getAllOwnedAssets();

        expect(act).toHaveLength(2)
        expect(act).toStrictEqual(['USDT','BTC'])
    })

    test('getAllOwnedAssets 3',()=>{
        const w = new WalletSimulator(100)
            .addTrade({ ticker: 'BTC', quantity: 1, price:1, type: TradeMove.BUY })
            .addTrade({ ticker: 'ETH', quantity: 1, price:1, type: TradeMove.BUY })
            .addTrade({ ticker: 'LTC', quantity: 1, price:1, type: TradeMove.BUY })

        const act = w.getAllOwnedAssets();

        expect(act).toHaveLength(4)
        expect(act).toStrictEqual(['USDT','BTC','ETH','LTC'])
    })

    test('getAllOwnedAssets 3 no duplicates',()=>{
        const w = new WalletSimulator(100)
            .addTrade({ ticker: 'BTC', quantity: 1, price:1, type: TradeMove.BUY })
            .addTrade({ ticker: 'ETH', quantity: 1, price:1, type: TradeMove.BUY })
            .addTrade({ ticker: 'LTC', quantity: 1, price:1, type: TradeMove.BUY })
            .addTrade({ ticker: 'BTC', quantity: 1, price:1, type: TradeMove.BUY })
            .addTrade({ ticker: 'ETH', quantity: 1, price:1, type: TradeMove.BUY })
            .addTrade({ ticker: 'LTC', quantity: 1, price:1, type: TradeMove.BUY })
            .addTrade({ ticker: 'LTC', quantity: 1, price:1, type: TradeMove.BUY })


        const act = w.getAllOwnedAssets();

        expect(act).toHaveLength(4)
        expect(act).toStrictEqual(['USDT','BTC','ETH','LTC'])
    })

    test('getAllOwnedAssets buys but sells still showing',()=>{
        const w = new WalletSimulator(100)
            .addTrade({ ticker: 'BTC', quantity: 1, price:1, type: TradeMove.BUY })
            .addTrade({ ticker: 'BTC', quantity: 1, price:1, type: TradeMove.SELL })

        const act = w.getAllOwnedAssets();

        expect(act).toHaveLength(2)
        expect(act).toStrictEqual(['USDT','BTC'])
    })
})