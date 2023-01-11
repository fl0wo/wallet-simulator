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
        wallet.addTrade({ ticker: 'BTC', price: 10, quantity: 1, type: TradeMove.BUY });
        wallet.updatePrice('BTC',20);
        expect(wallet.getPositionValue('BTC')).toEqual(20);
    });

    test('total value calculated correctly', () => {
        const wallet = new WalletSimulator(100);
        wallet.addTrade({ ticker: 'BTC', price: 10, quantity: 1, type: TradeMove.BUY });
        wallet.updatePrice('BTC', 20);
        expect(wallet.getTotalValue()).toEqual(110);
    });

    test('average cost calculated correctly', () => {
        const wallet = new WalletSimulator(100);
        wallet.addTrade({ ticker: 'BTC', price: 10, quantity: 1, type: TradeMove.BUY });
        expect(wallet.getPositionAverageCost('BTC')).toEqual(10);
        wallet.addTrade({ ticker: 'BTC', price: 20, quantity: 1, type: TradeMove.BUY });
        expect(wallet.getPositionValue('BTC')).toEqual(40);
        expect(wallet.getPositionAverageCost('BTC')).toEqual(15);
    });

    test('adding multiple trades updates balance and holdings', () => {
        const wallet = new WalletSimulator(100);
        wallet.addTrade({ ticker: 'BTC', price: 10, quantity: 1, type: TradeMove.BUY });
        wallet.addTrade({ ticker: 'ETH', price: 20, quantity: 2, type: TradeMove.BUY });
        expect(wallet.balance).toEqual(50);
        expect(wallet.getPositionQuantity('BTC')).toEqual(1);
        expect(wallet.getPositionQuantity('ETH')).toEqual(2);
    });

    test('updating prices of multiple assets stores correct values', () => {
        const wallet = new WalletSimulator(100);
        wallet.updatePrice('BTC', 10);
        wallet.updatePrice('ETH', 20);
        expect(wallet.getPrice('BTC')).toEqual(10);
        expect(wallet.getPrice('ETH')).toEqual(20);
    });

    test('position values of multiple assets calculated correctly', () => {
        const wallet = new WalletSimulator(100);
        wallet.updatePrice('BTC', 10);
        wallet.updatePrice('ETH', 20);
        wallet.addTrade({ ticker: 'BTC', price: 10, quantity: 1, type: TradeMove.BUY });
        wallet.addTrade({ ticker: 'ETH', price: 20, quantity: 2, type: TradeMove.BUY });
        expect(wallet.getPositionValue('BTC')).toEqual(10);
        expect(wallet.getPositionValue('ETH')).toEqual(40);
    });

    test('average cost of multiple positions calculated correctly', () => {
        const wallet = new WalletSimulator(100);
        wallet.updatePrice('BTC', 10);
        wallet.updatePrice('ETH', 20);
        wallet.addTrade({ ticker: 'BTC', price: 10, quantity: 1, type: TradeMove.BUY });
        wallet.addTrade({ ticker: 'ETH', price: 20, quantity: 2, type: TradeMove.BUY });
        wallet.addTrade({ ticker: 'BTC', price: 15, quantity: 1, type: TradeMove.BUY });
        expect(wallet.getPositionAverageCost('BTC')).toEqual(12.5);
        expect(wallet.getPositionAverageCost('ETH')).toEqual(20);
    });

    test('estimated liquidation price of multiple positions calculated correctly', () => {
        const wallet = new WalletSimulator(100);
        wallet.updatePrice('BTC', 10);
        wallet.updatePrice('ETH', 20);
        wallet.addTrade({ ticker: 'BTC', price: 10, quantity: 1, type: TradeMove.BUY });
        wallet.addTrade({ ticker: 'ETH', price: 20, quantity: 2, type: TradeMove.BUY });
        wallet.addTrade({ ticker: 'BTC', price: 15, quantity: 1, type: TradeMove.BUY });
        expect(wallet.getEstimatedLiquidationPrice('BTC')).toEqual(12.5);
        expect(wallet.getEstimatedLiquidationPrice('ETH')).toEqual(20);
    });

    test('estimated unrealized profit or loss of multiple positions calculated correctly', () => {
        const wallet = new WalletSimulator(100);
        wallet.updatePrice('BTC', 10);
        wallet.updatePrice('ETH', 20);
        wallet.addTrade({ ticker: 'BTC', price: 10, quantity: 1, type: TradeMove.BUY });
        wallet.addTrade({ ticker: 'ETH', price: 20, quantity: 2, type: TradeMove.BUY });
        expect(wallet.getEstimatedUnrealizedProfitLoss('BTC')).toEqual(0);
        expect(wallet.getEstimatedUnrealizedProfitLoss('ETH')).toEqual(0);
        wallet.updatePrice('BTC', 20);
        wallet.updatePrice('ETH', 30);
        expect(wallet.getEstimatedUnrealizedProfitLoss('BTC')).toEqual(10);
        expect(wallet.getEstimatedUnrealizedProfitLoss('ETH')).toEqual(20);
    });

    test('average cost of multiple buys and sells calculated correctly', () => {
        const wallet = new WalletSimulator(100);
        wallet.updatePrice('BTC', 10);
        wallet.addTrade({ ticker: 'BTC', price: 10, quantity: 1, type: TradeMove.BUY });
        wallet.addTrade({ ticker: 'BTC', price: 15, quantity: 1, type: TradeMove.BUY });
        wallet.addTrade({ ticker: 'BTC', price: 20, quantity: 1, type: TradeMove.SELL });
        expect(wallet.getPositionAverageCost('BTC')).toEqual(5);
    });

    test('estimated liquidation price of multiple buys and sells calculated correctly', () => {
        const wallet = new WalletSimulator(100);
        wallet.updatePrice('BTC', 10);
        wallet.addTrade({ ticker: 'BTC', price: 10, quantity: 1, type: TradeMove.BUY });
        wallet.addTrade({ ticker: 'BTC', price: 15, quantity: 1, type: TradeMove.BUY });
        wallet.addTrade({ ticker: 'BTC', price: 20, quantity: 1, type: TradeMove.SELL });
        expect(wallet.getEstimatedLiquidationPrice('BTC')).toEqual(5);
    });

    test('estimated unrealized profit or loss of multiple buys and sells calculated correctly', () => {
        const wallet = new WalletSimulator(100);
        wallet.updatePrice('BTC', 10);
        wallet.addTrade({ ticker: 'BTC', price: 10, quantity: 1, type: TradeMove.BUY });
        wallet.addTrade({ ticker: 'BTC', price: 15, quantity: 1, type: TradeMove.BUY });
        wallet.addTrade({ ticker: 'BTC', price: 20, quantity: 1, type: TradeMove.SELL });
        expect(wallet.getEstimatedUnrealizedProfitLoss('BTC')).toEqual(15);
    });

    test('multiple trades made', () => {
        const wallet = new WalletSimulator(100);

        wallet.addTrade({ ticker: 'Bananas', price: 1, quantity: 10, type: TradeMove.BUY })
        wallet.addTrade({ ticker: 'aPPLES', price: 3, quantity: 1, type: TradeMove.BUY })

        wallet.addTrade({ ticker: 'w', price: 1, quantity: 2, type: TradeMove.BUY })
        wallet.addTrade({ ticker: 'Bananas', price: 3, quantity: 1, type: TradeMove.SELL })
        wallet.addTrade({ ticker: 'f', price: 2, quantity: 5, type: TradeMove.BUY })
        wallet.addTrade({ ticker: 'Bananas', price: 10, quantity: 1, type: TradeMove.SELL })

        expect(wallet.trades.length).toEqual(6);
    });

})
