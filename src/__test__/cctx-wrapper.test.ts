import {CCTXWrapper} from "../utils/cctx-wrapper";
const secrets = require('../../_secrets/sec.json')

jest.setTimeout(60000)

describe.skip('CCTX Wrapper',()=>{

    const client = CCTXWrapper.getClientWith(secrets.api,secrets.secret);

    test.skip('with client api keys ok',async () => {
        expect(client).toBeDefined()

        const w = await client.initWalletSimulator();

        console.log(w);
        console.log(w.getTotalValue())
    });

    test('showRequiredCredentials ok',()=>{
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
        console.log(totBalance)
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
        console.log(allPrices)
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

        console.log(btcPrice)

        expect(btcPrice)
            .toBeDefined()
    });

})