import {WalletSimulator} from "../index";
import {TradeMove} from "../models/Trade";
import {exportImportWallet} from "./export-import.test";
import {CCTXWrapper} from "../utils/cctx-wrapper";

const secrets = require('../../_secrets/sec.json')

jest.setTimeout(60000);
let wallet:any;

async function getWallet():Promise<WalletSimulator> {
    if (!wallet) {
        const client = await CCTXWrapper.getClientWith(secrets.api, secrets.secret);
        wallet = await client.initWalletSimulator();
    }
    return wallet;
}

/**
 *
 */
describe.skip('WalletSimulator With CCTX Import to Db before Each Test' , () => {

    beforeAll(async () => {
        await getWallet();
    })

    beforeEach(()=>{
        wallet.setBalance(100);
    })

    test('My WalletSimulator', () => {
        expect(new WalletSimulator(300)).toBeDefined()
    });

    test('adding a trade updates balance and holdings', () => {
        wallet
            .addTrade({ticker: 'BTC', price: 10, quantity: 1, type: TradeMove.BUY})
            .addTrade({ticker: 'BTC', price: 10, quantity: 1, type: TradeMove.BUY})
            .addTrade({ticker: 'BTC', price: 5, quantity: 2, type: TradeMove.BUY});

        const wEI = exportImportWallet(wallet)

        expect(wEI.getBalance()).toEqual(70);
        expect(wEI.getPositionQuantity('BTC')).toEqual(4);
    });

    test('updating price stores correct value', () => {
        wallet
            .updatePrice('BTC', 10);

        const wEI = exportImportWallet(wallet)

        expect(wEI.getPrice('BTC')).toEqual(10);
    });

    test('position value calculated correctly', () => {
        wallet
            .addTrade({ticker: 'BTC', price: 10, quantity: 1, type: TradeMove.BUY})
            .updatePrice('BTC', 20);

        const wEI = exportImportWallet(wallet)

        expect(wEI.getPositionValue('BTC')).toEqual(20);
    });

    test('total value calculated correctly', () => {
        wallet
            .addTrade({ticker: 'BTC', price: 10, quantity: 1, type: TradeMove.BUY})
            .updatePrice('BTC', 20);

        const wEI = exportImportWallet(wallet)

        expect(wEI.getTotalValue()).toEqual(110);
    });

    test('average cost calculated correctly', () => {
        wallet
            .addTrade({ticker: 'BTC', price: 10, quantity: 1, type: TradeMove.BUY})
            .addTrade({ticker: 'BTC', price: 20, quantity: 1, type: TradeMove.BUY});

        const wEI = exportImportWallet(wallet)

        expect(wEI.getPositionValue('BTC')).toEqual(40);
        expect(wEI.getPositionAverageCost('BTC')).toEqual(15);
    });

    test('adding multiple trades updates balance and holdings', () => {
        wallet
            .addTrade({ticker: 'BTC', price: 10, quantity: 1, type: TradeMove.BUY})
            .addTrade({ticker: 'ETH', price: 20, quantity: 2, type: TradeMove.BUY});

        const wEI = exportImportWallet(wallet)

        expect(wEI.getBalance()).toEqual(50);
        expect(wEI.getPositionQuantity('BTC')).toEqual(1);
        expect(wEI.getPositionQuantity('ETH')).toEqual(2);
    });

    test('updating prices of multiple assets stores correct values', () => {
        wallet
            .updatePrice('BTC', 10)
            .updatePrice('ETH', 20);

        const wEI = exportImportWallet(wallet)

        expect(wEI.getPrice('BTC')).toEqual(10);
        expect(wEI.getPrice('ETH')).toEqual(20);
    });

    test('position values of multiple assets calculated correctly', () => {
        wallet
            .updatePrice('BTC', 10)
            .updatePrice('ETH', 20)
            .addTrade({ticker: 'BTC', price: 10, quantity: 1, type: TradeMove.BUY})
            .addTrade({ticker: 'ETH', price: 20, quantity: 2, type: TradeMove.BUY});
        const wEI = exportImportWallet(wallet)

        expect(wEI.getPositionValue('BTC')).toEqual(10);
        expect(wEI.getPositionValue('ETH')).toEqual(40);
    });

    test('average cost of multiple positions calculated correctly', () => {
        wallet
            .updatePrice('BTC', 10)
            .updatePrice('ETH', 20)
            .addTrade({ticker: 'BTC', price: 10, quantity: 1, type: TradeMove.BUY})
            .addTrade({ticker: 'ETH', price: 20, quantity: 2, type: TradeMove.BUY})
            .addTrade({ticker: 'BTC', price: 15, quantity: 1, type: TradeMove.BUY});
        const wEI = exportImportWallet(wallet)

        expect(wEI.getPositionAverageCost('BTC')).toEqual(12.5);
        expect(wEI.getPositionAverageCost('ETH')).toEqual(20);
    });

    test('estimated liquidation price of multiple positions calculated correctly', () => {
        wallet
            .updatePrice('BTC', 10)
            .updatePrice('ETH', 20)
            .addTrade({ticker: 'BTC', price: 10, quantity: 1, type: TradeMove.BUY})
            .addTrade({ticker: 'ETH', price: 20, quantity: 2, type: TradeMove.BUY})
            .addTrade({ticker: 'BTC', price: 15, quantity: 1, type: TradeMove.BUY});
        const wEI = exportImportWallet(wallet)

        expect(wEI.getEstimatedLiquidationPrice('BTC')).toEqual(12.5);
        expect(wEI.getEstimatedLiquidationPrice('ETH')).toEqual(20);
    });

    test('estimated unrealized profit or loss of multiple positions calculated correctly', () => {
        wallet
            .updatePrice('BTC', 10)
            .updatePrice('ETH', 20)
            .addTrade({ticker: 'BTC', price: 10, quantity: 1, type: TradeMove.BUY})
            .addTrade({ticker: 'ETH', price: 20, quantity: 2, type: TradeMove.BUY});

        const wEI = exportImportWallet(wallet)

        expect(wEI.getEstimatedUnrealizedProfitLoss('BTC')).toEqual(0);
        expect(wEI.getEstimatedUnrealizedProfitLoss('ETH')).toEqual(0);

        wallet.updatePrice('BTC', 20);
        wallet.updatePrice('ETH', 30);

        const wEI2 = exportImportWallet(wallet)

        expect(wEI2.getEstimatedUnrealizedProfitLoss('BTC')).toEqual(10);
        expect(wEI2.getEstimatedUnrealizedProfitLoss('ETH')).toEqual(20);
    });

    test('average cost of multiple buys and sells calculated correctly', () => {
        wallet
            .updatePrice('BTC', 10)
            .addTrade({ticker: 'BTC', price: 10, quantity: 1, type: TradeMove.BUY})
            .addTrade({ticker: 'BTC', price: 15, quantity: 1, type: TradeMove.BUY})
            .addTrade({ticker: 'BTC', price: 20, quantity: 1, type: TradeMove.SELL});

        const wEI = exportImportWallet(wallet)

        expect(wEI.getPositionAverageCost('BTC')).toEqual(5);
    });

    test('estimated liquidation price of multiple buys and sells calculated correctly', () => {
        wallet
            .updatePrice('BTC', 10)
            .addTrade({ticker: 'BTC', price: 10, quantity: 1, type: TradeMove.BUY})
            .addTrade({ticker: 'BTC', price: 15, quantity: 1, type: TradeMove.BUY})
            .addTrade({ticker: 'BTC', price: 20, quantity: 1, type: TradeMove.SELL});
        const wEI = exportImportWallet(wallet)

        expect(wEI.getEstimatedLiquidationPrice('BTC')).toEqual(5);
    });

    test('estimated unrealized profit or loss of multiple buys and sells calculated correctly', () => {
        wallet
            .updatePrice('BTC', 10)
            .addTrade({ticker: 'BTC', quantity: 1, type: TradeMove.BUY})
            .addTrade({ticker: 'BTC', price: 15, quantity: 1, type: TradeMove.BUY})
            .addTrade({ticker: 'BTC', price: 20, quantity: 1, type: TradeMove.SELL});
        const wEI = exportImportWallet(wallet)

        expect(wEI.getEstimatedUnrealizedProfitLoss('BTC')).toEqual(15);
    });

    test('multiple trades made', () => {
        wallet
            .addTrade({ticker: 'Bananas', price: 1, quantity: 10, type: TradeMove.BUY})
            .addTrade({ticker: 'aPPLES', price: 3, quantity: 1, type: TradeMove.BUY})
            .addTrade({ticker: 'w', price: 1, quantity: 2, type: TradeMove.BUY})
            .addTrade({ticker: 'Bananas', price: 3, quantity: 1, type: TradeMove.SELL})
            .addTrade({ticker: 'f', price: 2, quantity: 5, type: TradeMove.BUY})
            .addTrade({ticker: 'Bananas', price: 10, quantity: 1, type: TradeMove.SELL})
        const wEI = exportImportWallet(wallet)

        expect(wEI.trades.length).toEqual(6);
    });

})
