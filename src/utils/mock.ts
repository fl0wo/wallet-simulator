/**
 * @param {Date} expected The date to which we want to freeze time
 * @returns {Function} Call to remove Date mocking
 */
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
