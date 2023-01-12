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

export const addTimeStampIfNotDefined = (incTrade: TradeOptions): Trade => {
    const ts = getSafeNull(incTrade.createdTimestamp,Date.now())
    const trade:Trade = {
        ...incTrade,
        createdTimestamp:ts
    }
    return trade;
}