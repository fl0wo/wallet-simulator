import {WalletSimulator} from "../index";
import {mockDate} from "../utils/mock";
import {TradeMove} from "../models/Trade";

describe('commision-fees test',()=>{
    test('fees buy ok',()=>{
        mockDate(new Date('2019-10-01T00:00:01.30Z')); // Time is ❄
        const wallet = new WalletSimulator(100)
            .addTrade({ fee:0.1, ticker: 'BTC', quantity: 1, price:1, type: TradeMove.BUY })
            .addTrade({ fee:0.1, ticker: 'BTC', quantity: 1, price:2, type: TradeMove.BUY })
            .addTrade({ fee:0.1, ticker: 'BTC', quantity: 1, price:10, type: TradeMove.BUY })
            .addTrade({ fee:0.1, ticker: 'BTC', quantity: 1, price:3, type: TradeMove.BUY })
            .addTrade({ fee:0.1, ticker: 'BTC', quantity: 1, price:2, type: TradeMove.BUY })

        expect(wallet.getBalance()).toEqual(81.982);
        expect(wallet.getPositionQuantity('BTC'))
            .toEqual(5);
    })

    test("buy with fee", () => {
        const wallet = new WalletSimulator(1000);
        wallet.addTrade({ ticker: "AAPL", price: 100, quantity: 1, fee: 0.1, type:TradeMove.BUY});
        expect(wallet.getPositionQuantity("AAPL")).toBe(1);
        expect(wallet.getTotalValue()).toBeCloseTo(999.9);
    });

    test("buy without fee", () => {
        const wallet = new WalletSimulator(1000);
        wallet.addTrade({ ticker: "AAPL", price: 100, quantity: 1, fee: 0, type:TradeMove.BUY});
        expect(wallet.getPositionQuantity("AAPL")).toBe(1);
        expect(wallet.getTotalValue()).toStrictEqual(1000);
    });

    test("sell with fee", () => {
        const wallet = new WalletSimulator(1000);
        wallet
            .addTrade({ ticker: "AAPL", price: 100, quantity: 1, type: TradeMove.BUY })
            .addTrade({ ticker: "AAPL", price: 120, quantity: 1, fee: 0.1, type: TradeMove.SELL })

        expect(wallet.getPositionQuantity("AAPL")).toBe(0);
        expect(wallet.getTotalValue()).toBeCloseTo(1019.88);
    });

})