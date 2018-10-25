'use strict';

const path = require('path');
const packageJson = require('../../package.json');
const constants = require('./constants');
const Check = require('../../lib/check');

const PATH_CHECKS = path.join(constants.CWD, '/lib/checks');
const PATH_CHECKS_MYCHECK = path.join(PATH_CHECKS, 'mycheck');
const PATH_CHECKS_WRONG_CHECK = path.join(PATH_CHECKS, 'wrongcheck');

const PATH_ADAPTERS = path.join(constants.CWD, '/lib/adapters');
const PATH_ADAPTERS_MYADAPTER = path.join(PATH_ADAPTERS, 'myadapter');
const PATH_ADAPTERS_DEFAULT_ADAPTER = path.join(PATH_ADAPTERS, constants.DEFAULT_ADAPTER);

const PATH_ROUTES = path.join(constants.CWD, '/lib/routes');
const PATH_ROUTES_MYROUTE = path.join(PATH_ROUTES, 'myroute');
const PATH_ROUTES_MYROUTE2 = path.join(PATH_ROUTES, 'myroute2');
const PATH_ROUTES_MYROUTE3 = path.join(PATH_ROUTES, 'myroute3');
const PATH_ROUTES_MYROUTE4 = path.join(PATH_ROUTES, 'myroute4');
const PATH_ROUTES_MYROUTE5 = path.join(PATH_ROUTES, 'myroute5');

const MOCK_CHECK_CONFIG = {
    name: 'mycheck',
    check: 'mycheck',
    type: 'internal',
};

const MOCK_CONFIG = {
    version: 3,
    checks: [ MOCK_CHECK_CONFIG ],
};

const mockPathToContent = {
    [PATH_CHECKS]: ['mycheck', 'wrongcheck'],
    [PATH_ADAPTERS]: ['myadapter', 'express'],
    // route sorter should push the parametrized routes at the end
    [PATH_ROUTES]: ['myroute5', 'myroute2', 'myroute', 'myroute4', 'myroute3'],
};

const mockAdapter = jest.fn();
const mockMyRoute = jest.fn();
const mockMyRoute2 = jest.fn();
mockMyRoute2.path = '/:myparam';
const mockMyRoute3 = jest.fn();
const mockMyRoute4 = jest.fn();
mockMyRoute4.path = '/:myparam2';
const mockMyRoute5 = jest.fn();
const mockServer = jest.fn();

const mockLinkAndRequireResult = {
    result: mockAdapter,
};

const mockLinkAndRequire = jest.fn(() => mockLinkAndRequireResult.result);

const createCheckClass = (state, type) => {
    const _mock = {
        construct: jest.fn((target, args) => new target(...args)),
    };

    const result = class extends Check {
        start() {
            this[state]();
        }
    };

    if (type) {
        result.type = type;
    }

    _mock.on = jest.spyOn(result.prototype, 'on');
    _mock.start = jest.spyOn(result.prototype, 'start');

    _mock.clear = function() {
        this.construct.mockClear();
        this.on.mockClear();
        this.start.mockClear();
    }.bind(_mock);

    // Using Proxy for spying the constructor calls.
    const proxy = new Proxy(result, { construct: _mock.construct });
    proxy.mock = _mock;
    return proxy;
};

class mockMyCheckClass extends createCheckClass('crit', 'mycheck') {}
class mockMyCheckClass2 extends createCheckClass('ok') {}
class mockMyCheckClass3 extends createCheckClass('warn') {}
class mockMyCheckClass4 extends createCheckClass('crit') {}
class mockMyCheckClass5 extends createCheckClass('ok') {}
class mockMyCheckClass6 extends createCheckClass('crit') {}


let mockConfig = MOCK_CONFIG;

const mockYamlConfig = () => {
    jest.mock('js-yaml', () => ({
        safeLoad: jest.fn(() => mockConfig),
    }), constants.VIRTUAL);
};

