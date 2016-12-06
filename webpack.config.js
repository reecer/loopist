var webpack = require('webpack');

module.exports = {
    entry: {
      main: "./src/index.tsx",
      vendors: ['react', 'react-dom', 'redux', 'react-redux', 'react-fa']
    },
    
    output: {
        path: "./dist/",
        publicPath: "/dist/",
        filename: "[name].js",
    },

    // Enable sourcemaps for debugging webpack's output.
    devtool: "source-map",

    resolve: {
        // Add '.ts' and '.tsx' as resolvable extensions.
        extensions: ["", ".webpack.js", ".web.js", ".ts", ".tsx", ".js"],
        moduleDirectories: ['node_modules']
    },
    
    plugins: [
        new webpack.optimize.CommonsChunkPlugin('vendors', 'shared.js'),
        new webpack.optimize.DedupePlugin()
    ],

    module: {
        loaders: [
            // All files with a '.ts' or '.tsx' extension will be handled by 'ts-loader'.
            { test: /\.tsx?$/, loader: "ts-loader", exclude: ['node_modules'] },
            { test: /\.scss$/, loader: "style!css!sass" },
            { test: /\.css$/, loader: "style!css" },
            { test: /\.(woff|ttf|eot|svg|png)(\?.*)?/, loader: "url-loader" }
        ],

        // preLoaders: [
        //     // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
        //     { test: /\.js$/, loader: "source-map-loader" }
        // ]
    },
};