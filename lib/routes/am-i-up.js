'use strict';

const status = require('http-status');
const constants = require('../constants');

module.exports = async () => ({
    status: status.OK,
    contentType: constants.MIME_APPLICATION_TEXT,
    headers: constants.DEFAULT_RESPONSE_HEADERS,
    body: 'OK',
});