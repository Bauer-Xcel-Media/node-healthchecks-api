'use strict';

const URL = require('url');
const superagent = require('superagent');
const constants = require('../constants');
const Check = require('../check');

module.exports = class Http extends Check {
    constructor(config) {
        super(config);
        this.method = this.config.method ? this.config.method.toLowerCase() : 'get';
    }

    async request (path) {
        const _url = path ? URL.resolve(this.config.url, path) : this.config.url;
        return await superagent[this.method](_url)
            .set('cache-control', 'no-cache, no-store, must-revalidate')
            .set('pragma', 'no-cache')
            .set('expires', '0')
            .timeout(this.timeout);
    }

    async start () {
        try {
            const path = this.config.path || '/status/aggregate';
            const res = await this.request(path);
            const body = res.body;
            if (Array.isArray(body) && body.length > 0 && constants.HEALTH_STATUSES.includes(body[0])) {
                const description = body.length > 1 ? body[1].description || this.config.name : this.config.name;
                const details = body.length > 1 ? body[1].details || this.config : this.config;
                switch (body[0]) {
                    case constants.CRIT:
                        this.crit(description, details);
                        break;
                    case constants.WARN:
                        this.warn(description, details);
                        break;
                    case constants.OK:
                    default:
                        this.ok();
                        break;
                }
                this.traversable = true;
            } else {
                this.ok();
                this.traversable = false;
            }
        } catch (err) {
            this.error = new Error(err.message);
            this.error.status = err.status;
            if (err.response) {
                this.error.body = err.response.text;
            }
            this.traversable = false;
            this.crit();
        }
        setTimeout(this.start.bind(this), this.interval);
        return this;
    }
};