const mongoose = require('mongoose');

const settingSchema = mongoose.Schema({
  category_code: {type: String, index: true},
  user_id: {type: String, index: true},
  enabled: mongoose.Schema.Types.Mixed
});

module.exports = mongoose.model('Setting', settingSchema);
