'use strict';

const httpStatus = require('http-status');
const constants = require('../constants');

const getServiceUrl = params => {
    const host = params[constants.HEADER_X_FORWARDED_FOR] || params.host;
    const proto = params[constants.HEADER_X_FORWARDED_PROTO] || constants.DEFAULT_PROTOCOL;
    return `${proto}://${host}`;
};

module.exports = async (params, service) => ({
    status: httpStatus.OK,
    contentType: constants.MIME_APPLICATION_JSON,
    headers: constants.DEFAULT_RESPONSE_HEADERS,
    body: {
        id: service.config.name || service.packageJson.name,
        name: service.config.name || service.packageJson.name,
        description: service.config.description || service.packageJson.description,
        version: service.packageJson.version || constants.DEFAULT_SERVICE_VERSION,
        host: service.config.host || getServiceUrl(params),
        protocol: service.config.protocol || params[constants.HEADER_X_FORWARDED_PROTO] || constants.DEFAULT_PROTOCOL,
        projectHome: service.config.projectHome || service.packageJson.homepage,
        projectRepo: service.config.projectRepo || (service.packageJson.repository ? service.packageJson.repository.url : constants.DEFAULT_SERVICE_REPO_URL),
        owners: service.config.owners || [
            service.packageJson.author && service.packageJson.author.name
                ? `${service.packageJson.author.name} <${service.packageJson.author.email}>`  : service.packageJson.author
        ],
        dependencies: service.checks.map(check => check.status),
    },
});