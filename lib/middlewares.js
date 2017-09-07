const request = require('request');
const communication = require('./communication.js');
const config = require('./config/config.json');
const log = require('./config/log.js');
const restify = require('restify');

// Joins the results of other function calls
// Usage:
// app.use(middlewares.joinResults.bind(null, [middlewares.authenticateUser, middlewares.fetchUserDetails]));
exports.joinResults = function(function_arr, req, res, next) {
  if(!Array.isArray(function_arr))
    function_arr = [function_arr];

  Promise.all(function_arr.map((func) => {return func(req);})).then(() => {
    return next();
  }).catch((err) => {
    log.error(err);
    return next(err);
  })
};

var authCache = {};

// Returns a promise to authenticate a user
// Pass the x-auth-token header as a parameter
// It will add data to req.user.basic upon success
// On fail it will reject the promise
exports.authenticateUser = function(req) {
  var x_auth_token = req.header('x-auth-token');
  return new Promise((resolve, reject) => {
    if(!x_auth_token)
      return reject(new restify.UnauthorizedError('No auth token provided'));

    if(config.auth_caching) {
      // Delete invalid keys from authCache
      var invalid = [];
      for(var key in authCache) {
        if(!authCache.hasOwnProperty(key))
          continue;
        if(authCache[key].expires < Date.now())
          invalid.push(key);
      }

      invalid.forEach((key) => {delete authCache[key];});

      // If we can, serve from cache
      if(authCache[x_auth_token]) {
        req.user = authCache[x_auth_token].data;
        return resolve();
      }
    }

    // Query the core
    request({
      url: `${config.core_url}/api/tokens/user`,
      method: 'POST',
      headers: {
        "X-Auth-Token": x_auth_token
      },
      json: true,
      body: {
        token: x_auth_token,
      },
    }, function(err, res, body) {
      if(err) return reject(err);

      if (!body.success) {
        // We are not authenticated
        return reject(new restify.UnauthorizedError('User not authenticated'));
      }

      req.user = body.data;

      if(config.auth_caching) {
        authCache[x_auth_token] = {
          data: req.user,
          expires: Date.now() + config.auth_cache_expiration
        }
      }

      return resolve();
    });
  });
};

