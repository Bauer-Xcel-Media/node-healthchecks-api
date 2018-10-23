'use strict';

const status = require('http-status');
const os = require('os');
const nock = require('nock');
const constants = require('../constants');
const testee = require('../../../lib/routes/traverse');

const check1 = {
    config: {
        name: 'check1',
        type: 'http',
        url: 'http://check1',
    },
    id: 'check1',
    traversable: true,
    status: {
        status: [
            'OK'
        ],
    },
};
const check2 = {
    config: {
        name: 'check2',
        type: 'http',
        url: 'http://check2',
    },
    id: 'check2',
    status: {
        status: [
            'WARN',
            'description',
            {
                details: 'details',
            }
        ],
    },
};

it('should return a proper response traversing by check1 to check2 service', async () => {
    nock('http://check1')
        .get('/status/traverse?dependencies=check2')
        .reply(200, check2.status.status);
    return expect(testee({ dependencies: 'check1,check2' }, {
        checks: [
            check1,
            check2,
        ],
    })).resolves.toEqual({
        status: status.OK,
        contentType: constants.MIME_APPLICATION_JSON,
        headers: constants.DEFAULT_RESPONSE_HEADERS,
        body: check2.status.status,
    });
});

it('should return a proper response when dependency is not traversable', async () => {
    return expect(testee({ dependencies: 'check2' }, {
        checks: [
            check1,
            check2,
        ],
    })).resolves.toEqual({
        status: status.OK,
        contentType: constants.MIME_APPLICATION_JSON,
        headers: constants.DEFAULT_RESPONSE_HEADERS,
        body: [
            constants.CRIT,
            {
                description: constants.MSG_CANT_TRAVERSE,
                result: constants.CRIT,
                details: `${check2.config.name} ${constants.MSG_IS_NOT_TRAVERSEABLE}`,
            }
        ],
    });
});

it('should return a proper response when dependency has not been found', async () => {
    return expect(testee({ dependencies: 'fake' }, {
        checks: [
            check1,
            check2,
        ],
    })).resolves.toEqual({
        status: status.OK,
        contentType: constants.MIME_APPLICATION_JSON,
        headers: constants.DEFAULT_RESPONSE_HEADERS,
        body: [
            constants.CRIT,
            {
                description: constants.MSG_CANT_TRAVERSE,
                result: constants.CRIT,
                details: 'Status path \'fake\' is not registered',
            }
        ],
    });
});

it('should return an \'about\' response when request paramete \'dependency\' is not provided', async () => {
    const host = 'localhost:9000';
    const packageJson = {
        author: 'John Doe',
    };
    const config = {
        name: 'config_name',
        description: 'config_description',
        projectHome: 'config_projectHome',
        projectRepo: 'config_projectRepo',
    };
    return expect(testee({ host }, {
        config,
        packageJson,
        checks: [
            check1,
            check2,
        ],
    })).resolves.toEqual({
        status: status.OK,
        contentType: constants.MIME_APPLICATION_JSON,
        headers: constants.DEFAULT_RESPONSE_HEADERS,
        body: Object.assign({ 
            dependencies: [ check1.status, check2.status ],
        }, config, {
            id: config.name,
            protocol: 'http',
            host: os.hostname(),
            version: constants.DEFAULT_SERVICE_VERSION,
            owners: [ packageJson.author ],
        }),
    });
});

it('should return a proper response when dependency http connection fails', async () => {
    const err = new Error('bad thing happenned');
    nock('http://check1')
        .get('/status/traverse?dependencies=check2')
        .replyWithError(err);
    return expect(testee({ dependencies: 'check1,check2' }, {
        checks: [
            check1,
            check2,
        ],
    })).resolves.toEqual({
        status: status.OK,
        contentType: constants.MIME_APPLICATION_JSON,
        headers: constants.DEFAULT_RESPONSE_HEADERS,
        body: err.text || [ constants.CRIT, {
            description: err.message,
            result: constants.CRIT,
            details: err,
        }]
    });
});
