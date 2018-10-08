'use strict';

const EventEmitter = require('events'); 
const constants = require('../constants');
// uncomment following when https://github.com/facebook/jest/issues/2549 is solved. 
// const Check = require('../../../lib/check');

const makeMocks = () => {
    jest.resetModules();
    const mockClient = new EventEmitter();
    const mockCreateClient = jest.fn(options => {
        mockClient.url = options.url;
        mockClient.retry_strategy = options.retry_strategy;
        return mockClient; 
    });
    jest.mock('redis', () => ({
        createClient: mockCreateClient,
    }), constants.VIRTUAL);
    return {
        redis: require('redis'),
        Testee: require('../../../lib/checks/redis'),
        mockClient,
        mockCreateClient,
    };
};

const testStatusChange = async (event, expected, initialStatus) => {
    const { Testee, mockCreateClient, mockClient } = makeMocks();
    const options = {
        url: 'redis',
    };
    const testeeInstance = new Testee(options);
    if (initialStatus) {
        testeeInstance.setStatus(initialStatus, 'status');
    }
    expect(await testeeInstance.start()).toBe(testeeInstance);
    if (typeof event === 'string') {
        mockClient.emit(event);
    }
    expect(mockCreateClient).toHaveBeenCalledWith(expect.any(Object));
    expect(mockCreateClient).toHaveBeenCalledTimes(1);
    return expect(testeeInstance.status.status[0]).toEqual(expected);
};

it ('should instantiate the Redis check class properly', async () => {
    const { Testee } = makeMocks();
    const options = {
        url: 'redis',
    };
    // change and uncomment following 3 lines when https://github.com/facebook/jest/issues/2549 is solved.
    new Testee(options);
    // const testeeInstance = new Testee(options);
    // expect(testeeInstance).toBeInstanceOf(Check);
    return expect(Testee.type).toBe('redis');
});

it ('should instantiate Redis client with proper \'url\' and \'retry_strategy\' function', async () => {
    const { Testee, mockClient } = makeMocks();
    const options = {
        url: 'redis',
    };
    const testeeInstance = new Testee(options);
    expect(await testeeInstance.start()).toBe(testeeInstance);
    expect(mockClient.url).toBe(options.url);
    const error = new Error('test');
    const interval = mockClient.retry_strategy({
        error,
    });
    expect(interval).toBe(testeeInstance.interval);
    return expect(testeeInstance.error).toBe(error);
});

it ('should set the status to OK when initialized', () => testStatusChange(undefined, constants.WARN));
it ('should set the status to CRIT when Redis client emits the \'error\' event',
    () => testStatusChange('error', constants.CRIT));
it ('should set the status to CRIT when Redis client emits the \'end\' event',
    () => testStatusChange('end', constants.CRIT));

it ('should set the status to OK when Redis client emits the \'ready\' event',
    () => testStatusChange('ready', constants.OK, constants.CRIT));

it ('should set the status to OK when Redis client emits the \'ready\' event',
    () => testStatusChange('connect', constants.WARN, constants.CRIT));

it ('should set the status to OK when Redis client emits the \'ready\' event',
    () => testStatusChange('reconnecting', constants.WARN, constants.CRIT));

