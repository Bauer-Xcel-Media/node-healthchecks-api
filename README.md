# Health Checks for microservices

[![Build Status](https://travis-ci.org/Bauer-Xcel-Media/node-healthchecks-api.png?branch=master)](https://travis-ci.org/Bauer-Xcel-Media/node-healthchecks-api)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![codecov](https://codecov.io/gh/Bauer-Xcel-Media/node-healthchecks-api/branch/master/graph/badge.svg)](https://codecov.io/gh/Bauer-Xcel-Media/node-healthchecks-api)

A [Node.js](https://nodejs.org) implementation of the [Health Checks API](https://github.com/hootsuite/health-checks-api) provided by [Hootsuite](https://hootsuite.com/).

<!-- TOC -->

- [Health Checks for microservices](#health-checks-for-microservices)
    - [Installation](#installation)
    - [Functionality](#functionality)
    - [Health status reports](#health-status-reports)
    - [Usage](#usage)
        - [Example - Express.js powered application](#example---expressjs-powered-application)
    - [Check types](#check-types)
        - [`self` check](#self-check)
            - [Memory leak detection](#memory-leak-detection)
        - [`http` check](#http-check)
        - [`mongo` check](#mongo-check)
        - [`redis` check](#redis-check)
        - [`elasticsearch` check](#elasticsearch-check)
    - [Development](#development)
        - [Framework adapters](#framework-adapters)
        - [Developing new check types](#developing-new-check-types)
            - [Create a custom check type class](#create-a-custom-check-type-class)
            - [Add the check class to the module check type list](#add-the-check-class-to-the-module-check-type-list)
            - [Exporting multiple check classes in a custom module](#exporting-multiple-check-classes-in-a-custom-module)
    - [Testing](#testing)
        - [Unit tests](#unit-tests)
        - [Integration test](#integration-test)
            - [The set-up](#the-set-up)
            - [Running the test](#running-the-test)
            - [Starting and stopping services](#starting-and-stopping-services)
            - [Emulating high load and memory leak](#emulating-high-load-and-memory-leak)
            - [Tearing down the set-up](#tearing-down-the-set-up)

<!-- /TOC -->

## Installation

```bash
npm install --save heathchecks-api
```

## Functionality

Enables an application/service combined Health Check view When used in the ecosystem of microservices.
This includes a service/application self check and following dependency checks:

* `internal` (composed) - local service dependencies (eg. database, cache). Generally these are dedicated local services used only by subject service/application,
* `external` (aggregated/associated) - usually another microservices in the ecosystem, which the subject service/application depends on.

The dependencies can be:

* `critical` - the subject service/application is considered non-operational when such a dependency is non-operational,
* `non-critical` - the subject service/application is partly operational even when such a dependency is non-operational, as it can still serve a subset of its capabilities.

Another dependency division is:

* `traversable` - this means the dependency implements the [Health Checks API](https://github.com/hootsuite/health-checks-api) itself and therefore one can traverse to its `Health Check API endpoint` and check its own state together with its dependencies states.
* `non-traversable` - the dependency health state is still reported by an appropriate check type, but the service does not implement the [Health Checks API](https://github.com/hootsuite/health-checks-api), therefore one cannot drill-down due to observe its internal state details.

__NOTE__: The `traversable` dependency capability is resolved by this module in a runtime.

## Health status reports

The health is reported in following states:

* <span style="color:green">OK</span> - all fine ;)
* <span style="color:yellow">WARN</span> - `warning` - partly operational, the issue report available (description and details).
* <span style="color:red">CRIT</span> - `critical` - non-operational, the error report available (description and details).

The overall health state of the subject service/application is an aggregation of its own state and its dependencies state. Aggregation is done with a respect to following (the order matters!):

* when there is (are) any `red` (_critical_) state (either the subject service/application state or any of its dependencies states) first found `red` state is reported as the resulting overall state (with its description and details),
* when there is (are) any `yellow` (_warning_) state (either the subject service/application state or any of its dependencies states) first found `yellow` state is reported as the resulting overall state (with its description and details),
* The overall subject service/application state is `green` only when its self-check and __all__ of its dependencies are `green`.

## Usage

The module works as a middleware, exposing the [Health Checks API](https://hootsuite.github.io/health-checks-api/) routes via chosen `http server` framework routing system.

The module configuration is a single `yaml` file and represents the subject service/application context.
The default path for the config file is `./conf/dependencies.yml`.

An example config:

```yaml
version: "3.1"

name: demo-app
description: Nice demo application :)

checks:
  - check: self
    memwatch: memwatch-next

  - name: mongo
    url: mongodb://mongo/test
    type: internal
    interval: 3000
    check: mongo

  - name: service-1
    url: http://service-1:3001
    type: external
    interval: 1000
    check: http

  - name: service-2
    url: http://service-2:3002
    type: external
    critical: false
    interval: 1000
    check: http
```

The library declaration depends on chosen `http server` framework, but in any case this will be about 2 lines of code.
See the examples below.

### Example - Express.js powered application

See: [Express.js framework](https://expressjs.com/).

```javascript
const healthCheck = require('healthchecks-api');

const startServer = async () => {
    const app = express();
    // some initialization steps

    await healthCheck(app);
    // rest of initialization stepa
}

startServer();

```

## Check types

Following check types are supported:

### `self` check

The service/application check for its own health.
It checks the `CPU` and `Memory` consumption [%] and verifies them against given alarm levels:

Example config:

```yaml
checks:
  - check: self
    memwatch: memwatch-next
    secondsToKeepMemoryLeakMsg: 60
    metrics:
      memoryUsage:
        warn: 30
        crit: 50
      cpuUsage:
        warn: 50
        crit: 80
```

#### Memory leak detection

Additionally this check can listen and react to a `memory leak` event leveraging the [memwatch-next](https://www.npmjs.com/package/memwatch-next) library or one of its ancestors/descendants.
Due to provide this functionality set the `memwatch` property to the name of the library in NPM, as shown in the example config above.

The linked library must provide the `leak` event as in the example below:

```javascript
const memwatch = require('memwatch-next');
memwatch.on('leak', function(info) { ... });
```

### `http` check

The health check for a linked `HTTP` service, usually an `API` provider.

Example config:

```yaml
checks:
  - check: http
    name: service-2
    url: http://service-2:3002
    method: get # default
    type: external # default
    interval: 3000 # default [milliseconds]
    critical: true # default
```

Checks whether the service responds at given `url`.
Determines whether it is `traversable` (will work only when given method is `get`) and resolves aggregated service state when so.

### `mongo` check

Checks the availability of the [Mongo DB](https://www.mongodb.com/) instance at given `url`.

Example config:

```yaml
checks:
  - check: mongo
    name: mongo
    url: mongodb://mongo/test
    type: internal
    interval: 3000
```

### `redis` check

Checks the availability of the [Redis](https://redis.io/) instance at given `url`.

Example config:

```yaml
checks:
  - check: redis
    name: redis
    url: redis://redis
    type: internal
```

### `elasticsearch` check

Checks the availability of the [Elasticsearch](https://www.elastic.co/products/elasticsearch) instance at given `url`.

Example config:

```yaml
checks:
  - check: elasticsearch
    name: elasticsearch
    url: elasticsearch:9200
    type: internal
```

## Development

Contribution welcome for:

* check types
* framework adapters

PRs with any improvements and issue reporting welcome as well!

### Framework adapters

The module is designed to operate as a middleware in various `http` based [Node.js](https://nodejs.org) frameworks.
Currently supported frameworks are:

* [Express.js](https://expressjs.com/)

A particular framework implementation is an adapter exposing a single method.

Here's the example for the [Express.js](https://expressjs.com/) framework:

```javascript
/**
 * Adds a particular Health Check API route to the `http` server framework.
 * The route is one of these difined by the {@link https://hootsuite.github.io/health-checks-api/|Health Checks API} specification.
 * The implementation should call given `route.handler` due to receive a response data.
 * The route handler takes combined request parameters and the service descriptor (usually `package.json` as an object) as the parameters
 * and returns the object with the response data (`status`, `headers`, `contentType` and `body`).
 * 
 * @async
 * @param {Object} service      - The service/application descriptor (usually a package.json);
 * @param {Object} server       - The Express.js application or Route.
 * @param {Object} route        - The Health Check API route descriptor object.
 * @param {string} route.path   - The Health Check API route path.
 * @param {Function} route.path - The Health Check API route handler function.
 * @returns {Promise}
 */
const express = async (service, server, route) => {
    // 1. Expose given route in the `http` server application, here an example for the `Express.js`:
    return server.get(path.join('/status', route.path), async (req, res, next) => {
        try {
            // 2. Combine the `Express.js` route parameters:
            const params = Object.assign({}, req.params, req.query, req.headers);
            // 3. Call given `route.handler` passing combined parameters and given service descriptor:
            const result = await route.handler(params, service);
            // 4. Decorate the `Express.js` response:
            res.status(result.status);
            res.set('Content-Type', result.contentType);
            res.set(result.headers);
            // 5. Return the response body according to given `contentType`:
            switch (result.contentType) {
                case constants.MIME_APPLICATION_JSON:
                    res.json(result.body);
                    break;
                default:
                    res.send(result.body);
            }
        } catch (err) {
            // 6. Deal with the Error according to `Express.js` framework rules.
            next(err);
        }
    });
};
module.exports = express;
```

An adapter can be declared as follows:

```javascript
const healthChecks = require('healthchecks-api');

(async () => {
    // The default is 'express' adapter, when not declared:
    await healthChecks(myServer);

    // An internally supported adapter:
    await healthChecks(myServer, {
        adapter: 'express',
    });

    // A module from an npm registry - must export a proper function.
    await healthChecks(myServer, {
        adapter: 'my-adapter-module',
    });

    // An adapter function declared directly:
    await healthChecks(myServer, {
        adapter: async (service, server, route) => {
            // your adapter implementation details
        }
    });
})();
```

### Developing new check types

#### Create a custom check type class

A custom check class must extend the `Check` class and implement the asynchronous `start()` method. The method is supposed to perform the actual check. When the check is performed in intervals (pull model) then the class should use derived `this.interval` [ms] property, which can be set in the `yaml` configuration (default is `3000 ms`).

```javascript
const healthChecks = require('healthchecks-api');
const Check = healthChecks.Check;

class MyCheck extends Check {
    constructor(config) {
        super(config);
        // this.config contains the properties from the `yaml` check config part.
        if (this.config.myProperty) {
            // ...
        }
        // class initialization code
    }

    async start() {
        // actual check code to be executed in `this.interval` [ms] intervals.
        // ...
        // set up the resulting state:
        this.ok(); // | this.warn(description, details); | this.crit(description, details);
    }
}
// This is optional - by default the new check type will be the class name in lowercase.
// One can change that by following line.
MyCheck.type = 'mycheck'; // the default
```

**NOTE:** The check `name` to be used in `yaml` configs is by default the class name in lowercase.

_See the particular checks implementations for reference - `./lib/checks/*`._

#### Add the check class to the module check type list

Additional check types (classes) are to be declared in runtime, before starting creating the health checks routes. Here's the example:

```javascript
const healthCheck = require('healthchecks-api');
const myCheck = require('./lib/my-check.js');

const startServer = async () => {
    const app = express();
    // some initialization steps

    await healthCheck.addChecks(myCheck);

    await healthCheck(app);
    // rest of initialization stepa
}

startServer();
```

Use the new check type in your `yaml` configurations:

```yaml
version: "3.1"

name: demo-app
description: Nice demo application :)

checks:
  - check: mycheck
    # properties are accessible in the class instance property `config` - eg. `this.config.myProperty`.
    myProperty: value
```

#### Exporting multiple check classes in a custom module

Check classes can be bundled into a module and optionally published in private or public `NPM` registry for reusability.
The module must export allowable value for the this module's `addCkecks` method.
The `addChecks` method can take a value of following parameter types as an argument:

* single `Check` class extension,
* array of `Check` class extension classes,
* object instance - a map with a key representings a check name (type) and value being a `Check` class extension class.
* module name to link from `NPM` registry. The module must export one of above.

## Testing

### Unit tests

TBD

### Integration test

The integration test is a [Docker Compose](https://docs.docker.com/compose/) based setup.
The setup shows the `health-check-api` functionality reported by [Microservice Graph Explorer](https://github.com/hootsuite/microservice-graph-explorer) - the dashboard-like application which presents service dependencies and their health status and allows to traverse dependencies which expose [Health Checks API](https://hootsuite.github.io/health-checks-api/).

One can observe changing `health status` of the `demo-app` application by:

* stopping and starting particular services,
* emulating high load to a particular `http` service,
* emulating memory leak in particular `http` service.

#### The set-up

* `explorer` - [Microservice Graph Explorer](https://github.com/hootsuite/microservice-graph-explorer) instance,
* `demo-app`, `service-1`, `service-2` and `service-3` - instances of [Express.js](https://expressjs.com/) based applications exposing the [Health Checks API](https://hootsuite.github.io/health-checks-api/) endpoints by the usage of this module,
* `service-4` - an `http` service which does not expose the `Health Checks API`,
* `mongo` - [Mongo DB](https://www.mongodb.com/) instance,
* `elasticsearch` - [Elasticsearch](https://www.elastic.co/products/elasticsearch) instance,
* `redis` - [Redis](https://redis.io/) instance.

#### Running the test

```bash
cd ./test/integration
make up
```

This will build and start the `docker-compose` services and open the [Microservice Graph Explorer](https://github.com/hootsuite/microservice-graph-explorer) in the default browser at [http://localhost:9000/#/status/http/demo-app:3000](http://localhost:9000/#/status/http/demo-app:3000).

#### Starting and stopping services

```bash
make stop SERVICE=service-2
make stop SERVICE=mongo

make start SERVICE=service-2
make start SERVICE=mongo
```

#### Emulating high load and memory leak

Following example commands use the `localhost:$PORT` urls.
Port mapping to services:

* 3000 - `demo-app`
* 3001 - `service-1`
* 3002 - `service-2`
* 3003 - `service-3`
* 3004 - `service-4`

One can use the [Apache Benchmark](http://httpd.apache.org/docs/2.4/programs/ab.html) tool for emulating a high load to an `http` service, eg:

```bash
ab -n 10000 -c 20 http://localhost:3001/heavy
```

To emulate the memory leak execute following:

```bash
curl http://localhost:3000/make-leak
```

#### Tearing down the set-up

```bash
make down
```
