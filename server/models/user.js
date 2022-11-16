const
  crypto = require('crypto'),
  mongoose = require('.././helpers/mongoose.js'),
  Schema = mongoose.Schema;

var schema = new Schema({
  login: {
    type: String,
    unique: true,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  created: {
    type: Date,
    default: Date.now
  },
  salt: {
    type: Number,
    required: true
  },
  md5: {
    type: String,
    required: true
  }
});

schema.methods.encryptPassword = function(password){
  return crypto.createHash('md5').update(this.salt + password).digest("hex");
};

schema.methods.checkPassword = function(password){
  return this.encryptPassword(password) === this.md5;
};

schema.virtual('password')
  .set(function(password){
    this.salt = Date.now();
    this.md5 = this.encryptPassword(password);
  });

exports.User = mongoose.model('User', schema);

