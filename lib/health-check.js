'use strict';

const fs = require('fs');
const path = require('path');
const util = require('util');
const yaml = require('js-yaml');
const constants = require('./constants');
const Check = require('./check');
const packageJson = require(path.join(process.cwd(), 'package.json'));
const utils = require('./utils');

const ADAPTERS = {};
const CHECKS = {};

const getCheckClasses = async () => {
    const checkNames = await util.promisify(fs.readdir)(path.join(__dirname, 'checks'));
    const checks = checkNames.reduce((result, filePath) => {
        const _class = require(path.join(__dirname, 'checks', filePath));
        result[_class.type || filePath] = _class;
        return result;
    }, {});
    return Object.assign(checks, CHECKS);
};

const getAdapters = async () => {
    const adapterNames = await util.promisify(fs.readdir)(path.join(__dirname, 'adapters'));
    const adapters = adapterNames.reduce((result, filePath) => {
        result[path.basename(filePath, path.extname(filePath))] = require(path.join(__dirname, 'adapters', filePath));
        return result;
    }, {});
    return Object.assign(adapters, ADAPTERS);
};

const getRoutes = async () => {
    const routeNames = await util.promisify(fs.readdir)(path.join(__dirname, 'routes'));

    return routeNames.map(filePath => {
        const routePath = path.join(__dirname, 'routes', filePath);
        const handler = require(routePath);
        const route = {
            path: handler.path || path.join('/', path.basename(filePath, path.extname(filePath))),
            handler
        };
        return route;
    }).sort((route1, route2) => {
        // sort the routes with parameters at the end that the don't overlap the static routes
        if (route1.handler.path && !route2.handler.path) {
            return 1;
        } else if (route2.handler.path && !route1.handler.path) {
            return -1;
        }
        return route1.path.localeCompare(route2.path);
    });
};

const checksSorter = (check1, check2) => {
    if (check1.status.status[0] === check2.status.status[0]) {
        if (check1.critical === check2.critical) {
            return check1.config.name.localeCompare(check2.config.name);
        } else {
            return check1.critical ? -1 : 1;
        }
    }
    switch (check1.status.status[0]) {
        case constants.CRIT:
            return -1;
        case constants.OK:
            return 1;
        case constants.WARN:
        default:
            return check2.status.status[0] === constants.OK ? -1 : 1;
    }
};

module.exports = async (server, options = {
    adapter: constants.DEFAULT_ADAPTER,
    service: {
        packageJson,
    },
}) => {

    const adapter = options.adapter || constants.DEFAULT_ADAPTER;
    const service = options.service || {
        packageJson,
    };

    if (!(service.packageJson)) {
        service.packageJson = packageJson;
    }

    const adapters = await getAdapters();

    let _adapter = typeof adapter === 'function' ? adapter : adapters[adapter];
    if (!_adapter) {
        if (typeof adapter === 'string') {
            _adapter = await utils.linkAndRequire(adapter);
        } else {
            throw new Error(`Wrong initialization parameter 'adapter=${adapter}'.`);
        }
    }

    const checkClasses = await getCheckClasses();

    if (!service.config) {
        if (!service.configPath) {
            service.configPath = process.env.HEALTH_CHECK_CONF_PATH || constants.DEFAULT_CONFIG_PATH;
        }
        if (!fs.existsSync(service.configPath)) {
            throw new Error(`Config file: '${service.configPath}' does not exist.`);
        }
        service.config = yaml.safeLoad(await util.promisify(fs.readFile)(service.configPath));
    }
    if (service.config && service.config.checks) {
        service.checks = await Promise.all(service.config.checks.map(async function (checkConfig) {
            if (!(checkClasses[checkConfig.check])) {
                throw new Error(`${checkConfig.check} is not supported.`);
            } if (!(checkClasses[checkConfig.check].prototype instanceof Check)) {
                throw new Error(`${checkClasses[checkConfig.check]} is not an instance of ${Check.name}.`);
            }
            const _check = new (checkClasses[checkConfig.check])(checkConfig);
            _check.on('statusChanged', function () {
                if (this.checks) {
                    this.checks.sort(checksSorter);
                }
            }.bind(this));
            await _check.start();
            return _check;
        }.bind(service)));
    } else {
        service.checks = [];
    }
    return await Promise.all((await getRoutes()).map(route => _adapter(service, server, route)));
};

const addChecks = async (checks) => {
    if (checks.prototype instanceof Check) {
        CHECKS[checks.type] = checks;
        return CHECKS;
    } else if (typeof checks === 'string') {
        return await addChecks(await utils.linkAndRequire(checks));
    } else if (Array.isArray(checks)) {
        return await Promise.all(checks.map(async check => await addChecks(check)));
    } else if (typeof checks === 'object') {
        return await Promise.all(Object.keys(checks).map(async type => {
            checks[type].type = type;
            return await addChecks(checks[type]);
        }));
    } else {
        throw new Error(`Incorrect 'checks' parameter value: '${checks}'`);
    }
};

module.exports.addChecks = addChecks;
module.exports.Check = Check;
