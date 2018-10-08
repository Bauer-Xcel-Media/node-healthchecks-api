'use strict';
const constants = require('../constants');
// uncomment following when https://github.com/facebook/jest/issues/2549 is solved. 
// const Check = require('../../../lib/check');

const makeMocks = (mockHealth = jest.fn()) => {
    jest.resetModules();
    jest.mock('elasticsearch', () => ({
        Client: class Client {
            constructor(options) {
                this.options = options;
                this.cluster = {
                    health: mockHealth,
                };
            }
        },
    }), constants.VIRTUAL);
    return {
        elasticsearch: require('elasticsearch'),
        Testee: require('../../../lib/checks/elasticsearch'),
        mockHealth,
    };
};

const testStatusChange = async (status, expected) => {
    const { Testee } = makeMocks(jest.fn(() => ({ status })));
    const options = {
        url: 'es://9200',
    };
    const testeeInstance = new Testee(options);
    expect(await testeeInstance.start()).toBe(testeeInstance);
    return expect(testeeInstance.status.status[0]).toEqual(expected);
};

it ('should instantiate the Elasticsearch check class properly', async () => {
    const { Testee, elasticsearch } = makeMocks();
    const options = {
        url: 'es://9200',
    };
    const testeeInstance = new Testee(options);
    // uncomment following when https://github.com/facebook/jest/issues/2549 is solved.
    // expect(testeeInstance).toBeInstanceOf(Check);
    expect(testeeInstance.client).toBeInstanceOf(elasticsearch.Client);
    expect(testeeInstance.client.options).toBeDefined();
    expect(testeeInstance.client.options.host).toBe(options.url);
    return expect(Testee.type).toBe('elasticsearch');
});

it ('should be called twice when waiting for the timer loop', async () => {
    const { Testee, mockHealth } = makeMocks();
    const options = {
        url: 'es://9200',
    };
    jest.useFakeTimers();
    const testeeInstance = new Testee(options);
    await testeeInstance.start();
    expect(mockHealth).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(testeeInstance.interval);
    return expect(mockHealth).toHaveBeenCalledTimes(2);
});

it ('should set the status to OK, when elasticsearch cluster health is GREEN',
    () => testStatusChange('green', constants.OK));

it ('should set the status to WARN, when elasticsearch cluster health is YELLOW',
    () => testStatusChange('yellow', constants.WARN));

it ('should set the status to CRIT, when elasticsearch cluster health is RED',
    () => testStatusChange('red', constants.CRIT));

