const bunyan = require('bunyan');

module.exports = bunyan.createLogger({
    name: 'oms-applications',
    streams: [
      {
        stream: process.stdout,
        level: 'debug',
      },
    ],
    serializers: {
      err: bunyan.stdSerializers.err,
      req: bunyan.stdSerializers.req,
      res: bunyan.stdSerializers.res,
    },
    src: true,
});

