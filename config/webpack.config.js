const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const WorkerPlugin = require('worker-plugin');
const WasmPackPlugin = require('@wasm-tool/wasm-pack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

const isProduction = process.env.NODE_ENV === 'production';
const isGitHubPages = true; // Always build for GitHub Pages

module.exports = {
  entry: {
    main: './src/index.js',
    'audio-worker': './src/workers/audio-worker.js',
  },

  output: {
    path: path.resolve(__dirname, '../build'), // Changed from dist to build
    filename: '[name].[contenthash].js',
    publicPath: '/beatflow/',
    webassemblyModuleFilename: 'wasm/[hash].wasm',
    clean: true,
  },

  // Optimize chunks
  optimization: {
    moduleIds: 'deterministic',
    runtimeChunk: 'single',
    splitChunks: {
      chunks: 'all',
      maxInitialRequests: Infinity,
      minSize: 0,
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name(module) {
            const packageName = module.context.match(
              /[\\/]node_modules[\\/](.*?)([\\/]|$)/
            )[1];
            return `vendor.${packageName.replace('@', '')}`;
          },
        },
        wasm: {
          test: /\.wasm$/,
          type: 'javascript/auto',
          name: 'wasm',
        },
      },
    },
    minimize: isProduction,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          parse: {
            ecma: 8,
          },
          compress: {
            ecma: 5,
            warnings: false,
            comparisons: false,
            inline: 2,
            drop_console: isProduction,
          },
          mangle: {
            safari10: true,
          },
          output: {
            ecma: 5,
            comments: false,
            ascii_only: true,
          },
        },
        parallel: true,
      }),
    ],
  },

  module: {
    rules: [
      // JavaScript/TypeScript
      {
        test: /\.(js|jsx|ts|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', {
                targets: {
                  browsers: ['last 2 versions', 'not dead'],
                },
                useBuiltIns: 'usage',
                corejs: 3,
                modules: false,
              }],
              '@babel/preset-react',
              '@babel/preset-typescript',
            ],
            plugins: [
              '@babel/plugin-proposal-class-properties',
              '@babel/plugin-transform-runtime',
            ],
          },
        },
      },
      // WebAssembly
      {
        test: /\.wasm$/,
        type: 'webassembly/async',
      },
      // Workers
      {
        test: /\.worker\.(js|ts)$/,
        use: { loader: 'worker-loader' },
      },
      // Styles
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      // Assets
      {
        test: /\.(png|svg|jpg|jpeg|gif|ico)$/i,
        type: 'asset/resource',
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
      },
      // Audio files
      {
        test: /\.(mp3|wav|ogg)$/i,
        type: 'asset/resource',
      },
    ],
  },

  plugins: [
    // Enable WebAssembly
    new webpack.experiments.AsyncWebAssembly(),
    
    // Build WebAssembly
    new WasmPackPlugin({
      crateDirectory: path.resolve(__dirname, '../wasm'),
      outDir: path.resolve(__dirname, '../dist/wasm'),
      extraArgs: '--target web',
      forceMode: isProduction ? 'production' : 'development',
    }),

    // Worker support
    new WorkerPlugin({
      globalObject: 'self',
    }),

    // HTML template
    new HtmlWebpackPlugin({
      template: 'public/index.html',
      filename: 'index.html',
      inject: true,
      favicon: 'public/favicon.ico',
      meta: {
        'theme-color': '#000000',
        'description': 'BeatFlow - Next-gen social beat making platform',
        'og:title': 'BeatFlow',
        'og:description': 'Create, collaborate, and compete in beat battles',
        'og:type': 'website',
        'og:image': 'public/og-image.jpg',
      },
      minify: isProduction ? {
        removeComments: true,
        collapseWhitespace: true,
        removeRedundantAttributes: true,
        useShortDoctype: true,
        removeEmptyAttributes: true,
        removeStyleLinkTypeAttributes: true,
        keepClosingSlash: true,
        minifyJS: true,
        minifyCSS: true,
        minifyURLs: true,
      } : false,
    }),

    // Environment variables
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
      'process.env.PUBLIC_URL': JSON.stringify('/beatflow'),
      'process.env.REACT_APP_VERSION': JSON.stringify(process.env.npm_package_version),
      'process.env.REACT_APP_BASE_PATH': JSON.stringify('/beatflow'),
    }),

    // Compression
    isProduction && new CompressionPlugin({
      algorithm: 'gzip',
      test: /\.(js|css|html|svg|wasm)$/,
      threshold: 10240,
      minRatio: 0.8,
    }),

    // Bundle analysis
    process.env.ANALYZE && new BundleAnalyzerPlugin(),
  ].filter(Boolean),

  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.wasm'],
    alias: {
      '@': path.resolve(__dirname, '../src'),
      '@components': path.resolve(__dirname, '../src/components'),
      '@services': path.resolve(__dirname, '../src/services'),
      '@hooks': path.resolve(__dirname, '../src/hooks'),
      '@wasm': path.resolve(__dirname, '../src/wasm'),
    },
  },

  devServer: {
    historyApiFallback: {
      rewrites: [
        { from: /^\/beatflow\/.*$/, to: '/beatflow/index.html' },
      ],
    },
    hot: true,
    compress: true,
    port: 3000,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
    static: {
      directory: path.join(__dirname, '../public'),
      publicPath: '/beatflow/',
    },
  },

  // Performance hints
  performance: {
    hints: isProduction ? 'warning' : false,
    maxEntrypointSize: 512000,
    maxAssetSize: 512000,
  },

  // Enable source maps for development
  devtool: isProduction ? false : 'eval-source-map',

  // Stats configuration
  stats: {
    colors: true,
    modules: false,
    children: false,
    chunks: false,
    chunkModules: false,
  },
}; 