const mockModules = () => {
    mockYamlConfig();

    jest.mock(PATH_ADAPTERS_MYADAPTER, () => mockAdapter, constants.VIRTUAL);
    jest.mock(PATH_ADAPTERS_DEFAULT_ADAPTER, () => mockAdapter, constants.VIRTUAL);
    jest.mock(PATH_CHECKS_MYCHECK, () => mockMyCheckClass, constants.VIRTUAL);
    jest.mock(PATH_CHECKS_WRONG_CHECK, () => ({}), constants.VIRTUAL);
    jest.mock(PATH_ROUTES_MYROUTE, () => mockMyRoute, constants.VIRTUAL);
    jest.mock(PATH_ROUTES_MYROUTE2, () => mockMyRoute2, constants.VIRTUAL);
    jest.mock(PATH_ROUTES_MYROUTE3, () => mockMyRoute3, constants.VIRTUAL);
    jest.mock(PATH_ROUTES_MYROUTE4, () => mockMyRoute4, constants.VIRTUAL);
    jest.mock(PATH_ROUTES_MYROUTE5, () => mockMyRoute5, constants.VIRTUAL);
    jest.mock('fs', () => {
        return {
            readdir: (pathname, callback) => {
                callback (null, mockPathToContent[pathname]);
            },
            readFile: (pathname, callback) => callback(null, mockPathToContent[pathname]),
            existsSync: pathname => pathname !== 'does-not-exist',
        };
    }, constants.VIRTUAL );

    jest.mock('../../lib/utils', () => ({ linkAndRequire: mockLinkAndRequire }), constants.VIRTUAL);
};

mockModules();

const initializationExpectations = () => {
    expect(mockAdapter).toHaveBeenNthCalledWith(1, 
        expect.objectContaining({ packageJson }), mockServer, { handler: mockMyRoute, path: '/myroute' } );
    expect(mockAdapter).toHaveBeenNthCalledWith(2, 
        expect.objectContaining({ packageJson }), mockServer, { handler: mockMyRoute3, path: '/myroute3' } );
    expect(mockAdapter).toHaveBeenNthCalledWith(3, 
        expect.objectContaining({ packageJson }), mockServer, { handler: mockMyRoute5, path: '/myroute5' } );
    expect(mockAdapter).toHaveBeenNthCalledWith(4, 
        expect.objectContaining({ packageJson }), mockServer, { handler: mockMyRoute2, path: '/:myparam' } );
    expect(mockAdapter).toHaveBeenNthCalledWith(5, 
        expect.objectContaining({ packageJson }), mockServer, { handler: mockMyRoute4, path: '/:myparam2' } );
    checkClassExpectations(mockMyCheckClass, MOCK_CHECK_CONFIG);
};

const checkClassExpectations = (checkClass, checkConfig) => {
    // checking the constructor proxy trap.
    expect(checkClass.mock.construct).toHaveBeenNthCalledWith(1, expect.any(Function), [ checkConfig ], checkClass);
    expect(checkClass.mock.on).toHaveBeenNthCalledWith(1, 'statusChanged', expect.any(Function));
    expect(checkClass.mock.start).toHaveBeenCalledTimes(1);
};

const testee = require('../../lib/health-check');

beforeEach(async () => {
    mockAdapter.mockClear();
    mockMyCheckClass.mock.clear();
    mockMyCheckClass2.mock.clear();
    mockMyCheckClass3.mock.clear();
    mockMyCheckClass4.mock.clear();
    mockMyCheckClass5.mock.clear();
    mockMyCheckClass6.mock.clear();
    jest.clearAllMocks();
});

describe('Initialization', async () => {

    it ('should initialize properly with the default adapter', async () => {
        await testee(mockServer);
        initializationExpectations();
    });

    it ('should initialize properly with a supported adapter', async () => {
        await testee(mockServer, { adapter: 'myadapter' });
        initializationExpectations();
    });

    it ('should initialize with linked and required adapter', async () => {
        mockLinkAndRequireResult.result = mockAdapter;
        await testee(mockServer, { adapter: 'npm-fake' });
        initializationExpectations();
    });

    it ('should initialize with an adapter given as a function', async () => {
        await testee(mockServer, { adapter: mockAdapter });
        initializationExpectations();
    });

    it ('should set empty checks array on the service when config is given without checks array declared', async () => {
        const service = {
            packageJson,
            config: {},
        };
        await testee(mockServer, { 
            adapter: mockAdapter,
            service,
        });
        return expect(service.checks).toEqual([]);
    });

    it ('should fail when wrong adapter type is provided', 
        async () => expect(testee(mockServer, { adapter: 1 })).rejects.toThrow('adapter=1'));

    it ('should fail when not existing config path is provided', async () => expect(testee(mockServer,
        { service: { configPath: 'does-not-exist' }})).rejects.toThrow('does-not-exist'));

    it ('should fail when config with unsupported check is provided', async () => expect(testee(mockServer, 
        {
            adapter: mockAdapter,
            service: {
                packageJson,
                config: {
                    checks: [
                        {
                            name: 'fake',
                            check: 'fake',
                            type: 'internal',
                        }
                    ]
                }
            },
        })).rejects.toThrow('not supported'));
    it ('should fail when config with wrong check class is provided', async () => expect(testee(mockServer, 
        {
            adapter: mockAdapter,
            service: {
                packageJson,
                config: {
                    checks: [
                        {
                            name: 'wrongcheck',
                            check: 'wrongcheck',
                            type: 'internal',
                        }
                    ]
                }
            },
        })).rejects.toThrow('not an instance'));
});

