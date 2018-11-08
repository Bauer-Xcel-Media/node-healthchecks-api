'use strict';

const constants = require('../constants');
// uncomment following when https://github.com/facebook/jest/issues/2549 is solved. 
// const Check = require('../../../lib/check');

const makeMocks = err => {
    jest.resetModules();
    const mockPing = jest.fn(callback => callback(err));
    const mockEnd = jest.fn();
    const mockCreateConnection = jest.fn(() => ({
        ping: mockPing,
        end: mockEnd,
    }));
    jest.mock('mysql', () => ({
        createConnection: mockCreateConnection,
    }), constants.VIRTUAL);
    return {
        mysql: require('mysql'),
        Testee: require('../../../lib/checks/mysql'),
        mockCreateConnection,
        mockPing,
        mockEnd,
    };
};

const testStatusChange = async (error, expected, callTimes = 1, initialStatus, emulateTimer) => {
    const { Testee, mockCreateConnection, mockPing, mockEnd } = makeMocks(error);
    const url = 'mysql-url';
    const user = 'mysql-user';
    const password = 'mysql-password';
    const database = 'mysql-database';

    const config = {
        url,
        user,
        password,
        database,
    };

    const mysqlOptions = {
        host: url,
        user,
        password,
        database,
    };

    const testeeInstance = new Testee(config);
    if (initialStatus) {
        testeeInstance.setStatus(initialStatus, 'status');
    }
    expect(await testeeInstance.start()).toBe(testeeInstance);

    if (emulateTimer) {
        jest.advanceTimersByTime(testeeInstance.interval);
    }

    expect(mockCreateConnection).toHaveBeenCalledTimes(callTimes);
    expect(mockCreateConnection).toHaveBeenCalledWith(mysqlOptions);
    expect(mockPing).toHaveBeenCalledTimes(callTimes);
    expect(mockPing).toHaveBeenCalledWith(expect.any(Function));
    expect(mockEnd).toHaveBeenCalledTimes(callTimes);
    return expect(testeeInstance.status.status[0]).toEqual(expected);
};

it ('should instantiate the Mysql check class properly', async () => {
    const { Testee } = makeMocks();
    const options = {
        url: 'mysql',
    };
    new Testee(options);
    // uncomment following when https://github.com/facebook/jest/issues/2549 is solved.
    // expect(testeeInstance).toBeInstanceOf(Check);
    return expect(Testee.type).toBe('mysql');
});

it ('should set the status to OK, when mysql connection is established and ping works',
    () => testStatusChange(undefined, constants.OK, 1, constants.CRIT));

it ('should set the status to CRIT, when mysql ping calls nack with an error ',
    () => testStatusChange(new Error('TEST_ERROR'), constants.CRIT, 1, constants.OK));

it ('`createConnection` and `ping` should be called twice when waiting for the timer loop', async () => {
    jest.useFakeTimers();
    return testStatusChange(undefined, constants.OK, 2, constants.CRIT, true);
});

