var restify = require('restify');

exports.exampleRequest = function (req, res, next) {
  res.json({
   user: req.user,
   providers: req.providers
  });  // Formatting into standartized api format happens automatically
  return next();
};
