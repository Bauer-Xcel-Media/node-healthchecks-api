'use strict';

const elasticsearch = require('elasticsearch');
const Check = require('../check');

const GREEN = 'green';
const YELLOW = 'yellow';
const RED = 'red';

module.exports = class Elasticsearch extends Check {
    constructor(config) {
        super(config);
        this.error = new Error(`Elasticsearch connection to ${this.config.url} failed.`);
        this.client = new elasticsearch.Client({
            host: this.config.url,
        });
    }

    async start() {
        try {
            const result = await this.client.cluster.health();
            result.alert = `${this.config.url} is '${result.status}'.`;
            switch(result.status) {
                case GREEN:
                    this.ok();
                    break;
                case YELLOW:
                    this.warn(result.alert, result);
                    break;
                case RED:
                default:
                    this.crit(result.alert, result);
                    break;                                
            }
        } catch (err) {
            this.error = err;
            this.crit();
        }
        setTimeout(this.start.bind(this), this.interval);
        return this;
    }
};