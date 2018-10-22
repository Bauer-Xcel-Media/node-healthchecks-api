'use strict';

const EventEmitter = require('events'); 
const constants = require('../constants');
// uncomment following when https://github.com/facebook/jest/issues/2549 is solved. 
// const Check = require('../../../lib/check');

const memoryLeakModuleName = 'memory-leak-module';

const makeMocks = (mockFreememPercentage = 100, mockCpuUsage = 0) => {
    jest.resetModules();
    const mockMemoryLeakModule = new EventEmitter();
    mockMemoryLeakModule.on = function (event, listener) {
        EventEmitter.prototype.on.call(mockMemoryLeakModule, event, listener);
        if (event != 'onCalled') {
            mockMemoryLeakModule.emit('onCalled', event);
        }
        return mockMemoryLeakModule;
    };
    jest.spyOn(mockMemoryLeakModule, 'on');

    const mockFreemem = jest.fn(() => {
        if (mockFreememPercentage instanceof Error) {
            throw mockFreememPercentage;
        }
        return mockFreememPercentage;
    });
    const mockCpu = jest.fn(callback => callback(mockCpuUsage));

    const mockLinkAndRequire = jest.fn(() => mockMemoryLeakModule);

    jest.mock('../../../lib/utils', () => ({
        linkAndRequire: mockLinkAndRequire,
    }), constants.VIRTUAL);

    jest.mock('os-utils', () => ({
        freememPercentage: mockFreemem,
        cpuUsage: mockCpu,
    }), constants.VIRTUAL);

    return {
        Testee: require('../../../lib/checks/self'),
        mockMemoryLeakModule,
        mockLinkAndRequire,
        mockFreemem,
        mockCpu,
    };
};

const testStatusChange = async (expectedStatus, freememPercent, cpuUsage, initialStatus = [ constants.OK ]) => {
    const { Testee } = makeMocks(freememPercent, cpuUsage);
    const testeeInstance = new Testee();
    testeeInstance.status = initialStatus;
    expect(await testeeInstance.start()).toBe(testeeInstance);
    return expect(testeeInstance.status.status[0]).toEqual(expectedStatus);
};

it ('should instantiate the Self check class properly with default options', async () => {
    const { Testee, mockLinkAndRequire } = makeMocks();
    const testeeInstance = new Testee();
    // uncomment following when https://github.com/facebook/jest/issues/2549 is solved.
    // expect(testeeInstance).toBeInstanceOf(Check);
    expect(testeeInstance.config.type).toBe(constants.SERVICE_TYPE_INTERNAL);
    expect(testeeInstance.config.url).toBe('127.0.0.1');
    expect(testeeInstance.config.name).toBe(constants.SELF_CHECK_ID);
    expect(testeeInstance.config.statusPath).toBe(constants.SELF_CHECK_ID);
    expect(testeeInstance.id).toBe(constants.SELF_CHECK_ID);
    expect(testeeInstance.status.status).toEqual([ constants.OK ]);
    expect(testeeInstance.metrics).toEqual(constants.DEFAULT_METRICS_LIMITS);
    expect(testeeInstance.secondsToKeepMemoryLeakMsg).toBe(constants.DEFAULT_SECONDS_TO_KEEP_MEMORY_LEAK_MSG);
    expect(testeeInstance.config.memwatch).toBeFalsy();
    expect(mockLinkAndRequire).not.toHaveBeenCalled();
    return expect(Testee.type).toBe('self');
});

it ('should instantiate the Self check class properly with given options', async () => {
    const { Testee, mockLinkAndRequire } = makeMocks();
    const options = {
        metrics: { 
            cpuUsage: {
                warn: 30,
                crit: 50,
            },
            memoryUsage: {
                warn: 30,
                crit: 50,
            },
        },
        secondsToKeepMemoryLeakMsg: 20,
        memwatch: memoryLeakModuleName,
    };
    const testeeInstance = new Testee(options);
    expect(testeeInstance.config.type).toBe('internal');
    expect(testeeInstance.config.url).toBe('127.0.0.1');
    expect(testeeInstance.config.name).toBe('self-check');
    expect(testeeInstance.config.statusPath).toBe('self-check');
    expect(testeeInstance.status.status).toEqual([ constants.OK ]);
    expect(testeeInstance.metrics).toEqual(options.metrics);
    expect(testeeInstance.secondsToKeepMemoryLeakMsg).toBe(options.secondsToKeepMemoryLeakMsg);
    expect(testeeInstance.config.memwatch).toBe(memoryLeakModuleName);
    expect(mockLinkAndRequire).toHaveBeenCalledTimes(1);
    return expect(Testee.type).toBe('self');
});


