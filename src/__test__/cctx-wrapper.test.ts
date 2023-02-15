import {CCTXWrapper} from "../utils/cctx-wrapper";
import * as fs from 'fs';

const secrets = require('../../_secrets/sec.json')
let client:CCTXWrapper;

jest.setTimeout(60000)

describe.skip('WalletTrend',()=>{
    beforeAll(async () => {
        client = await CCTXWrapper.getClientWith(secrets.floApi, secrets.floSecret);
    })

    it('normal wallet trend',async () => {
        const w = await client.initWalletSimulator();
        const snapshots = w.getTrendBalanceSnapshotsCalculated(30,new Date());
        // console.log(JSON.stringify(snapshots))
    })

    it('orders list',async () => {
        const _tradesPromise = await client.getMyTrades()
        // console.log(_tradesPromise)
    })

})


describe.skip('CCTX Wrapper',()=>{
    beforeAll(async () => {
        client = await CCTXWrapper.getClientWith(secrets.floApi, secrets.floSecret);
    })

    test('with client api keys ok',async () => {
        expect(client).toBeDefined()
        const w = await client.initWalletSimulator();

        expect(w.getTrendBalanceSnapshotsCalculated(31,new Date()))
            .toHaveLength(30);

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

    test('allSymbols ok',async ()=>{
        const allSymbols:string[] = await client.allSymbols();
        expect(allSymbols.length).toBeGreaterThan(10)
    })

    test('getAllHoldings ok',async () => {
        const totBalance = await client.getAllHoldings();
        expect(totBalance)
            .toBeDefined()
        expect(totBalance.USDT)
            .toBeDefined()
    });

    test('getTotalBuyPower ok',async () => {
        const buyPower = await client.getTotalBuyPower()
        expect(buyPower)
            .toBeGreaterThan(0)
    });

    test('getDate ok',async () => {
        const time = await client.getCurrentTimeMs()
        expect(time)
            .toBeGreaterThan(0)
    });

    test('getAllTickerPrices ok',async () => {
        const allPrices = await client.getAllTickerPrices(['BTC','ETHW'])

        expect(allPrices)
            .toBeDefined()
    });

    test('getAllTickerPrices with weird symbol ok',async () => {
        const allPrices = await client.getAllTickerPrices(['BTC/USDT','ETHW/USDT']);
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