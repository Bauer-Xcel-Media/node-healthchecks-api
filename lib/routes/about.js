'use strict';

const os = require('os');
const httpStatus = require('http-status');
const constants = require('../constants');

const authors = packageJson => {
    let result = [];
    if (packageJson.author) {
        result.push(packageJson.author);
    }
    if (packageJson.contributors) {
        result = result.concat(packageJson.contributors);
    }
    return result.map(person => person.name ? `${person.name} <${person.email}>` : person);
};

module.exports = async (params, service) => ({
    status: httpStatus.OK,
    contentType: constants.MIME_APPLICATION_JSON,
    headers: constants.DEFAULT_RESPONSE_HEADERS,
    body: {
        id: service.config.name || service.packageJson.name,
        name: service.config.name || service.packageJson.name,
        description: service.config.description || service.packageJson.description,
        version: service.config.version || service.packageJson.version || constants.DEFAULT_SERVICE_VERSION,
        host: service.config.host || os.hostname(),
        protocol: service.config.protocol || constants.DEFAULT_PROTOCOL,
        projectHome: service.config.projectHome || service.packageJson.homepage,
        projectRepo: service.config.projectRepo ||
            (service.packageJson.repository ? service.packageJson.repository.url : constants.DEFAULT_SERVICE_REPO_URL),
        owners: service.config.owners || authors(service.packageJson),
        logsLinks: service.config.logsLinks,
        statsLinks: service.config.statsLinks,
        dependencies: service.checks.map(check => check.status),
    },
});