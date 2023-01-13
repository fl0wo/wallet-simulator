import {Trade, TradeOptions} from "../models/Trade";
import {TrendBalanceInfo} from "../models/ExtractWalletInformation";
import {daysBetween} from "./mock";

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

    return {
        ...incTrade,
        price: priceNew,
        createdTimestamp: ts
    };
}

export const entries = (obj:any) => {
    const objKeys=Object.keys(obj);
    let i = objKeys.length;
    const resArray = [];
    while(i>0) resArray[--i]=[objKeys[i],obj[objKeys[i]]]
    return resArray;
}

export const todayDateNoTime = (updateDateMs?: number) => {
    const dateMs = getSafeNull(updateDateMs,Date.now());
    const dateObj = new Date(dateMs);
    const month = dateObj.getUTCMonth() + 1; // months from 1-12
    const day = dateObj.getUTCDate();
    const year = dateObj.getUTCFullYear();
    return `${year}-${month}-${day}`;
}

export const fillTimestreamGaps = (timestream: Array<TrendBalanceInfo>) => {
    for (let i = 0; i < timestream.length - 1; i++) {
        const currentSnapshot = timestream[i];
        const nextSnapshot = timestream[i + 1];
        const currentDate = currentSnapshot.date;
        const nextDate = nextSnapshot.date;

        // Calculating the number of days between the current and next snapshot
        const daysGap = daysBetween(currentDate,nextDate);
        // If there is a gap of more than 1 day
        if (daysGap > 1) {
            // Filling the gap with the value of the previous snapshot
            for (let j = 1; j < daysGap; j++) {
                const newSnapshot = {
                    date: new Date(currentDate.getTime() + j * 24 * 60 * 60 * 1000),
                    value: currentSnapshot.value
                };
                timestream.splice(i + j, 0, newSnapshot);
            }
        }
    }
    return timestream;
};

