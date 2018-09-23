'use strict';

const status = require('http-status');
const constants = require('../constants');

module.exports = async (params, service) => {
    for (let i=0; i < service.checks.length; i++) {
        let check = service.checks[i];
        if (check.id === params.dependency) {
            return {
                status: status.OK,
                contentType: constants.MIME_APPLICATION_JSON,
                headers: constants.DEFAULT_RESPONSE_HEADERS,
                body: check.status.status,
            };
        }
    }
    return {
        status: status.NOT_FOUND,
        contentType: constants.MIME_APPLICATION_JSON,
        headers: constants.DEFAULT_RESPONSE_HEADERS,
        body: [
            constants.CRIT,
            {
                description: 'Unknow Status endpoint',
                result: constants.CRIT,
                details: `Status endpoint does not exist: /status/${params.dependency}`,
            }
        ],
    }
};

module.exports.path = '/:dependency';