'use strict';

const status = require('http-status');
const os = require('os');
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
    const host = 'localhost';
    const packageJson = {
        author: 'John Doe',
    };
    const config = {
        name: 'config_name',
        host,
        description: 'config_description',
        projectHome: 'config_projectHome',
        projectRepo: 'config_projectRepo',
        logsLinks: [ 'some-link-1', 'some-link-2'],
        statsLinks: [ 'some-link-3', 'some-link-4'],
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
            host,
            version: constants.DEFAULT_SERVICE_VERSION,
            owners: [ packageJson.author ],
            logsLinks: config.logsLinks,
            statsLinks: config.statsLinks,
        }),
    });
});

it('should return a proper response when providing package.json data', async () => {
    const host = 'localhost';
    const packageJson = {
        author: { name: 'John Doe', email: 'john.doe@mydomain.com' },
        contributors: [
            'John Smith <john.smith@mydomain.com>',
            { name: 'Mary Smith', email: 'mary.smith@mydomain.com' }
        ],
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
            host: os.hostname(),
            version: constants.DEFAULT_SERVICE_VERSION,
            owners: [
                `${packageJson.author.name} <${packageJson.author.email}>`,
                packageJson.contributors[0],
                `${packageJson.contributors[1].name} <${packageJson.contributors[1].email}>`,
            ],
            projectHome: packageJson.homepage,
            projectRepo: packageJson.repository.url,
        }),
    });
});
