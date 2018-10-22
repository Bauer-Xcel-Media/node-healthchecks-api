'use strict';

const os = require('os-utils');
const constants = require('../constants');
const Check = require('../check');
const utils = require('../utils');

module.exports = class Self extends Check {
    constructor(config) {
        super(config);
        this.config.type = constants.SERVICE_TYPE_INTERNAL;
        this.config.url = '127.0.0.1';
        this.config.name = constants.SELF_CHECK_ID;
        this.id = constants.SELF_CHECK_ID;
        this.config.statusPath = constants.SELF_CHECK_ID;
        this.status = [ constants.OK ];
        this.metrics = this.config.metrics || Object.assign({}, constants.DEFAULT_METRICS_LIMITS);
        this.secondsToKeepMemoryLeakMsg = 
            this.config.secondsToKeepMemoryLeakMsg || constants.DEFAULT_SECONDS_TO_KEEP_MEMORY_LEAK_MSG;
        if (this.config.memwatch) {
            this.activateMemwatch();
        }
    }

    async activateMemwatch () {
        (await utils.linkAndRequire(this.config.memwatch)).on('leak', this.leak.bind(this));
    }

    leak (stats = {}) {
        stats.message = constants.MSG_MEMORY_LEAK_DETECTED;
        this.leakStats = stats;
        setTimeout((() => {
            this.leakStats = undefined;
        }).bind(this), this.secondsToKeepMemoryLeakMsg * 1000);
    }

    async getStats() {
        const stats = {
            memoryUsage: Math.round(100 - (100 * os.freememPercentage())),
            cpuUsage: Math.round(100 * (await new Promise(resolve => os.cpuUsage(resolve)))),
        };
        return stats;
    }

    async start() {
        if (this.leakStats) {
            this.warn(constants.MSG_MEMORY_LEAK_DETECTED, this.leakStats);
        } else {
            try {
                this.stats = await this.getStats();
                const result = Object.keys(this.metrics).reduce((result, key) => {
                    const value = this.stats[key];
                    const limits = this.metrics[key];
                    if (value === undefined) {
                        const _result = result || { report: {}, status: constants.WARN };
                        _result.report[key] = `Metric '${key}' is not collected.`;
                        return _result;
                    }
                    if (limits.warn && value > limits.warn) {
                        const _result = result || { report: {}, status: constants.WARN };
                        _result.report[key] = {
                            value,
                            limits,
                            status: constants.WARN,
                        };
                        if (limits.crit && value > limits.crit) {
                            _result.report[key].status = constants.CRIT;
                            _result.status = constants.CRIT;
                        }
                        return _result;
                    }
                    return result;
                }, undefined);
                if (result) {
                    this[result.status.toLowerCase()]('Self health check failed.', result.report);
                } else {
                    this.ok();
                }
            } catch (err) {
                this.error = err;
                this.crit();
            }
        }
        setTimeout(this.start.bind(this), this.interval);
        return this;
    }
};