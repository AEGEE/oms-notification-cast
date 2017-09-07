var restify = require('restify');

exports.exampleRequest = function (req, res, next) {
  res.json(req.user);  // Formatting into standartized api format happens automatically
  return next();
};
