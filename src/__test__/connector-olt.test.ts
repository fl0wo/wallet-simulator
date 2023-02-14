import {CCTXWrapper, CCTXWrapperError} from "../utils/cctx-wrapper";
import {MyWalletAccount} from "../models/MyWalletAccount";
import * as fs from 'fs';

const secrets = require('../../_secrets/sec.json')
jest.setTimeout(60000)

let client:CCTXWrapper;

describe('CCTX connection to wallet test', () => {

    beforeAll(async () => {
        client = await CCTXWrapper.getClientWith(secrets.floApi, secrets.floSecret);
    })

    test('CCTX Connection', async () => {
        const account: MyWalletAccount = await client.getAccount();
        expect(account.buyPowerUSDT)
            .toBeGreaterThan(50);
        expect(account.cctxBalance)
            .toBeDefined();

        // console.log(account);
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

    test.only('CCTX All Ticker Prices', async () => {
        const currencies = await client.getAllTickerPrices(['BTC/USDT','ETH','ltc']);
        console.log(currencies);
        expect(currencies).toBeDefined()
        expect(currencies['LTC/USDT']).toBeDefined()

    });

    test('CCTX Symbols', async () => {
        const symbols = await client.allSymbols();
        console.log(symbols);
    });
    /*
        test('CCTX getBotDetailsLive Chart', async () => {
            await bin.loadAllFiltersFor();
            const details: VUserBotDetails = await bin.getBotDetailsLive();
            fs.writeFileSync('./orders4.json', JSON.stringify(details));
            console.log(JSON.stringify(details));
        });

        test('CCTX global filters', async () => {
            GlobalCronometer2.RESET_NOW();
            const filters = await bin.loadAllFiltersFor();
            console.log(GlobalCronometer2.DIFF_MS(), 'ms to load bin.loadAllFiltersFor()');
            console.log(filters);
        });

        test('CCTX price of', async () => {
            const price = await bin.priceOf('LTCUSDT');
            console.log(price);
        });

        test('CCTX toFixedAmountForCCTX', async () => {
            await bin.loadAllFiltersFor();
            const adapted = await bin.toFixedAmount(Crypto.LTC, 12.2396233);
            console.log(adapted);
        });

        test.skip('CCTX Symbol Info', async () => {
            const symbolInfo = await bin.getSymbolInfo(Crypto.SHIB);
            console.log(symbolInfo);
        });

        test('CCTX getDate', async () => {
            const date = await bin.getDate();
            console.log(new Date(date).toISOString(), new Date().toISOString());
        });

        test('CCTX Create Buy Order TEST', async () => {
            const payload: any = await bin.createOrderPayload(
                MoveType.BUY,
                Crypto.DOGE,
                BaseCurrency.USD,
                15
            );
            console.log(payload);
            const newOrderResponse = await bin.createOrder(payload);
            console.log(newOrderResponse);

            expect(newOrderResponse).toEqual({});
        });

        test('CCTX Create Sell Order TEST', async () => {
            const payload: any = await bin.createOrderPayload(
                MoveType.SELL,
                Crypto.MANA,
                BaseCurrency.USD,
                222
                //0.028
            );
            const newOrderResponse = await bin.createOrder(payload);
            console.log(newOrderResponse);
            expect(newOrderResponse).toEqual({});
        });

        test('CCTX Get Positions', async () => {
            const positions = await bin.getPositions();
            console.log(positions);
        });

        test('CCTX Total Balance', async () => {
            const totBalance = await bin.getTotalBalance();
            console.log(totBalance);
        });

        test('CCTX Get Trade Fees', async () => {
            const tradeFees = await bin.getTradeFee();
            console.log(tradeFees);
        });

        test('CCTX Get Position', async () => {
            // @ts-ignore
            const position: Position[] = await bin.getPositionWithSymbol(
                bin.toLocalAsset(Crypto.DOGE, BaseCurrency.USD));
            console.log(position);
        });

        test('CCTX See Positions % Diffs', async () => {
            // @ts-ignore
            const positions: Position[] = await bin.getPositions();
            console.log(positions.map(pos => `${pos.unrealized_plpc}%`));
        });

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
