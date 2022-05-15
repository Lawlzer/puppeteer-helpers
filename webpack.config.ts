import path from "path";
import { Configuration } from "webpack";

const config: Configuration = {
    target: 'node8.9',
    entry: './src/index.ts',
    output: {
        filename: 'webpacked.js',
        libraryTarget: 'commonjs2',
        // path: 'C:\\Users\\Kevin\\Desktop\\Nerd Stuff\\Games\\Screeps\\webpack\\temp',
        path: path.resolve('build'), //`path.resolve(__dirname, 'webpack')`,
    },
    optimization: {
        minimize: false,
    },
};


export default config;