const
    mongoose = require('.././helpers/mongoose.js'),
    Schema = mongoose.Schema;

const token = new Schema({
        id: {
            index: true,
            type: String,
        },
        token: {
            index: true,
            type: String
        },
        // createdAt: {
        //     type: Date,
        //     default: Date.now,
        //     expires: 30
        // },

        // expire_at: {
        //     type: Date,
        //     default: Date.now(),
        //     expires: 60
        // }
    },
    // expire_at: {type: Date, default: Date.now, expires: 1120}
    { timestamps: true }
);
token.index( { "createdAt": 1 }, { expireAfterSeconds: 7200 } )
// token.index({ "expire_at": 1 }, { expireAfterSeconds: 5 });
exports.Token = mongoose.model('Token', token);