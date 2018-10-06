'use strict';

const status = require('http-status');
const constants = require('../constants');
const testee = require('../../../lib/routes/aggregate');

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

it('should return a proper response without a type parameter', async () => {
    return expect(testee({}, {
        checks: [
            check1,
            check2
        ],
    })).resolves.toEqual({
        status: status.OK,
        contentType: constants.MIME_APPLICATION_JSON,
        headers: constants.DEFAULT_RESPONSE_HEADERS,
        body: check2.status.status,
    });
});

it('should return a proper response with a type parameter', async () => {
    return expect(testee({ type: 'check1' }, {
        checks: [
            check1,
            check2
        ],
    })).resolves.toEqual({
        status: status.OK,
        contentType: constants.MIME_APPLICATION_JSON,
        headers: constants.DEFAULT_RESPONSE_HEADERS,
        body: check1.status.status,
    });
});