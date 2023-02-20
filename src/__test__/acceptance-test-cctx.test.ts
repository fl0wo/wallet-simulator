import {CCTXWrapper} from "../utils/cctx-wrapper";
import * as fs from "fs";
import {WalletSimulator} from "../index";
import {mockCCTXField, mockCCTXMethod, mockCCTXMethodReturn, mockDate} from "../utils/mock";
import {readFileSync} from "fs";

const secrets = require('../../_secrets/sec.json')
jest.setTimeout(60000)

let client:CCTXWrapper;

export function mockCCTXClient() {
    mockCCTXMethod('fetchMyTrades',
        (symbol) => JSON.parse(readFileSync(`./src/__mock__/fetchMyTrades${String(symbol[0]).replace('/', '_')}.json`).toString('utf-8'))
    )
    mockCCTXMethod('fetchClosedOrders',
        (symbol) => JSON.parse(readFileSync(`./src/__mock__/fetchClosedOrders${String(symbol[0]).replace('/', '_')}.json`).toString('utf-8'))
    )
    mockCCTXMethodReturn('fetchTickers',
        JSON.parse(readFileSync('./src/__mock__/fetchTickers.json').toString('utf-8'))
    )
    mockCCTXMethodReturn('fetchTotalBalance',
        JSON.parse(readFileSync('./src/__mock__/fetchTotalBalance.json').toString('utf-8'))
    )
    mockCCTXField('symbols',
        JSON.parse(readFileSync('./src/__mock__/symbols.json').toString('utf-8'))
    )
    mockCCTXField('markets',
        JSON.parse(readFileSync('./src/__mock__/loadMarkets.json').toString('utf-8'))
    )
    mockCCTXMethodReturn('loadMarkets',
        JSON.parse(readFileSync('./src/__mock__/loadMarkets.json').toString('utf-8'))
    )
}

/**
 * ALWAYS RUN THIS TEST BEFORE PUBLISHING
 */
describe.skip('CCTX ACCEPTANCE', () => {

    beforeAll(async () => {
        mockDate(new Date('2023-02-16T12:00:18.670Z'));
        mockCCTXClient();
        client = await CCTXWrapper.getClientWith(secrets.floApi, secrets.floSecret);
    });

    it.only('acceptance cctx to wallet-sim',async () => {
        expect(client).toBeDefined();

        const w:WalletSimulator = await client.initWalletSimulator();

        const actualJson = w.exportToJson();
        const expectedJson = fs.readFileSync('./walletExample.json').toString('utf-8');

        fs.writeFileSync('./realWallet.json',actualJson)

        console.log('client.getNumberHTTPCallsMade()',client.getNumberHTTPCallsMade())

        expect(JSON.parse(actualJson))
            .toStrictEqual(JSON.parse(expectedJson))
    })

});

/*
 {
        'BTC/USDT': {
          symbol: 'BTC/USDT',
          positionSize: 0.0000072,
          curPrice: 24882.32,
          spentPrice: 23095.61,
          positionValue: 0.179152704,
          unrealizedPnl: -2.238547201225995e-11,
          unrealizedPnlPercentage: 7.7361455272235675
        },
        'LTC/USDT': {
          symbol: 'LTC/USDT',
          positionSize: 0.00049,
          curPrice: 102.9,
          spentPrice: 90.5,
          positionValue: 0.050421,
          unrealizedPnl: -6.524598789792157e-7,
          unrealizedPnlPercentage: 13.701657458563544
        },
        'ETH/USDT': {
          symbol: 'ETH/USDT',
          positionSize: 0.00006821,
          curPrice: 1719.91,
          spentPrice: 1584.77,
          positionValue: 0.1173150611,
          unrealizedPnl: -3.381894077647303e-9,
          unrealizedPnlPercentage: 8.527420382768485
        },
        'DOGE/USDT': {
          symbol: 'DOGE/USDT',
          positionSize: 0.894,
          curPrice: 0.08875,
          spentPrice: 0.08817,
          positionValue: 0.0793425,
          unrealizedPnl: -0.06626379577225139,
          unrealizedPnlPercentage: 0.6578201202222946
        },
        'SOL/USDT': {
          symbol: 'SOL/USDT',
          positionSize: 1.41504,
          curPrice: 23.78,
          spentPrice: 23.7,
          positionValue: 33.6496512,
          unrealizedPnl: -0.00020086233511832862,
          unrealizedPnlPercentage: 0.33755274261604157
        },
        'DOT/USDT': {
          symbol: 'DOT/USDT',
          positionSize: 2.69311,
          curPrice: 6.615,
          spentPrice: 6.581,
          positionValue: 17.81492265,
          unrealizedPnl: -0.0021033486652692656,
          unrealizedPnlPercentage: 0.5166388086916852
        },
        'AVAX/USDT': {
          symbol: 'AVAX/USDT',
          positionSize: 0.00537,
          curPrice: 19.93,
          spentPrice: 17.93,
          positionValue: 0.1070241,
          unrealizedPnl: -0.000030054997286934835,
          unrealizedPnlPercentage: 11.154489682097045
        }
      }

 */