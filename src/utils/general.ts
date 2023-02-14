import {Trade, TradeMove, TradeOptions} from "../models/Trade";
import {TrendSnapshotInfo} from "../models/ExtractWalletInformation";
import {daysBetween} from "./mock";
import {WalletSimulator} from "../index";
import {Trade as CCTXTrade} from 'ccxt';

import * as crypto from 'crypto';

export const safeGet = <T, R = any>(object: T | undefined | null,
                                            safeCallback: (object: T) => R,
                                            notSafeCallback: () => R) => {
    if (object) {
        return safeCallback(object)
    } else {
        return notSafeCallback();
    }
}

export const getSafeNull = (obj:any,fallback:any) => {
    if (obj) {
        return obj;
    } else {
        return fallback;
    }
}

export const getSafeOrThrow = <T> (value:T,msg:string):NonNullable<T> => {
    if(value===undefined || value===null) throw Error(msg);
    return value as NonNullable<T>;
}

export const tradeOptionToTrade = (incTrade: TradeOptions,priceOfThisAssetToday?:number): Trade => {
    const ts = getSafeNull(incTrade.createdTimestamp,Date.now());
    const priceNew = getSafeOrThrow(
        getSafeNull(incTrade.price,priceOfThisAssetToday),
        `cannot create new trade without knowing the price of ${incTrade.ticker}`
    );

    const tradeId = getSafeNull(incTrade.id,crypto.randomUUID());
    const feeValue:number = getSafeNull(incTrade.fee,0)

    return {
        ...incTrade,
        price: priceNew,
        createdTimestamp: ts,
        fee: feeValue,
        id:tradeId
    };
}

export const entries = (obj:any) => {
    const objKeys=Object.keys(obj);
    let i = objKeys.length;
    const resArray = [];
    while(i>0) resArray[--i]=[objKeys[i],obj[objKeys[i]]]
    return resArray;
}

export const fromEntries =  (objEntries:any[]) => {
    if (!objEntries || !objEntries[Symbol.iterator]) { throw new Error('Object.fromEntries() requires a single iterable argument'); }
    const obj:any = {};
    for (const [key, value] of objEntries) obj[key] = value;
    return obj;
}

export const todayDateNoTime = (updateDateMs?: number) => {
    const dateMs = getSafeNull(updateDateMs,Date.now());
    const dateObj = new Date(dateMs);
    const month = dateObj.getUTCMonth() + 1; // months from 1-12
    const day = dateObj.getUTCDate();
    const year = dateObj.getUTCFullYear();
    return `${year}-${month}-${day}`;
}

export const fillTimestreamGaps = (timestream: Array<TrendSnapshotInfo>) => {
    for (let i = 0; i < timestream.length - 1; i++) {
        const currentSnapshot = timestream[i];
        const nextSnapshot = timestream[i + 1];
        const currentDate = toDate(currentSnapshot.date);
        const nextDate = toDate(nextSnapshot.date);

        // Calculating the number of days between the current and next snapshot
        const daysGap = daysBetween(currentDate,nextDate);
        // If there is a gap of more than 1 day
        if (daysGap > 1) {
            // Filling the gap with the value of the previous snapshot
            for (let j = 1; j < daysGap; j++) {
                const newSnapshot:TrendSnapshotInfo = {
                    date: new Date(currentDate.getTime() + j * 24 * 60 * 60 * 1000).toISOString(),
                    value: currentSnapshot.value,
                    prices: currentSnapshot.prices
                };
                timestream.splice(i + j, 0, newSnapshot);
            }
        }
    }
    return timestream;
};

export const fillTimestreamGapsWithLastRecord = (result: Array<TrendSnapshotInfo>, nowDate: Date, lastRecord:TrendSnapshotInfo) => {
    result.push(lastRecord);
    const filled = fillTimestreamGaps(result);
    return filled.slice(0, filled.length - 1); // remove last one
}

export const objToArrayKeys = (m:any) => Object.keys(m)

export const cloneObj = (obj:any) => {
    return {...obj}
}

export const arrayToObjectKeys = (a:Array<any>) => Object.assign({}, ...a)

function fromAinBnotInC(b: Array<any>, c: Array<any>) {
    return (a: any) => b.find((x) => a === x) && !c.find((x) => a === x);
}

export const onlyNotBought = (allKnownAssetPrices: Array<any>, allAssetsToBuy: Array<any>, allAssetsToHold: Array<any>) => {
    return allKnownAssetPrices.filter(fromAinBnotInC(allAssetsToBuy, allAssetsToHold))
}

