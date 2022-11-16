const
  mongoose = require('.././helpers/mongoose.js'),
  Schema = mongoose.Schema;

const gifts = new Schema({
  owner: {
    index: true,
    type: String,
    require: true
  }
});