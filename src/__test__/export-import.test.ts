import {WalletSimulator} from "../index";
import {mockDate} from "../utils/mock";
import {TradeMove} from "../models/Trade";

// FIXME: still to implement import/export
describe('export-import test',()=>{
    test('export ok',()=>{
        mockDate(new Date('2019-10-01T00:00:01.30Z')); // Time is ❄
        const w = new WalletSimulator(100);

        const toString = w.exportToJson();

        expect(toString)
            .toStrictEqual('{"_trades":[],"balanceAtWalletCreation":100,"allowNegativeBalance":false,"allowNegativeHeld":false,"totalValueInUSDT":100,"holdings":{"USDT":100},"prices":{"USDT":1},"costBasis":{},"daySnapshots":{},"_creationAt":"2019-10-01T00:00:01.300Z"}')
    })

    test('import ok',()=>{
        const w = new WalletSimulator(100)
            .addTrade({ ticker: 'AAPL', price: 1, quantity: 10, type: TradeMove.BUY })

        const toString = w.exportToJson();
        const wImported = WalletSimulator.importFromJsonString(toString)

        expect(wImported)
            .toStrictEqual(w)
    })
})

export const exportImportWallet = (w:WalletSimulator) => WalletSimulator.importFromJsonString(w.exportToJson());
