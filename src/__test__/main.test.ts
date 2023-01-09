import {TradeMove, WalletSimulator} from "../index";

describe('WalletSimulator' , ()=>{

    test('My WalletSimulator', () => {
        expect(new WalletSimulator(300)).toBeDefined()
    });

    test('adding a trade updates balance and holdings', () => {
        const wallet = new WalletSimulator(100);
        wallet.addTrade({ ticker: 'BTC', price: 10, quantity: 1, type: TradeMove.BUY });
        wallet.addTrade({ ticker: 'BTC', price: 10, quantity: 1, type: TradeMove.BUY });
        wallet.addTrade({ ticker: 'BTC', price: 5, quantity: 2, type: TradeMove.BUY });

        expect(wallet.balance).toEqual(70);
        expect(wallet.getPositionQuantity('BTC')).toEqual(4);
    });

    test('updating price stores correct value', () => {
        const wallet = new WalletSimulator(100);
        wallet.updatePrice('BTC', 10);
        expect(wallet.getPrice('BTC')).toEqual(10);
    });

    test('position value calculated correctly', () => {
        const wallet = new WalletSimulator(100);
        wallet.updatePrice('BTC', 10);
        wallet.addTrade({ ticker: 'BTC', price: 10, quantity: 1, type: TradeMove.BUY });
        expect(wallet.getPositionValue('BTC')).toEqual(10);
    });

    test('total value calculated correctly', () => {
        const wallet = new WalletSimulator(100);
        wallet.updatePrice('BTC', 10);
        wallet.addTrade({ ticker: 'BTC', price: 10, quantity: 1, type: TradeMove.BUY });
        expect(wallet.getTotalValue()).toEqual(110);
    });

    test('average cost calculated correctly', () => {
        const wallet = new WalletSimulator(100);
        wallet.updatePrice('BTC', 10);
        wallet.addTrade({ ticker: 'BTC', price: 10, quantity: 1, type: TradeMove.BUY });
        expect(wallet.getPositionAverageCost('BTC')).toEqual(10);
        wallet.addTrade({ ticker: 'BTC', price: 20, quantity: 1, type: TradeMove.BUY });
        expect(wallet.getPositionAverageCost('BTC')).toEqual(15);
    });


})
