const
  path = require('path'),
  fs = require('fs'),
  _path = path.join(__dirname, '/'),
  chokidar = require('chokidar'),
  less = require('less'),
  getNormalDate = require('./server/helpers/date.js').normalize;

const watched = [
  './client-source/less/common/*.less'
];

chokidar.watch(watched, {ignored: /[\/\\]\./}).on('all', (event, path_) =>{
  let source, pathOut, fileName, date, time;

  if(event === "change" || event === "add"){
    date = new Date().getTime();
    fileName = /common\\(.+)\.less/.exec(path_)[1] + '.css';

    path_ = path.join(_path + path_);
    pathOut = path.join(_path + '/public/css/' + fileName);
    source = fs.readFileSync(path_, 'utf8');

    less.render(source, function(err, output){
      if(err) throw new Error(err);
      fs.writeFileSync(pathOut, output.css);

      time = (new Date().getTime() - date) / 1000;
      time = time.toFixed(2);
      date = getNormalDate(date, true);

      console.log("[" + date + "] Compiled to " + fileName + ' in ' + time + ' s [' +  event + ']');
    });
  }
});
