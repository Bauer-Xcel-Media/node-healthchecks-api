'use strict';

const httpStatus = require('http-status');
const constants = require('../constants');

const getServiceUrl = params => {
    const proto = params['x-forwarded-proto'];
    return proto ? `${proto}://${params.host}` : params.host;
};

module.exports = async (params, service) => ({
    status: httpStatus.OK,
    contentType: constants.MIME_APPLICATION_JSON,
    headers: constants.DEFAULT_RESPONSE_HEADERS,
    body: {
        id: service.config.name || service.packageJson.name,
        name: service.config.name || service.packageJson.name,
        description: service.config.description || service.packageJson.description,
        version: service.packageJson.version || 'x.x.x',
        host: service.config.host || getServiceUrl(params),
        protocol: service.config.protocol || params['x-forwarded-proto'] || 'http',
        projectHome: service.config.projectHome || service.packageJson.homepage,
        projectRepo: service.config.projectRepo || (service.packageJson.repository ? service.packageJson.repository.url : 'unknown'),
        owners: service.config.owners || [
            service.packageJson.author && service.packageJson.author.name
                ? `${service.packageJson.author.name} <${service.packageJson.author.email}>`  : service.packageJson.author 
        ],
        dependencies: service.checks.map(check => check.status),
    }
});