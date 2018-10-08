'use strict';

const status = require('http-status');
const constants = require('../constants');
const testee = require('../../../lib/routes/dependency');

const check1 = {
    id: 'check1_id',
    status: {
        status: [
            'OK'
        ],
    },
};

it('should return a proper response for existing dependency',
    async () => expect(testee({ dependency: 'check1_id' }, {
        checks: [
            check1,
        ],
    })).resolves.toEqual({
        status: status.OK,
        contentType: constants.MIME_APPLICATION_JSON,
        headers: constants.DEFAULT_RESPONSE_HEADERS,
        body: check1.status.status,
    }));

it('should return a proper 404 response for not existing dependency', 
    async () => expect(testee({ dependency: 'fake' }, {
        checks: [
            check1,
        ],
    })).resolves.toEqual({
        status: status.NOT_FOUND,
        contentType: constants.MIME_APPLICATION_JSON,
        headers: constants.DEFAULT_RESPONSE_HEADERS,
        body: [
            constants.CRIT,
            {
                description: constants.MSG_UNKNOWN_STATUS_ENDPOINT,
                result: constants.CRIT,
                details: `${constants.MSG_UNKNOWN_STATUS_ENDPOINT_DETAILS}fake`,
            }
        ],
    }));