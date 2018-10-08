'use strict';

const EventEmitter = require('events'); 
const moment = require('moment');
const stringify = require('json-stringify-safe');
const constants = require('./constants');

module.exports = class Check extends EventEmitter {
    constructor(config) {
        super();
        this.config = config || {};
        this.id = this.config.id || this.config.name;
        this.config.statusPath = this.id;
        this.config.type = this.config.type || constants.DEFAULT_SERVICE_TYPE;
        this.critical = !(this.config.critical === false);
        this.traversable = this.config.isTraversable || false;
        this.timeout = this.config.timeout || constants.DEFAULT_TIMEOUT;
        this.status = [ constants.OK ];
        this.oldStatus = {};
    }

    static get type() {
        return this._type || this.name.toLowerCase();
    }

    static set type(type) {
        this._type = type;
    }

    get interval() {
        return this.config.interval || constants.DEFAULT_INTERVAL;
    }

    get status() {
        return {
            name: `${this.config.name}${this.critical ? '' : ' (not critical)'}`,
            status: this._status,
            statusPath: this.config.statusPath,
            type: this.config.type,
            isTraversable: this.traversable,
            statusDuration: Math.round(new moment().diff(this._startTime) * constants.TIME_FACTOR),
        };
    }

    set status(status) {
        if (!this._status || stringify(this._status) !== stringify(status)) {
            this._status = status;
            this._startTime = new moment();
        }
    }

    setStatus (status, description, details) {
        let _description = description || constants.MSG_NO_DESCRIPTION;
        let _details = typeof details === 'object' ? stringify(details) : details || _description;
        _details = _details.startsWith(this.config.name) ? _details : `${this.config.name} > ${_details}`;
        let _status = status;
        if (this.oldStatus.status === _status 
            && this.oldStatus.description === _description
            && this.oldStatus.details === _details
        ) {
            return;
        }
        this.oldStatus.status = _status;
        this.oldStatus.description = _description;
        this.oldStatus.details = _details;
        switch (status) {
            case constants.OK:
                this.status = [ constants.OK ];
                return;
            case constants.CRIT:
                _status = this.critical ? constants.CRIT : constants.WARN;
                break;
            default:
                break;
        }
        this.status = [
            _status,
            {
                result: _status,
                description: _description,
                details: _details || _description,
            }
        ];
        this.emit('statusChanged', this);
    }

    ok () {
        this.setStatus(constants.OK);
    }

    warn (description, details) {
        this.setStatus(constants.WARN, description, details);
    }

    crit (description, details) {
        if (description) {
            this.setStatus(constants.CRIT, description, details || description);
        } else {
            this.setStatus(constants.CRIT, `${this.error ? this.error.message : this.error}`);
        }
    }

    async start () {
        throw new Error('An abstract method has been called');
    }
};