it ('should be called twice when waiting for the timer loop', async () => {
    const { Testee, mockFreemem, mockCpu } = makeMocks();
    jest.useFakeTimers();
    const testeeInstance = new Testee();
    await testeeInstance.start();
    expect(mockFreemem).toHaveBeenCalledTimes(1);
    expect(mockCpu).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(testeeInstance.interval);
    expect(mockFreemem).toHaveBeenCalledTimes(2);
    return expect(mockCpu).toHaveBeenCalledTimes(2);
});

it ('should set the status to OK when the memory and cpu usage is fine',
    () => testStatusChange(constants.OK, 0.9, 0.1, [ constants.WARN ]));

it ('should set the status to WARN when the memory usage reaches the WARN limit',
    () => testStatusChange(constants.WARN, (99 - constants.DEFAULT_METRICS_LIMITS.memoryUsage.warn) / 100, 0.1));

it ('should set the status to CRIT when the memory usage reaches the CRIT limit',
    () => testStatusChange(constants.CRIT, (99 - constants.DEFAULT_METRICS_LIMITS.memoryUsage.crit) / 100, 0.1));

it ('should set the status to WARN when the CPU usage reaches the WARN limit',
    () => testStatusChange(constants.WARN, 0.9, (constants.DEFAULT_METRICS_LIMITS.cpuUsage.warn + 1) / 100));

it ('should set the status to CRIT when the CPU usage reaches the CRIT limit',
    () => testStatusChange(constants.CRIT, 0.9, (constants.DEFAULT_METRICS_LIMITS.cpuUsage.crit + 1) / 100));

it ('should set the status to WARN when the memory leak is reported', async () => {
    jest.useFakeTimers();
    const stats = {
        stats: 'the stats',
    };
    const { Testee, mockMemoryLeakModule } = makeMocks();
    const testeeInstance = new Testee({
        memwatch: memoryLeakModuleName,
    });
    testeeInstance.secondsToKeepMemoryLeakMsg = 1;
    testeeInstance.status = [ constants.OK ];
    expect(testeeInstance.status.status[0]).toEqual(constants.OK);
    return await new Promise(resolve => {
        mockMemoryLeakModule.once('onCalled', async event => {
            expect(event).toBe('leak');
            mockMemoryLeakModule.on('leak', async () => {
                expect(testeeInstance.leakStats).toEqual(stats);
                await testeeInstance.start();
                expect(testeeInstance.status.status[0]).toEqual(constants.WARN);

                // now it should get back to 'OK' status after 'secondsToKeepMemoryLeakMsg' seconds.
                jest.advanceTimersByTime(testeeInstance.secondsToKeepMemoryLeakMsg * 1000);
                expect(testeeInstance.leakStats).toBeUndefined();
                await testeeInstance.start();
                resolve(expect(testeeInstance.status.status[0]).toEqual(constants.OK));
            });
            mockMemoryLeakModule.emit('leak', stats);
        });
    });
});

it ('should set the status to CRIT when metrics function throws an Error', async () => {
    const err = new Error('crash');
    const { Testee } = makeMocks(err);
    const testeeInstance = new Testee();
    testeeInstance.status = [ constants.OK ];
    expect(testeeInstance.status.status[0]).toEqual(constants.OK);
    await testeeInstance.start();
    return expect(testeeInstance.status.status[0]).toEqual(constants.CRIT);
});

it ('should set the status to WARN when metrics configuration contains unsupported metric', async () => {
    const { Testee } = makeMocks();
    const options = {
        metrics: { 
            fakeMetric: {
                warn: 30,
                crit: 50,
            },
        },
    };
    const testeeInstance = new Testee(options);
    testeeInstance.status = [ constants.OK ];
    expect(testeeInstance.status.status[0]).toEqual(constants.OK);
    await testeeInstance.start();
    return expect(testeeInstance.status.status[0]).toEqual(constants.WARN);
});