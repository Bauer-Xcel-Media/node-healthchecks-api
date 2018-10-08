'use strict';

const path = require('path');
const constants = require('./constants');

const mockExec = jest.fn((command, options, callback) => callback(undefined, { stdout: 'ok', stderr: ''}));

const testModule = 'testModule';
const mockTestContent = 'TEST_CONTENT';
const makeMocks = () => {
    jest.mock('child_process', () => ({
        exec: mockExec,
    }), constants.VIRTUAL);

    jest.mock(testModule, () => mockTestContent, constants.VIRTUAL);
};

makeMocks();

const testee = require('../../lib/utils');


it.only('Should call npm link by exec and require module after', async () => {
    const result = await testee.linkAndRequire(testModule);
    expect(mockExec).toHaveBeenNthCalledWith(1, `npm link ${testModule}`,
        {'cwd': path.join(constants.CWD, 'lib')}, expect.any(Function));
    expect(result).toBe(mockTestContent);
});