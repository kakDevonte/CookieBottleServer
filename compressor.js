const
  path = require('path'),
  fs = require('fs'),
  _path = path.join(__dirname, '/');

compress('client-source/views', 'client-source/views-compressed');

function compress(directory, out){
  let str;

  fs.readdirSync(path.join(_path, directory)).forEach(function(file){
    let pt = directory + '/' + file;
    let po = out + '/' + file;
    let pathTarget = path.join(_path, pt);
    let pathOut = path.join(_path, po);

    if(!/\./.test(file)){
      if(!fs.existsSync(pathOut)) fs.mkdirSync(pathOut);
      compress(pt, po);
    }else{
      str = fs.readFileSync(pathTarget, 'utf8');
      str = str.replace(/  +|\r\n/g, '');
      fs.writeFileSync(pathOut, str);
      console.log(`Compressed: ${po}`);
    }
  });
}