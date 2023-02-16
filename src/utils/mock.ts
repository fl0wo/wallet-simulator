/**
 * @param {Date} expected The date to which we want to freeze time
 * @returns {Function} Call to remove Date mocking
 */
import * as ccxt from 'ccxt';

export const mockDate = (expected: Date) => {
    const _Date = Date;

    // If any Date or number is passed to the constructor
    // use that instead of our mocked date
    function MockDate(mockOverride?: Date | number) {
        return new _Date(mockOverride || expected);
    }

    MockDate.UTC = _Date.UTC;
    MockDate.parse = _Date.parse;
    MockDate.now = () => expected.getTime();
    // Give our mock Date has the same prototype as Date
    // Some libraries rely on this to identify Date objects
    MockDate.prototype = _Date.prototype;

    // Our mock is not a full implementation of Date
    // Types will not match, but it's good enough for our tests
    // @ts-ignore
    global.Date = MockDate as any;

    // Callback function to remove the Date mock
    return () => {
        // @ts-ignore
        global.Date = _Date;
    };
};

export const daysBefore = (d:Date, beforeDays:number) =>
    new Date(d.getTime() - (beforeDays * 24 * 60 * 60 * 1000));

export const daysBetween = (currentDate:Date,nextDate:Date)=>
    Math.round((nextDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));

export const mockCCTXMethodReturn = (methodName: string, returnResult: any,exchange:string='binance') => {
    // @ts-ignore
    const ExchangeClass = ccxt[exchange];
    // Save a reference to the original method.
    const originalMethod = ExchangeClass.prototype[methodName];

    // Override the method with a Jest mock function.
    ExchangeClass.prototype[methodName] = jest.fn(() => {
        console.log(`mocked function called: ${methodName}`)
        return returnResult
    });

    // Create a cleanup function to restore the original method.
    const cleanup = () => {
        ExchangeClass.prototype[methodName] = originalMethod;
    };

    // Return the cleanup function in case you want to restore the original method later.
    return cleanup;
};

export const mockCCTXField = (fieldName: string, mockValue: any,exchange:string='binance') => {
    // @ts-ignore
    const ExchangeClass = ccxt[exchange];
    // Save a reference to the original value of the field.
    const originalValue = ExchangeClass.prototype[fieldName];

    // Set the value of the field to the mock value.
    ExchangeClass.prototype[fieldName] = mockValue;

    // Create a cleanup function to restore the original value.
    const cleanup = () => {
        ExchangeClass.prototype[fieldName] = originalValue;
    };

    // Return the cleanup function in case you want to restore the original value later.
    return cleanup;
};

export const mockCCTXMethod = (methodName: string, mockImplementation: (args: any[]) => any,exchange:string='binance') => {
    // @ts-ignore
    const ExchangeClass = ccxt[exchange];

    // Save a reference to the original method.
    const originalMethod = ExchangeClass.prototype[methodName];

    // Create a Jest mock function that calls the mock implementation with the input parameters.
    const mockFn = jest.fn((...args) => mockImplementation(args));

    // Override the method with the Jest mock function.
    ExchangeClass.prototype[methodName] = mockFn;

    // Create a cleanup function to restore the original method.
    const cleanup = () => {
        ExchangeClass.prototype[methodName] = originalMethod;
    };

    // Return the cleanup function in case you want to restore the original method later.
    return cleanup;
};

