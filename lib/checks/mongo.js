'use strict';

const MongoClient = require('mongodb').MongoClient;
const Check = require('../check');

module.exports = class Mongo extends Check {
    constructor(config) {
        super(config);
        this.error = new Error(`MongoDB connection to ${config.url} failed.`);
    }

    async start () {
        return await new Promise(resolve => {
            MongoClient.connect(this.config.url, {
                useNewUrlParser: true
            }, (err, db) => {
                if (!err) {
                    this.db = db;
                    this.db.topology
                        .on('close', this.reconnect.bind(this))
                        .on('reconnect', this.ok.bind(this))
                        .on('error', this.crit.bind(this));
                    this.ok();
                    resolve(this);
                } else {
                    this.error = err;
                    this.crit();
                    setTimeout(this.start.bind(this), this.interval);
                    resolve(this);
                }
            });
        });
    }

    reconnect () {
        if (this.db) {
            this.db.close();
        }
        this.crit();
        this.start();
    }
};