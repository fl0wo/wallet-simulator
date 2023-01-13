import {WalletSimulator} from "../index";
import {mockDate} from "../utils/mock";
import {TradeMove} from "../models/Trade";

// FIXME: still to implement import/export
describe.skip('export-import test',()=>{
    test('export ok',()=>{
        mockDate(new Date('2019-10-01T00:00:01.30Z')); // Time is ❄
        const w = new WalletSimulator(100, );

        const toString = w.exportToText();

        expect(toString)
            .toStrictEqual('{"balance":100,"_trades":[],"balanceAtWalletCreation":100,"holdings":{},"prices":{},"costBasis":{},"daySnapshots":{},"_creationAt":"2019-10-01T00:00:01.300Z"}')
    })

    test('import ok',()=>{
        const w = new WalletSimulator(100)
            .addTrade({ ticker: 'AAPL', price: 1, quantity: 10, type: TradeMove.BUY })

        const toString = w.exportToText();
        const wImported = WalletSimulator.importFromTxt(toString)

        expect(wImported)
            .toStrictEqual(w)
    })
})