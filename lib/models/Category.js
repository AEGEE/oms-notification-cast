const mongoose = require('mongoose');

const categorySchema = mongoose.Schema({
  name: String,
  code: {type: String, index: true, unique: true},
  service: String
});

module.exports = mongoose.model('Category', categorySchema);
