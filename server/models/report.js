const
    mongoose = require('.././helpers/mongoose.js'),
    Schema = mongoose.Schema;

const report = new Schema({
    to: {
        index: true,
        type: String,
    },
    id: {
        index: true,
        type: String,
    },
    text: {
        index: true,
        type: String,
    },
    date: {
        index: true,
        type: Number,
    },
    cause: {
        index: true,
        type: String,
    },
});

exports.Report = mongoose.model('Report', report);