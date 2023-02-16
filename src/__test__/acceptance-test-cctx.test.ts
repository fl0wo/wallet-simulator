import {CCTXWrapper} from "../utils/cctx-wrapper";
import * as fs from "fs";
import {WalletSimulator} from "../index";
import {mockCCTXField, mockCCTXMethod, mockCCTXMethodReturn, mockDate} from "../utils/mock";
import {readFileSync} from "fs";

const secrets = require('../../_secrets/sec.json')
jest.setTimeout(60000)

let client:CCTXWrapper;

/**
 * ALWAYS RUN THIS TEST BEFORE PUBLISHING
 */
describe('CCTX ACCEPTANCE', () => {

    beforeAll(async () => {
        mockDate(new Date('2023-02-16T12:00:18.670Z'));
        mockCCTXMethod(
            'fetchMyTrades',
            (symbol) => JSON.parse(readFileSync(`./src/__mock__/fetchMyTrades${String(symbol[0]).replace('/', '_')}.json`).toString('utf-8'))
        )
        mockCCTXMethodReturn(
            'fetchTickers',
            JSON.parse(readFileSync('./src/__mock__/fetchTickers.json').toString('utf-8'))
        )
        mockCCTXMethodReturn(
            'fetchTotalBalance',
            JSON.parse(readFileSync('./src/__mock__/fetchTotalBalance.json').toString('utf-8'))
        )
        mockCCTXField(
            'symbols',
            JSON.parse(readFileSync('./src/__mock__/symbols.json').toString('utf-8'))
        )
        mockCCTXField(
            'markets',
            JSON.parse(readFileSync('./src/__mock__/loadMarkets.json').toString('utf-8'))
        )
        mockCCTXMethodReturn(
            'loadMarkets',
            JSON.parse(readFileSync('./src/__mock__/loadMarkets.json').toString('utf-8'))
        )

        client = await CCTXWrapper.getClientWith(secrets.floApi, secrets.floSecret);
    });

    it('acceptance cctx to wallet-sim',async () => {
        expect(client).toBeDefined();

        const w:WalletSimulator = await client.initWalletSimulator();

        const actualJson = w.exportToJson();
        const expectedJson = fs.readFileSync('./walletExample.json').toString('utf-8');

        expect(JSON.parse(actualJson))
            .toStrictEqual(JSON.parse(expectedJson))
    })

});
