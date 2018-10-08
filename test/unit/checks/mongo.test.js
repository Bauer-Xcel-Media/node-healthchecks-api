'use strict';

const EventEmitter = require('events'); 
const constants = require('../constants');
// uncomment following when https://github.com/facebook/jest/issues/2549 is solved. 
// const Check = require('../../../lib/check');

const makeMocks = (db = {
    topology: new EventEmitter(),
    close: jest.fn(),
}) => {
    jest.resetModules();
    const mockConnect = jest.fn((url, options, callback) => {
        if (db instanceof Error) {
            callback(db);
        } else {
            callback(undefined, db);
        }
    });
    jest.mock('mongodb', () => ({
        MongoClient: {
            connect: mockConnect,
        },
    }), constants.VIRTUAL);
    return {
        mongodb: require('mongodb'),
        Testee: require('../../../lib/checks/mongo'),
        db,
        mockConnect,
    };
};

const testStatusChange = async (event, expected, connectCallTimes = 1, initialStatus) => {
    const { Testee, db, mockConnect } = makeMocks(event instanceof Error ? event : undefined);
    const options = {
        url: 'mongo',
    };
    const testeeInstance = new Testee(options);
    if (initialStatus) {
        testeeInstance.setStatus(initialStatus, 'status');
    }
    expect(await testeeInstance.start()).toBe(testeeInstance);
    if (typeof event === 'string') {
        db.topology.emit(event);
    }
    expect(mockConnect).toHaveBeenCalledWith(options.url, expect.any(Object), expect.any(Function));
    expect(mockConnect).toHaveBeenCalledTimes(connectCallTimes);
    return expect(testeeInstance.status.status[0]).toEqual(expected);
};

it ('should instantiate the Mongo check class properly', async () => {
    const { Testee } = makeMocks();
    const options = {
        url: 'mongo',
    };
    new Testee(options);
    // uncomment following when https://github.com/facebook/jest/issues/2549 is solved.
    // expect(testeeInstance).toBeInstanceOf(Check);
    return expect(Testee.type).toBe('mongo');
});

it ('should set the status to OK, when mongodb topology is fine',
    () => testStatusChange(undefined, constants.OK, 1));

it ('should set the status to CRIT, when mongodb topology emits the \'error\' event',
    () => testStatusChange('error', constants.CRIT, 1));

it ('should set the status to OK, when mongodb topology emits the \'close\' event and restarts',
    () => testStatusChange('close', constants.OK, 2));

it ('should set the status to OK, when mongodb topology emits the \'reconnect\' event',
    () => testStatusChange('reconnect', constants.OK, 1, constants.CRIT));

it ('should set the status to CRIT, when \'MongoClient.connect\' throws an Error',
    () => testStatusChange(new Error('error'), constants.CRIT, 1));


