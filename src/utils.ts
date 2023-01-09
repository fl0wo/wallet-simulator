export const safeGet = function<T, R = any>(object: T | undefined | null,
                                            safeCallback: (object: T) => R,
                                            notSafeCallback: () => R) {
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
    return <NonNullable<T>> value;
    // or return safeGet(value,()=>value,()=>{throw new Error(msg);});
}