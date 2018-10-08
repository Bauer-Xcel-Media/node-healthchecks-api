'use strict';

const status = require('http-status');
const URL = require('url');
const superagent = require('superagent');
const constants = require('../constants');
const about = require('./about');

module.exports = async (params, service) => {
    if (!params.dependencies) {
        return await about(params, service);
    }
    const dependencies = params.dependencies.split(',');
    const dependency = dependencies.shift();
    for (let i=0; i < service.checks.length; i++) {
        let check = service.checks[i];
        if (check.id === dependency || check.config.statusPath === dependency) {
            if (!check.traversable) {
                return {
                    status: status.OK,
                    contentType: constants.MIME_APPLICATION_JSON,
                    headers: constants.DEFAULT_RESPONSE_HEADERS,
                    body: [
                        constants.CRIT,
                        {
                            description: constants.MSG_CANT_TRAVERSE,
                            result: constants.CRIT,
                            details: `${check.config.name} ${constants.MSG_IS_NOT_TRAVERSEABLE}`,
                        }
                    ],
                };
            }
            try {
                const res = await superagent(URL.resolve(check.config.url,
                    `/status/traverse?dependencies=${dependencies.join(',')}`));
                return {
                    status: res.statusCode,
                    contentType: constants.MIME_APPLICATION_JSON,
                    headers: constants.DEFAULT_RESPONSE_HEADERS,
                    // TODO: standardize the body in case of a custom one.
                    body: res.body,
                };
            } catch (err) {
                return {
                    status: err.status || status.OK,
                    contentType: constants.MIME_APPLICATION_JSON,
                    headers: constants.DEFAULT_RESPONSE_HEADERS,
                    body: err.text || [ constants.CRIT, {
                        description: err.message,
                        result: constants.CRIT,
                        details: err,
                    }] ,
                };
            }
        }
    }
    return {
        status: status.OK,
        contentType: constants.MIME_APPLICATION_JSON,
        headers: constants.DEFAULT_RESPONSE_HEADERS,
        body: [
            constants.CRIT,
            {
                description: constants.MSG_CANT_TRAVERSE,
                result: constants.CRIT,
                details: `Status path '${dependency}' is not registered`,
            }
        ],
    };
};
