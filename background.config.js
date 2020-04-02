const path = require("path");

const config = {
  entry: "./src/background/background.js",
  devtool: 'source-map',
  output: {
    path: path.resolve(__dirname, "build/static/js/"),
    filename: "background.js"
  },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"]
          }
        }
      }
    ]
  }
};

module.exports = config;
