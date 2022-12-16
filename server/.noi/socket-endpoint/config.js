const path = require('path');

module.exports = {
  params: {
    properties: {
      requestType: {
        description: 'Enter the message type for this endpoint (e.g. CreateProtocol)',
        required: true,
        pattern: /^[a-zA-Z][a-zA-Z0-9]*$/,
      },
      responseType: {
        description: 'Enter a response type for this endpoint (e.g. AllMeetingProtocols)',
        pattern: /^[a-zA-Z][a-zA-Z0-9]*$/,
      },
      dirName: {
        description: 'Endpoint directory (relative to "endpoints/")',
        required: false,
      },
    },
  },

  run({requestType, responseType, dirName}, noi) {
    const fileName = noi.changeCase.paramCase(requestType) + '-endpoint';
    const fnName = noi.changeCase.camelCase(requestType);
    const endpointDir = path.join(process.cwd(), 'endpoints', dirName);
    const socketDir = path.join(__dirname, '../../server-core/socket');
    const relativeSocketDir = path.relative(endpointDir, socketDir);
    const dataDir = path.join(__dirname, '../../data');
    const relativeDataDir = path.relative(endpointDir, dataDir);

    noi.dir(endpointDir); // Create the endpoint directory.

    // Create the endpoint file.
    noi.file(
      path.join(endpointDir, fileName + '.ts'),
      noi.template(`${__dirname}/endpoint.template.ts`, {relativeSocketDir, responseType})
    );

    // Create the test file.
    noi.file(
      path.join(endpointDir, fileName + '.test.ts'),
      noi.template(`${__dirname}/test.template.ts`, {requestType, responseType, fileName, fnName, relativeDataDir})
    );

    console.log('Remember to register the endpoint in socket-server-setup.ts');
  },
};
