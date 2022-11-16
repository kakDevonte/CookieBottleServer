const
  path = require('path'),
  fs = require('fs'),
  MiniCssExtractPlugin = require('mini-css-extract-plugin'),
  HTMLWebpackPlugin = require('html-webpack-plugin');

const setups = {
  entry: {},
  plugins: [],
  errors: []
};

function generateEntryPointsAndPlugins(side){
  fs.readdirSync(path.join(__dirname, '/client-source/js/' + side)).forEach(function(file){
    const filenameJS = side + '-' + file.split('.js')[0];
    const fileHBS = filenameJS + '.hbs';
    const chunk = filenameJS;
    const template = `./client-source/views/layouts/layout.hbs`;

    setups.entry[chunk] = `./client-source/js/${side}/${file}`;

    setups.plugins.push(
      new HTMLWebpackPlugin({
        //minify: true,
        chunks: [chunk],
        template: template,
        filename: `/layouts/${fileHBS}`
      })
    );
  });
}

setups.plugins.push(
  new MiniCssExtractPlugin({
    filename: '[name].css',
    chunkFilename: '[id].css'
    // moduleFilename: function({name}){
    //   // //const filename = `${name.replace('js/', 'css/')}.css`;
    //   //
    //   // console.log("Name: ", name);
    //   //
    //   // return name;
    // }
  })
);

generateEntryPointsAndPlugins('client');
generateEntryPointsAndPlugins('control');

module.exports = {
  mode: 'development',
  entry: setups.entry,
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'public/content'),
    publicPath: '/public/content'
  },
  plugins: setups.plugins,
  module: {
    rules: [
      {
        test: /\.html$/i,
        use: 'raw-loader',
      },
      {
        test: /\.less$/,
        use:[
          // {
          //   loader: 'file-loader',
          //   options: {
          //     name: '[name].css',
          //     //context: './',
          //     outputPath: '/css/',
          //     publicPath: '/public'
          //   }
          // },
          // {loader: 'extract-loader'},
          {loader: MiniCssExtractPlugin.loader},
          {loader: 'css-loader', options: {url: false}},
          {loader: 'less-loader'}
        ]
      },
    ]
  },
  optimization: {
    splitChunks: {
      chunks: 'all'
    }
  }
};

if(setups.errors.length){
  setTimeout(function(){
    console.log('\n');
    console.log(setups.errors.join('\n'));
  }, 2000);
}