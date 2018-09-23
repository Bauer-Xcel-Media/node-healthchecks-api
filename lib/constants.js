'use strict';

const OK = 'OK';

const WARN = 'WARN';

const CRIT = 'CRIT';

const HEALTH_STATUSES = [ OK, WARN, CRIT ];

const TIME_FACTOR = 0.001;

const DEFAULT_INTERVAL = 3000;

const DEFAULT_CONFIG_PATH = './conf/dependencies.yml';

const DEFAULT_TIMEOUT = 2000;

const DEFAULT_SERVICE_TYPE = 'external';

const DEFAULT_ADAPTER = 'express';

const DEFAULT_METRICS_LIMITS = {
    cpuUsage: {
        warn: 50,
        crit: 80,
    },
    memoryUsage: {
        warn: 50,
        crit: 80,
    },
};

const MIME_APPLICATION_JSON = 'application/json';

const MIME_APPLICATION_TEXT = 'application/text';

const MSG_NON_CRITICAL_SERVICE_OUTAGE = 'Non-critical service outage - ';

const MSG_NO_DESCRIPTION = 'No description provided.';

const MSG_MEMORY_LEAK_DETECTED = 'Memory leak detected!';

const MSG_ADAPTER_MUST_BE_A_FUNCTION = `Given 'adapter' parameter must be either a function or a name of a module exporting a function.`;

const DEFAULT_SECONDS_TO_KEEP_MEMORY_LEAK_MSG = 20;

const DEFAULT_RESPONSE_HEADERS = {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
};

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

    MIME_APPLICATION_JSON,
    MIME_APPLICATION_TEXT,

    MSG_NON_CRITICAL_SERVICE_OUTAGE,
    MSG_NO_DESCRIPTION,
    MSG_MEMORY_LEAK_DETECTED,
};