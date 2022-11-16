const
  mongoose = require('mongoose'),
  config = {
  uri: process.env.NODE_ENV === 'production' ? process.env.MONGODB_URI : process.env.MONGODB_URI_DEV,
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false
  }
};

connect(0);


async function connect(counter){
  try{
    console.log("Try connect to BD");
    await mongoose.connect(config.uri, config.options);
  }catch(e){
    console.log(e);

    if(counter < 30){
      counter++;
      setTimeout(function(){
        connect(counter);
      }, 10000);
    }
  }
}

module.exports = mongoose;