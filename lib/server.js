const restify = require('restify');
const middlewares = require('./middlewares.js');
const application = require('./application.js');
const restifyBunyanLogger = require('restify-bunyan-logger');
const log = require('./config/log.js');
const config = require('./config/config.json');
const stringify = require('json-stringify-safe');

// Create the server
server = restify.createServer({
  formatters: {
    // Format according to the specified standart
    'application/json': function (req, res, body, cb) {
      var success = true;
      if(body instanceof Error) {
        success = false;
        res.statusCode = body.statusCode || 500;
        body = {
          success: false,
          message: body.message || 'Something went wrong',
          data: body
        };
      }

      if(!body.hasOwnProperty('success')) {
        body = {
          success: success,
          data: body
        };
      }

      // Copied from restify/lib/formatters/json.js
      var data = (body) ? stringify(body) : 'null';
      res.setHeader('Content-Length', Buffer.byteLength(data));

      return cb(null, data);
    } 
  }
});
// Add request logging 
server.on('after', restifyBunyanLogger({
  skip: function(req, res) {
    return req.method === "OPTIONS";
  },
  logger: log
}));


server.use(restify.queryParser());
server.use(restify.jsonBodyParser());

// Prepare middlewares
const auth = middlewares.joinResults.bind(null, [middlewares.authenticateUser]);


server.get('/test', [auth, application.exampleRequest]);
server.get('/status', (req, res, next) => {
  res.json({success: true});
  return next();
})


server.listen(process.env.PORT || config.port, function () { // bind server to port 8085.
  console.log('%s listening at %s', server.name, server.url);
});