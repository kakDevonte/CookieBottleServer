const
    mongoose = require('.././helpers/mongoose.js'),
    Schema = mongoose.Schema;

const order = new Schema({
    if: {
        index: true,
        type: Number,
    },
    user_id: {
        index: true,
        type: Number,
    },
    payment_id: {
        index: true,
        type: Number,
    },
    price: {
        index: true,
        type: Number,
    },
    count: {
        index: true,
        type: Number,
    },
});
exports.Order = mongoose.model('Order', order);