export const updateAssetsOnWallet = (value: TrendSnapshotInfo, buyHoldWallet: WalletSimulator, sliceForEveryAsset: number) => {
    return (buyNowAsset:string) => {
        const assetHistoricalPrice: number = getSafeOrThrow(value.prices[(buyNowAsset)], 'Unable to parse ' + buyNowAsset + ' price on calculating buy&hold')
        buyHoldWallet.addTrade({
            ticker: buyNowAsset,
            price: assetHistoricalPrice,
            createdTimestamp: toDate(value.date).getTime(),
            type: TradeMove.BUY,
            quantity: (sliceForEveryAsset / assetHistoricalPrice)
        })
    };
}

export const updatePricesOnWallet = (value: TrendSnapshotInfo, buyHoldWallet: WalletSimulator) => {
    return (knownAsset: string) => {
        const assetHistoricalPrice: number = getSafeOrThrow(value.prices[(knownAsset)], 'Unable to parse ' + knownAsset + ' price on calculating buy&hold')
        buyHoldWallet.updatePrice(knownAsset, assetHistoricalPrice)
    };
}

export const removeFee = (cost:number, fee:number) => cost - (cost * (fee/100))
export const addFee = (cost:number, fee:number) => cost + (cost * (fee/100))
export const map2Obj = (m:Map<any,any>) => fromEntries(Array.from(m.entries()));

export function removeEmpty(baseObj:any) {
    const obj = getSafeNull(baseObj,{});
    return Object.entries(obj)
        .filter(([_, v]) => (v!==null && v!==undefined))
        .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});
}


export function replacer(key:any, value:any) {
    if(value instanceof Map) {
        return map2Obj(value as Map<any,any>)
    } else {
        return value;
    }
}

export const reviver = (arrMapFields:Array<string>) => (key:any, value:any) => {
    return value;
}

export const toDate = (d:string) => new Date(d);

export const cctxTradeToWalletSimulatorTrade = (trade:CCTXTrade) => {
    const t:Trade =  {
        createdTimestamp: trade.timestamp,
        fee: trade.fee.rate,
        id: trade.id,
        price: trade.price,
        quantity: trade.amount,
        ticker: trade.symbol.split('/')[0],
        type: trade.side==='buy'?TradeMove.BUY:TradeMove.SELL
    }
    return t;
}


// TODO: Basically when a "SELL" order appears without any "BUY" we cant calculate profit there
export function addProfits(trades: Trade[]): Trade[] {

    const mapOfProfitsOrders =  calculateProfitsMadeByOrdersReverse(trades);

    const allCryptoMovements = trades.map((el) => {
        const profitCalculated = mapOfProfitsOrders[el.id];

        if(profitCalculated){
            const x: Trade = {
                ...el,
                profit: profitCalculated,
            };
            return x;
        }

        return el;
    });

    return allCryptoMovements;
}

function calculateProfitsMadeByOrdersReverse(allOrders: Trade[]) {
    const ordersWithProfits:any = {};
    const totals:any = {};

    for (let i = allOrders.length - 1; i >= 0; i--) {
        const order = allOrders[i];

        const volume = order.quantity;
        const valueAt = order.price
        const fees = order.fee
        const notional = volume * valueAt;

        let profit;
        if (order.type===TradeMove.SELL) {
            // If the order is a sell, initialize the running totals for this symbol
            totals[order.ticker] = {
                volume: 0,
                cost: 0,
            };
            // Find the last buy order for this symbol
            for (let j = i - 1; j >= 0; j--) {
                const oldOrder = allOrders[j];
                if (oldOrder.type===TradeMove.BUY && oldOrder.ticker === order.ticker) {
                    const oldVolume = oldOrder.quantity
                    const oldValueAt =oldOrder.price
                    // Update the running totals for this symbol
                    totals[order.ticker].volume += oldVolume;
                    totals[order.ticker].cost += oldVolume * oldValueAt;
                } else if (oldOrder.type===TradeMove.SELL && oldOrder.ticker === order.ticker) {
                    break;
                }
            }
            // Calculate the profit using the running totals for this symbol
            profit =    (notional - totals[order.ticker].cost) +
                (totals[order.ticker].volume - volume) * valueAt;

            ordersWithProfits[order.id]=profit;

        }
    }
    return ordersWithProfits;
}