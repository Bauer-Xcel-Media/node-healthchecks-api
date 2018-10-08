'use strict';

const status = require('http-status');
const constants = require('../constants');

module.exports = async (params, service) => {
    let body = [
        'OK'
    ];
    for (let i=0; i < service.checks.length; i++) {
        let check = service.checks[i];
        if (params.type && params.type !== check.config.type) {
            continue;
        }
        if (check.status.status[0] !== constants.OK) {
            body = check.status.status;
            break;
        }
    }
    return {
        status: status.OK,
        contentType: constants.MIME_APPLICATION_JSON,
        headers: constants.DEFAULT_RESPONSE_HEADERS,
        body,
    };
};