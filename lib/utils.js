'use strict';

const util = require('util');
const exec = util.promisify(require('child_process').exec);

module.exports.linkAndRequire = async (moduleName) => {
    await exec(`npm link ${moduleName}`, { cwd: __dirname });
    return require(moduleName);
};
