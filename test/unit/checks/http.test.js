'use strict';
const constants = require('../constants');
// uncomment following when https://github.com/facebook/jest/issues/2549 is solved. 
// const Check = require('../../../lib/check');

const makeMethodMock = mockBody => {
    const handler = jest.fn(() => {
        const promise = mockBody instanceof Error ? Promise.reject(mockBody) : Promise.resolve({ body: mockBody });
        promise.set = jest.fn(() => promise);
        promise.timeout = jest.fn(() => promise);
        return promise;
    });
    return handler;
};


const makeMocks = result => {
    jest.resetModules();
    const mockMethod = makeMethodMock(result);
    jest.mock('superagent', () => ({
        get: mockMethod,
        post: mockMethod,
    }), constants.VIRTUAL);
    return {
        superagent: require('superagent'),
        Testee: require('../../../lib/checks/http'),
        mockMethod,
    };
};

const testStatusChange = async (body, expected) => {
    const { Testee } = makeMocks(body);
    const options = {
        url: 'http://myhost:3000',
        method: 'get',
    };
    const testeeInstance = new Testee(options);
    expect(await testeeInstance.start()).toBe(testeeInstance);
    return expect(testeeInstance.status.status[0]).toEqual(expected);
};

it ('should instantiate the Http check class properly', async () => {
    const { Testee } = makeMocks(['OK']);
    const options = {
        url: 'http://myhost:3000',
    };
    const testeeInstance = new Testee(options);
    // uncomment following when https://github.com/facebook/jest/issues/2549 is solved.
    // expect(testeeInstance).toBeInstanceOf(Check);
    expect(testeeInstance.method).toBe('get');
    return expect(Testee.type).toBe('http');
});

it ('should be called twice when waiting for the timer loop', async () => {
    const { Testee, mockMethod } = makeMocks(['OK']);
    const options = {
        url: 'http://myhost:3000',
        method: 'post',
    };
    jest.useFakeTimers();
    const testeeInstance = new Testee(options);
    expect(testeeInstance.method).toBe('post');
    await testeeInstance.start();
    expect(mockMethod).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(testeeInstance.interval);
    return expect(mockMethod).toHaveBeenCalledTimes(2);
});

it ('should set the status to OK when the http response includes OK',
    () => testStatusChange([ constants.OK ], constants.OK));

it ('should set the status to WARN when the http response includes WARN',
    () => testStatusChange([ constants.WARN ], constants.WARN));

it ('should set the status to CRIT when the http response includes CRIT',
    () => testStatusChange([ constants.CRIT ], constants.CRIT));

it ('should set the status to OK for non-traversable dependency',
    () => testStatusChange('non-traversable', constants.OK));

it ('should set the status to CRIT when the http request throws an error', () => {
    const err = new Error('crash');
    err.response = {
        text: 'crash',
    };
    return testStatusChange(err, constants.CRIT);
});

