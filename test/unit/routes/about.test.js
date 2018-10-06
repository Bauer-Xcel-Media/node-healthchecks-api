'use strict';

const status = require('http-status');
const constants = require('../constants');
const testee = require('../../../lib/routes/about');

const check1 = {
    config: {
        type: 'check1',
    },
    status: {
        status: [
            'OK'
        ],
    },
};
const check2 = {
    config: {
        type: 'check2',
    },
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

it('should return a proper response when providing config data', async () => {
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
            check2
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
            host: `http://${host}`,
            version: constants.DEFAULT_SERVICE_VERSION,
            owners: [ packageJson.author ],
        }),
    });
});

it('should return a proper response when providing package.json data', async () => {
    const host = 'localhost:9000';
    const packageJson = {
        author: { name: 'John Doe', email: 'john.doe@mydomain.com' },
        name: 'config_name',
        description: 'config_description',
        homepage: 'config_projectHome',
        repository: { 
            url: 'config_projectRepo'
        },
    };
    const config = {
    };
    return expect(testee({ host }, {
        config,
        packageJson,
        checks: [
            check1,
            check2
        ],
    })).resolves.toEqual({
        status: status.OK,
        contentType: constants.MIME_APPLICATION_JSON,
        headers: constants.DEFAULT_RESPONSE_HEADERS,
        body: Object.assign({ 
            dependencies: [ check1.status, check2.status ],
        }, {
            name: packageJson.name,
            description: packageJson.description,
            id: packageJson.name,
            protocol: 'http',
            host: `http://${host}`,
            version: constants.DEFAULT_SERVICE_VERSION,
            owners: [ `${packageJson.author.name} <${packageJson.author.email}>` ],
            projectHome: packageJson.homepage,
            projectRepo: packageJson.repository.url,
        }),
    });
});

// it('should return a proper response with a type parameter', async () => {
//     return expect(testee({ type: 'check1' }, {
//         checks: [
//             check1,
//             check2
//         ],
//     })).resolves.toEqual({
//         status: status.OK,
//         contentType: constants.MIME_APPLICATION_JSON,
//         headers: constants.DEFAULT_RESPONSE_HEADERS,
//         body: check1.status.status,
//     });
// });