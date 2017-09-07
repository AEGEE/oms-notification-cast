const request = require('request');
const config = require('./config/config.json');
const log = require('./config/log.js');

var namecache = {};
var catcache = {};

exports.getServiceByName = function(name, token, callback) {
  // If we already fetched that name, just return it as it is not going to change quickly
  if(namecache.hasOwnProperty(name))
    return callback(null, namecache[name]);

  // Right after startup we will have to query the registry for the data
  var options = {
    url: `${config.registry_url}/service/${name}`,
    json: true,
    headers: {
      "X-Auth-Token": token
    }
  }

  request(options, function(err, res, body) {
    if(err)
      return callback(err, null);

    if(!body.success)
      return callback(new Error('Error when looking up service, registry replied: ' + body.message), null);

    namecache[name] = body.data;
    return callback(null, body.data);
  });
};

exports.getServiceByCategory = function(category, token, callback) {
  // Also the categories are cachable for quite some time
  if(catcache.hasOwnProperty(category))
    return callback(null, catcache[category]);

  // We have to query the registry
  var options = {
    url: `${config.registry_url}/category/${category}`,
    json: true,
    headers: {
      "X-Auth-Token": token
    }
  }

  request(options, function(err, res, body) {
    if(err)
      return callback(err, null);

    if(!body.success)
      return callback(new Error('Error when looking up category, registry replied: ' + body.message), null);

    catcache[category] = body.data;
    return callback(null, body.data);
  });
};
