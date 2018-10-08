'use strict';

const path = require('path');
const constants = require('../constants');
const testee = require('../../../lib/adapters/express');

const req = {};
const service = {
    name: 'myservice',
};

const createMocks = (routeHandler, body = {
    myContent: 'my-content',
}, contentType = constants.MIME_APPLICATION_JSON) => {
    const result = {
        status: 200,
        contentType,
        headers: {
            'x-my-header': 'my-value',
        },
        body,
    };
    return {
        next: jest.fn(),
        res: {
            set: jest.fn(),
            status: jest.fn(),
            send: jest.fn(),
            json: jest.fn(),
        },
        result,
        route: {
            path: '/mypath',
            handler: jest.fn(routeHandler || (async () => result)),
        },
        server: {
            get: jest.fn((routePath, handler) => handler),
        },
    };
};

it ('should create a proper get handler for given route returning JSON', async () => {

    const {
        next, res, result, route, server
    } = createMocks();

    const handler = await testee(service, server, route);

    expect(server.get).toHaveBeenNthCalledWith(1, path.join('/status', route.path), expect.any(Function));

    await handler(req, res, next);
    expect(res.status).toHaveBeenNthCalledWith(1, result.status);
    expect(res.set).toHaveBeenNthCalledWith(1, constants.HEADER_CONTENT_TYPE, result.contentType);
    expect(res.set).toHaveBeenNthCalledWith(2, result.headers);
    expect(res.json).toHaveBeenNthCalledWith(1, result.body);
    return expect(res.send).not.toHaveBeenCalled();
});

it ('should create a proper get handler for given route returning text', async () => {

    const {
        next, res, result, route, server
    } = createMocks(undefined, 'MY_CONTENT', constants.MIME_APPLICATION_TEXT);

    const handler = await testee(service, server, route);

    expect(server.get).toHaveBeenNthCalledWith(1, path.join('/status', route.path), expect.any(Function));

    await handler(req, res, next);
    expect(res.status).toHaveBeenNthCalledWith(1, result.status);
    expect(res.set).toHaveBeenNthCalledWith(1, constants.HEADER_CONTENT_TYPE, result.contentType);
    expect(res.set).toHaveBeenNthCalledWith(2, result.headers);
    expect(res.send).toHaveBeenNthCalledWith(1, result.body);
    return expect(res.json).not.toHaveBeenCalled();
});

it ('should call the \'next\' callback once the route handler throws an Error', async () => {

    const err = new Error('crash!');

    const {
        next, res, route, server
    } = createMocks(async () => {
        throw err;
    });

    const handler = await testee(service, server, route);

    expect(server.get).toHaveBeenNthCalledWith(1, path.join('/status', route.path), expect.any(Function));

    await handler(req, res, next);
   
    expect(res.status).not.toHaveBeenCalled();
    expect(res.set).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
    return expect(next).toHaveBeenNthCalledWith(1, err);
});
