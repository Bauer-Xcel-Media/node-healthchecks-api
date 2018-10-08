'use strict';

const status = require('http-status');
const constants = require('../constants');
const testee = require('../../../lib/routes/am-i-up');

it('should return a proper response', async () => expect(testee()).resolves.toEqual({
    status: status.OK,
    contentType: constants.MIME_APPLICATION_TEXT,
    headers: constants.DEFAULT_RESPONSE_HEADERS,
    body: 'OK',
}));