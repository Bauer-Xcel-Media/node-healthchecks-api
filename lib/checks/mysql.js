'use strict';

const mysql = require('mysql');
const Check = require('../check');

module.exports = class Mysql extends Check {
    constructor(config) {
        super(config);
        this.error = new Error(`MySQL connection to ${config.url} failed.`);
    }

    async start () {
        return await new Promise((resolve => {
            const connection = mysql.createConnection({
                host : this.config.url,
                user : this.config.user,
                password : this.config.password,
                database : this.config.database,
            });
            connection.ping(err => {
                if (err) {
                    this.error = err;
                    this.crit();
                } else {
                    this.ok();
                }
                connection.end();
                setTimeout(this.start.bind(this), this.interval);
                resolve(this);
            });
        }).bind(this));
    }
};