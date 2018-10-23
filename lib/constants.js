'use strict';

const OK = 'OK';

const WARN = 'WARN';

const CRIT = 'CRIT';

const HEALTH_STATUSES = [ OK, WARN, CRIT ];

const TIME_FACTOR = 0.001;

const SERVICE_TYPE_INTERNAL = 'internal';
const SERVICE_TYPE_EXTERNAL = 'external';

const DEFAULT_INTERVAL = 3000;
const DEFAULT_CONFIG_PATH = './conf/dependencies.yml';
const DEFAULT_TIMEOUT = 2000;
const DEFAULT_SERVICE_TYPE = SERVICE_TYPE_EXTERNAL;
const DEFAULT_ADAPTER = 'express';
const DEFAULT_METRICS_LIMITS = {
    cpuUsage: {
        warn: 50,
        crit: 80,
    },
    memoryUsage: {
        warn: 93,
        crit: 98,
    },
};
const DEFAULT_SECONDS_TO_KEEP_MEMORY_LEAK_MSG = 20;
const DEFAULT_RESPONSE_HEADERS = {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
};
const DEFAULT_SERVICE_VERSION = 'x.x.x';
const DEFAULT_SERVICE_REPO_URL = 'unknown';
const DEFAULT_PROTOCOL = 'http';

const MIME_APPLICATION_JSON = 'application/json';
const MIME_APPLICATION_TEXT = 'application/text';

const MSG_NON_CRITICAL_SERVICE_OUTAGE = 'Non-critical service outage - ';
const MSG_NO_DESCRIPTION = 'No description provided.';
const MSG_MEMORY_LEAK_DETECTED = 'Memory leak detected!';
const MSG_ADAPTER_MUST_BE_A_FUNCTION = 
    'Given \'adapter\' parameter must be either a function or a name of a module exporting a function.';
const MSG_UNKNOWN_STATUS_ENDPOINT = 'Unknown status endpoint';
const MSG_UNKNOWN_STATUS_ENDPOINT_DETAILS = 'Status endpoint does not exist: /status/';
const MSG_CANT_TRAVERSE = 'Can\'t traverse';
const MSG_IS_NOT_TRAVERSEABLE = 'is not traversable';

const HEADER_X_FORWARDED_FOR = 'x-forwarded-for';
const HEADER_X_FORWARDED_PROTO = 'x-forwarded-proto';
const HEADER_CONTENT_TYPE = 'content-type';

const SELF_CHECK_ID = 'self-check';

module.exports = {
    OK,
    WARN,
    CRIT,
    TIME_FACTOR,
    HEALTH_STATUSES,

    DEFAULT_INTERVAL,
    DEFAULT_CONFIG_PATH,
    DEFAULT_METRICS_LIMITS,
    DEFAULT_TIMEOUT,
    DEFAULT_SECONDS_TO_KEEP_MEMORY_LEAK_MSG,
    DEFAULT_RESPONSE_HEADERS,
    DEFAULT_SERVICE_TYPE,
    DEFAULT_ADAPTER,
    DEFAULT_SERVICE_VERSION,
    DEFAULT_SERVICE_REPO_URL,
    DEFAULT_PROTOCOL,

    MIME_APPLICATION_JSON,
    MIME_APPLICATION_TEXT,

    MSG_NON_CRITICAL_SERVICE_OUTAGE,
    MSG_NO_DESCRIPTION,
    MSG_MEMORY_LEAK_DETECTED,
    MSG_ADAPTER_MUST_BE_A_FUNCTION,
    MSG_UNKNOWN_STATUS_ENDPOINT,
    MSG_UNKNOWN_STATUS_ENDPOINT_DETAILS,
    MSG_CANT_TRAVERSE,
    MSG_IS_NOT_TRAVERSEABLE,

    HEADER_X_FORWARDED_FOR,
    HEADER_X_FORWARDED_PROTO,
    HEADER_CONTENT_TYPE,

    SELF_CHECK_ID,

    SERVICE_TYPE_INTERNAL,
    SERVICE_TYPE_EXTERNAL,
};