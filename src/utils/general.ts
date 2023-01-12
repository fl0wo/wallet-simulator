import {Trade, TradeOptions} from "../models/Trade";

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
    const price = getSafeOrThrow(
        getSafeNull(incTrade.price,priceOfThisAssetToday),
        `cannot create new trade without knowing the price of ${incTrade.ticker}`
    );

    const trade:Trade = {
        ...incTrade,
        price:price,
        createdTimestamp:ts
    }
    return trade;
}