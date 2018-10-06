'use strict';

const constants = require('../../lib/constants');

const VIRTUAL = { virtual: true };
const CWD = `${process.cwd()}`;

module.exports = Object.assign(constants, {
    VIRTUAL,
    CWD,
});