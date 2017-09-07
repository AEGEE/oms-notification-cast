var restify = require('restify');
const request = require('request');
const log = require('./config/log.js');
const config = require('./config/config.json');
const Setting = require('./models/Setting.js');
const Category = require('./models/Category.js');

exports.exampleRequest = function (req, res, next) {
  res.json({
   user: req.user,
   providers: req.providers
  });  // Formatting into standartized api format happens automatically
  return next();
};

// Checks if an incoming notification is valid
function validate_notification(n) {
  if(n.audience_type != 'user' && n.audience_type != 'circle' && n.audience_type != 'body' && n.audience_type != 'global' && n.audience_type != 'none')
    return "Invalid audience type";
  // TODO remove as soon as implemented
  if(n.audience_type == 'circle' || n.audience_type == 'body')
    return "Audience type not yet implemented";
  if(!n.audience_params && n.audience_type != 'global' && n.audience_type != 'none')
    return "You must supply at least one audience parameter";
  if(!n.service || !n.category || !n.category_name || !n.time || !n.heading || !n.body)
    return "You must fill all required fields";
  return null;
}

// Store the last notification in categories
function update_categories(category, category_name, service) {
  return new Promise((resolve, reject) => {
    var cat = new Category({
      name: category_name,
      code: category,
      service: service
    });
    cat.save((err) => {
      // Don't care for errors, could be a unique index validation
      resolve();
    });
  })
}

// expects a providers array with a backend and users field on each item
// dispatches the notification to whoever wants it
function dispatch_cast(providers, notification, token) {
  return new Promise((resolve, reject) => {
    var responses = providers.length;
    providers.forEach((provider) => {
      if(provider.users.length == 0){
        responses--;
        if(responses == 0) {
          resolve();
        }
        return;
      }
      notification.audience_type = 'user';
      notification.audience_params = provider.users;
      const options = {
        url: provider.backend + 'cast',
        method: 'POST',
        json: true,
        headers: {
          "x-auth-token": token
        },
        body: notification
      };
      request(options, (err, res, body) => {
        if(err) {
          log.error("Could not dispatch notification to " + provider.name, err);
        }

        responses--;
        if(responses == 0) {
          resolve();
        }
      })
    });
  });
}

// Takes a list of users and providers and based on settings adds or doesn't add each user to 
function settings_filter(users, providers, category) {
  return new Promise((resolve, reject) => {    
    providers.forEach((_item, index) => {
      providers[index].users = [];
    });
    // Sort for most effective searching
    users = users.sort((a, b) => {
      return a.localeCompare(b);
    });
    console.log("Querying settings");
    Setting.find({user_id: {$in: users}, category_code: category}).sort({user_id: 1}).exec((err, settings) => {
      if(err)
        return reject(err);

      var idx = 0;
      console.log("Merging settings ", settings);
      users.forEach((user) => {
        // Advance the cursor until we are at the current user (should happen max once)
        while(idx < settings.length && settings[idx].user_id.localeCompare(user) < 0) {
          idx++;
        }

        // Check if we have a setting for this user, if no just assume enabled for each service
        if(idx < settings.length && settings[idx].user_id == user) {
          // Users have to explicitely disable providers, otherwise enabled will be assumed
          cur_setting = settings[idx];
          providers.forEach((provider, index) => {
            if(!cur_setting.enabled.hasOwnProperty(provider.name) || cur_setting.enabled[provider.name])
              providers[index].users.push(user);
          })
        } else {
          providers.forEach((_i, index) => {
            providers[index].users.push(user);
          });
        }
      });
      resolve(providers);
    });
  });
}

function audience_users(audience_params) {
  return new Promise((resolve, reject) => {
    resolve(audience_params);
  });
}

function audience_global(token) {
  return new Promise((resolve, reject) => {
    request({
      url: config.core_url + '/api/users',
      method: 'GET',
      json: true,
      headers: {"x-auth-token": token},
      params: {
        per_page: 10000000  // TODO find a cleaner solution
      }
    }, (err, res, body) => {
      if(err)
        return reject(err);
      if(!body.success)
        return reject("Could not fetch users from core");
      resolve(body.data.map((user) => {return '' + user.id;}));
    });
  });
}

const cast = async function (req, res, next) {
  var errors = validate_notification(req.body);
  if(errors) {
    return next(new restify.UnprocessableEntityError(errors));
  }
  var notification = req.body;

  var getUsersPromise;
  switch(notification.audience_type){
    case 'global':
      getUsersPromise = audience_global(req.header('x-auth-token'));
      break;
    case 'user':
    default:
      getUsersPromise = audience_users(notification.audience_params);
      break;
  }

  try {
    var users = await getUsersPromise;
    console.log("-----users------");
    console.log(users);
    var providers = await settings_filter(users, req.providers, notification.category);
    console.log("-----providers------");
    console.log(providers);
    await dispatch_cast(providers, notification, req.header('x-auth-token'));
    console.log("Saving categories");
    await update_categories(notification.category, notification.category_name, notification.service);

    res.json({
      success: true,
      message: "Successfully dispatched message"
    });
    return next();
  } catch(err) {
    log.error(err);
    return next(restify.InternalServerError(err));
  }
}
exports.cast = cast;


const getCategories = function(req, res, next) {
  Category.find({}).sort({service: 1}).lean().exec((err, categories) => {

    requests = categories.length;
    if(requests == 0) {
      res.json([]);
      return next();
    }

    var default_setting = {};
    req.providers.forEach((provider) => {
      default_setting[provider.name] = true;
    })

    categories.forEach((category, index) => {
      Setting.findOne({user_id: req.user.id, category_code: category.code}, (err, user) => {
        if(err) {
          log.error(err);
        }
        if (user) {
          categories[index].enabled = user.enabled;
        } else {
          categories[index].enabled = default_setting;
        }

        requests--;
        if(requests == 0) {
          res.json(categories);
          return next();
        }
      })
    })
  });
}
exports.getCategories = getCategories;

const getProviders = function(req, res, next) {
  res.json(req.providers);
  return next();
}
exports.getProviders = getProviders;

const setSetting = function(req, res, next) {
  Setting.findOneAndUpdate(
    {user_id: req.user.id, category_code: req.params.code},
    {user_id: req.user.id, category_code: req.params.code, enabled: req.body.enabled},
    {upsert: true, new: true},
    (err, setting) => {
      if(err) {
        log.error(err);
        return next(new restify.InternalServerError(err));
      }
      res.json({
        success: true,
        data: setting,
        message: "Setting saved"
      });
      return next();
  });
}
exports.setSetting = setSetting;