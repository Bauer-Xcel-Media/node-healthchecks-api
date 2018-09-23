'use strict';

const util = require('util');
const exec = util.promisify(require('child_process').exec);

module.exports.linkAndRequire = async (moduleName) => {
    const { stdout, stderr } = await exec(`npm link ${moduleName}`, { cwd: __dirname });
    console.log(stdout, stderr);
    return require(moduleName);
}
