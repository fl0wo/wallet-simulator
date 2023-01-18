import {WalletSimulator} from "../index";
import {TradeMove} from "../models/Trade";

describe('Donut Asset Information',()=>{
    test('getDonutAssetInformation', () => {
        const wallet = new WalletSimulator(21000)
            .addTrade({ ticker: 'AAPL', price: 100, quantity: 100, type: TradeMove.BUY })
            .addTrade({ ticker: 'GOOG', price: 50, quantity: 200, type: TradeMove.BUY })

        const assetsInfo = wallet.getDonutAssetInformation();

        expect(assetsInfo).toHaveLength(3);
        expect(assetsInfo)
            .toEqual([
                { ticker: 'USDT', value: 1000, percentage: 4.761904761904762 },
                { ticker: 'AAPL', value: 10000, percentage: 47.61904761904761 },
                { ticker: 'GOOG', value: 10000, percentage: 47.61904761904761 }
            ])
        expect(assetsInfo.reduce((total, a) => total + a.percentage, 0)).toBeCloseTo(100);
    });
})


