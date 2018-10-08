'use strict';

const constants = require('./constants');

const testModule = 'testModule';
const mockTestContent = 'TEST_CONTENT';
const makeMocks = () => {
    jest.mock('child_process', () => ({
        // exec: mockExec,
    }), constants.VIRTUAL);

    jest.mock(testModule, () => mockTestContent, constants.VIRTUAL);
};

makeMocks();

const testee = require('../../lib/check');

it('should handle the static type property correctly', async () => {
    expect(testee.type).toBe('check');
    testee.type = 'mytype';
    return expect(testee.type).toBe('mytype');
});

it('should initialize with an empty config and handle properties correctly', async () => {

    const testeeInstance = new testee();

    expect(testeeInstance).toMatchObject({
        config: {
            type: constants.DEFAULT_SERVICE_TYPE,
        },
        critical: true,
        traversable: false,
        timeout: constants.DEFAULT_TIMEOUT,
        _status: [ constants.OK ],
        oldStatus: {},
    });

    return expect(testeeInstance.interval).toBe(constants.DEFAULT_INTERVAL);
});

it('should initialize with given config and handle properties correctly', async () => {

    const name = 'mycheck';

    const config = { name, type: 'internal', critical: false, isTraversable: true, timeout: 500, interval: 1000 };
    const testeeInstance = new testee(config);

    expect(testeeInstance).toMatchObject({
        config: Object.assign({
            statusPath: name,
        }, config),
        id: name,
        critical: config.critical,
        traversable: config.isTraversable,
        timeout: config.timeout,
        _status: [ constants.OK ],
        oldStatus: {},
    });

    return expect(testeeInstance.interval).toBe(config.interval);
});

it('should throw an Error when \'start\' abstract method is called', async () => {
    const testeeInstance = new testee();
    return expect(testeeInstance.start()).rejects.toThrow('abstract');
});

it('should handle status correctly', async () => {
});