const mongoose = require('mongoose');

const categorySchema = mongoose.Schema({
  name: String,
  code: {type: String, index: true, unique: true}
});

module.exports = mongoose.model('Category', categorySchema);
