var webpack = require('webpack');
module.exports = {
    entry: {
        app: ['webpack/hot/dev-server', './src/Application.jsx']
    },
    output: {
  		path: __dirname + "/public/built",
  		filename: "bundle.js"
  	},
    devtool: 'source-map',
    devServer: {
        contentBase: './public',
        publicPath: 'http://localhost:8080/built/'
    },
    module: {
        loaders: [
            {
                test: /\.jsx?$/, // Match both .js and .jsx files
                exclude: /node_modules/,
                loader: "babel-loader",
                query: {
                    presets: ['es2015', 'stage-0', 'react']
                }
            }, {
                test: /\.css$/,
                loader: 'style-loader!css-loader'
            }, {
                test: /\.less$/,
                loader: 'style-loader!css-loader!less-loader'
            }
        ]
    },
    plugins: [new webpack.HotModuleReplacementPlugin()]
}