describe('addChecks method', async () => {

    it ('should define a single check class given expicitly', async () => {
        const checks = await testee.addChecks(mockMyCheckClass2);
        expect(Object.keys(checks).length).toBe(1);
    });

    it ('should define a 2 checks from an array of check classes', async () => {
        const checks = await testee.addChecks([ mockMyCheckClass2, mockMyCheckClass3 ]);
        expect(Object.keys(checks).length).toBe(2);
        expect(mockMyCheckClass2.type).toBe('mockmycheckclass2');
        expect(mockMyCheckClass3.type).toBe('mockmycheckclass3');
    });

    it ('should define check classes from a linked and required module exporting map of check classes', async () => {
        mockLinkAndRequireResult.result = {
            mycheck2: mockMyCheckClass2,
            mycheck3: mockMyCheckClass3,
        };
        const checks = await testee.addChecks('npm-fake');
        expect(Object.keys(checks).length).toBe(2);
        expect(mockMyCheckClass2.type).toBe('mycheck2');
        expect(mockMyCheckClass3.type).toBe('mycheck3');
    });

    it ('should fail when wrong check type is provided', async () => expect(testee.addChecks(1)).rejects.toThrow('1'));
});

describe('check sorter test', async () => {

    it ('should sort check instances properly according to their state', async () => {

        mockConfig = {
            version: 3,
            checks: [
                {
                    name: 'mycheck',
                    check: 'mycheck',
                    type: 'internal',
                },
                {
                    name: 'mycheck2',
                    check: 'mycheck2',
                    type: 'internal',
                },
                {
                    name: 'mycheck3',
                    check: 'mycheck3',
                    type: 'internal',
                },
                {
                    name: 'mycheck4',
                    check: 'mycheck4',
                    type: 'internal',
                },
                {
                    name: 'mycheck5',
                    check: 'mycheck5',
                    type: 'internal',
                },
                {
                    name: 'mycheck6',
                    check: 'mycheck6',
                    type: 'internal',
                    critical: false,
                },
            ]
        };
        const service = { packageJson };
        await testee.addChecks({
            mycheck2: mockMyCheckClass2,
            mycheck3: mockMyCheckClass3,
            mycheck4: mockMyCheckClass4,
            mycheck5: mockMyCheckClass5,
            mycheck6: mockMyCheckClass6,
        });
        await testee(mockServer, { service });

        checkClassExpectations(mockMyCheckClass, mockConfig.checks[0]);
        checkClassExpectations(mockMyCheckClass2, mockConfig.checks[1]);
        checkClassExpectations(mockMyCheckClass3, mockConfig.checks[2]);
        checkClassExpectations(mockMyCheckClass4, mockConfig.checks[3]);
        checkClassExpectations(mockMyCheckClass5, mockConfig.checks[4]);
        checkClassExpectations(mockMyCheckClass6, mockConfig.checks[5]);
        
        expect(service.checks).toBeDefined();
        expect(service.checks.length).toBe(6);
        expect(service.checks[0].status.status[0]).toBe(constants.CRIT);
        expect(service.checks[1].status.status[0]).toBe(constants.OK);
        expect(service.checks[2].status.status[0]).toBe(constants.WARN);
        expect(service.checks[3].status.status[0]).toBe(constants.CRIT);
        expect(service.checks[4].status.status[0]).toBe(constants.OK);
        expect(service.checks[5].status.status[0]).toBe(constants.WARN);

        // state change should trigger sorting
        service.checks[3].crit('Test', 'Test');
        expect(service.checks[0].status.status[0]).toBe(constants.CRIT);
        expect(service.checks[1].status.status[0]).toBe(constants.CRIT);
        expect(service.checks[2].status.status[0]).toBe(constants.WARN);
        expect(service.checks[3].status.status[0]).toBe(constants.WARN);
        expect(service.checks[4].status.status[0]).toBe(constants.OK);
        expect(service.checks[5].status.status[0]).toBe(constants.OK);
    });
});
