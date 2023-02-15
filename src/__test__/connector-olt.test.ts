import {CCTXWrapper} from "../utils/cctx-wrapper";
import {MyWalletAccount} from "../models/MyWalletAccount";
import * as fs from 'fs';
import {WalletSimulator} from "../index";

const secrets = require('../../_secrets/sec.json')
jest.setTimeout(60000)

let client:CCTXWrapper;

describe('CCTX connection to wallet test', () => {

    beforeAll(async () => {
        client = await CCTXWrapper.getClientWith(secrets.floApi, secrets.floSecret);
    })

    test('CCTX getAccount', async () => {
        // Use this to fetch BUY POWER
        const account: MyWalletAccount = await client.getAccount();
        expect(account.buyPowerUSDT)
            .toBeGreaterThan(50);
        expect(account.cctxBalance)
            .toBeDefined();

        console.log(JSON.stringify(account))
    });

    test('CCTX My Trades', async () => {
        const orders = await client.getMyTrades();
        const str = JSON.stringify(orders)
            .replace(/"([^"]+)":/g, '$1:');
        fs.writeFileSync('./orders.json', str);
        expect(orders.length)
            .toBeGreaterThan(0);
    });

    test('CCTX All Currencies', async () => {
        const currencies = await client.getAllCurrencies();
        console.log(Object.keys(currencies));
        fs.writeFileSync('./currencies.json', JSON.stringify(Object.keys(currencies)))
        expect(currencies)
            .toBeDefined()
    });

    test('CCTX All Ticker Prices', async () => {
        const currencies = await client.getAllTickerPrices(['BTC/USDT','ETH','ltc']);
        console.log(currencies);
        expect(currencies).toBeDefined()
        expect(currencies['LTC/USDT']).toBeDefined()
    });

    test('CCTX Symbols', async () => {
        const symbols = await client.allSymbols();
        console.log(symbols);
    });

    test('CCTX initWalletSimulator Chart', async () => {
        const details:WalletSimulator = await client.initWalletSimulator();
        fs.writeFileSync('./initWalletSimulator.json', details.exportToJson());
        console.log(details.getTotalValue());
    });


    test('CCTX price of', async () => {
        const price = await client.priceOf('LTC');
        console.log(price);
    });


    test('CCTX getDate', async () => {
        const date = await client.getCurrentTimeMs();
        console.log(new Date(date).toISOString(), new Date().toISOString());
    });

    test('CCTX Create Buy Order', async () => {
        const payload: any = client.createOrderPayload({
            type:'limit',
            side:'buy',
            symbol:'BTC/USDT',
            amount:0.00224,
            price: 20000, // <- buy @ this price
            // stopLossPrice:18000, // <- stop-loss @ this price
            // takeProfitPrice:25200 // <- take-home @ this price
        });

        console.log(payload);
        const newOrderResponse = await client.sendOrder(payload);
        console.log(newOrderResponse);
    });

    test('CCTX Get Trade Fees', async () => {
        const tradeFees = await client.getTradeFee('ETH/USDT');
        console.log(tradeFees);
    });

    test('CCTX Get Holdings', async () => {
        const allHoldings = await client.getAllHoldings();
        console.log(allHoldings)
    });

    test.only('CCTX See Positions', async () => {
        const positions = await client.getPositions();
        console.log(positions);
    });

    test('CCTX See Positions', async () => {
        const positions = await client.getPositions();
        console.log(positions);
    });
/*
    test
        .each([
            {coin: Crypto.DOGE, amount: 129.283476},
            {coin: Crypto.BTC, amount: 0.0719274568323},
            {coin: Crypto.ETH, amount: 0.0719274568323},
            {coin: Crypto.SHIB, amount: (637048 + 318524) + 10000000.10291673},
            {coin: Crypto.MANA, amount: 122.126233},
            {coin: Crypto.LTC, amount: 0.1725},
            {coin: Crypto.XRP, amount: 31.2121346},
            {coin: Crypto.DOT, amount: 5.58},
            {coin: Crypto.ADA, amount: 221.82132345},

        ])('CCTX TRUSTED_CRYPTOS SELL TEST ALL', async (
            args: { coin: Crypto; amount: number }) => {
            (await bin.loadAllFiltersFor());
            const payload: any = await bin.createOrderPayload(
                MoveType.SELL,
                args.coin,
                BaseCurrency.USD,
                args.amount,
                //0.028
            );
            const newOrderResponse = await bin.createOrder(payload, false);
            console.log(newOrderResponse);
            expect(newOrderResponse).toEqual({});
        });
 */
});
