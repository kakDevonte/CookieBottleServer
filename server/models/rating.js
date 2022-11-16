const
  mongoose = require('.././helpers/mongoose.js'),
  Schema = mongoose.Schema;

const schema = {
  player: {
    index: true,
    type: String,
    require: true
  },
  kisses: {
    type: Number,
    require: true
  },
  gifts: {
    type: Number,
    require: true
  },
  created: {
    type: Date,
    default: Date.now
  }
};

const daySchema = Object.assign({
  day: {
    type: Number,
    require: true,
    index: true
  }
}, schema);

const weekSchema = Object.assign({
  week: {
    type: Number,
    require: true,
    index: true
  }
}, schema);

const monthSchema = Object.assign({
  month: {
    type: Number,
    require: true,
    index: true
  }
}, schema);

const dayRating = new Schema(daySchema);
const weekRating = new Schema(weekSchema);
const monthRating = new Schema(monthSchema);

exports.DayRating = mongoose.model('DayRating', dayRating);
exports.WeekRating = mongoose.model('WeekRating', weekRating);
exports.MonthRating = mongoose.model('MonthRating', monthRating);