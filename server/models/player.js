const
  mongoose = require('.././helpers/mongoose.js'),
  Schema = mongoose.Schema;

const player = new Schema({
  id: {
    index: true,
    type: String,
    require: true
  },
  uid: {
    type: String,
    require: true
  },
  platform: {
    type: String,
    require: true
  },
  kisses: {
    type: Number,
    default: 0
  },
  cookies: {
    type: Number,
    default: 0
  },
  enters: {
    count: {
      type: Number,
      default: 0
    },
    last: {
      type: Date,
      default: Date.now
    }
  },
  tutorial: {
    type: Boolean,
    default: false
  },
  gifts: {
    send: {
      type: Number,
      default: 0
    },
    receive: {
      type: Number,
      default: 0
    }
  },
  rotates: {
    all: {
      type: Number,
      default: 0
    },
    manual: {
      type: Number,
      default: 0
    }
  },
  created: {
    type: Date,
    default: Date.now
  }
});

const info = new Schema({
  player: {
    index: true,
    type: String,
    require: true
  },
  uid: {
    type: String,
    require: true
  },
  platform: {
    type: String,
    require: true
  },
  gender: {
    type: String,
    require: true
  },
  photo:{
    type: String,
    require: true
  },
  name: {
    type: String,
    require: true
  },
  fullName: {
    type: String,
    require: true
  },
  bdate: {
    type: String,
  },
  timezone: {
    type: Number,
  },
  city: {
    type: String
  }
});

player.methods.gameEnter = async function() {
  try {
    this.enters.count++;
    this.enters.last = Date.now();

    return this.save();
  } catch(e) {
    console.log('Update Enter Game', e);
  }
};

info.methods.checkUpdate = async function(guest) {
  try {
    let update = false;

    if(this.photo !== guest.photo_200) {
      this.photo = guest.photo_200;
      update = true;
    }

    if(this.name !== guest.first_name) {
      this.name = guest.first_name;
      update = true;
    }

    if(this._fullName !== guest.first_name + ' ' + guest.last_name) {
      this._fullName = guest.first_name + ' ' + guest.last_name;
      update = true;
    }

    if(this.bdate !== guest.bdate) {
      this.bdate = guest.bdate;
      update = true;
    }

    if(guest.city && this.city !== guest.city.title) {
      this.city = guest.city.title;
      update = true;
    }

    if(this.timezone !== guest.timezone) {
      this.timezone = guest.timezone;
      update = true;
    }

    if(update) this.save();
  } catch(e) {
    console.log('Check update Info', e);
  }
};

exports.Player = mongoose.model('Player', player);
exports.Info = mongoose.model('PlayerInfo', info);