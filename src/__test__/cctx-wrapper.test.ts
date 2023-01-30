import {CCTXWrapper} from "../utils/cctx-wrapper";
import * as fs from 'fs';

const secrets = require('../../_secrets/sec.json')

jest.setTimeout(60000)

describe('CCTX Wrapper',()=>{

    const client = CCTXWrapper.getClientWith(secrets.api,secrets.secret);

    test('with client api keys ok',async () => {
        expect(client).toBeDefined()
        const w = await client.initWalletSimulator();

        console.log(w);

        expect(w.getTrendBalanceSnapshots(30,new Date()))
            .toHaveLength(30)
        fs.writeFileSync('./walletExported.json', w.exportToJson());
    });

    test('showRequiredCredentials ok', () => {
        expect(client.showRequiredCredentials())
            .toStrictEqual({
                apiKey: true,
                secret: true,
                uid: false,
                login: false,
                password: false,
                twofa: false,
                privateKey: false,
                walletAddress: false,
                token: false
            })
    });

    test('checkCredentials ok',()=>{
        expect(client.checkCredentials())
            .toBe(true)
    });

    test('getAllHoldings ok',async () => {
        const totBalance = await client.getAllHoldings()

        expect(totBalance)
            .toBeDefined()
    });

    test('getTotalBuyPower ok',async () => {
        const buyPower = await client.getTotalBuyPower()
        expect(buyPower)
            .toBeGreaterThan(0)
    });

    test('getDate ok',async () => {
        const time = await client.getDate()
        expect(time)
            .toBeGreaterThan(0)
    });

    test('getAllTickerPrices ok',async () => {
        const allPrices = await client.getAllTickerPrices()

        expect(allPrices)
            .toBeDefined()
    });

    test('getAllCurrencies ok',async () => {
        const allCurrencies = await client.getAllCurrencies()
        expect(allCurrencies)
            .toBeDefined()
    });

    test('priceOf ok',async () => {
        const btcPrice = await client.priceOf('BTC')

        expect(btcPrice)
            .toBeDefined()
    });

})