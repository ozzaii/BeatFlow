/**
 * @file webpack.config.js
 * @description Optimized build configuration for high-performance audio processing
 * Features:
 * - WebAssembly optimization
 * - Worker bundling
 * - Code splitting
 * - Tree shaking
 * - Asset optimization
 */

const path = require('path')
const webpack = require('webpack')
const WorkerPlugin = require('worker-plugin')
const WasmPackPlugin = require('@wasm-tool/wasm-pack-plugin')
const TerserPlugin = require('terser-webpack-plugin')
const CompressionPlugin = require('compression-webpack-plugin')
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')

module.exports = {
  entry: {
    main: './src/index.js',
    'audio-worker': './src/workers/audio-worker.js',
  },

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash].js',
    publicPath: '/',
    // Enable WebAssembly
    webassemblyModuleFilename: 'wasm/[hash].wasm',
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
            // Get package name
            const packageName = module.context.match(
              /[\\/]node_modules[\\/](.*?)([\\/]|$)/
            )[1]
            // Remove @ from scope packages
            return `vendor.${packageName.replace('@', '')}`
          },
        },
        // Separate chunk for WebAssembly
        wasm: {
          test: /\.wasm$/,
          type: 'javascript/auto',
          name: 'wasm',
        },
      },
    },
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          parse: {
            // Parse ecma 8
            ecma: 8,
          },
          compress: {
            ecma: 5,
            warnings: false,
            comparisons: false,
            inline: 2,
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

  // Module rules
  module: {
    rules: [
      // JavaScript
      {
        test: /\.(js|jsx)$/,
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
        test: /\.worker\.js$/,
        use: { loader: 'worker-loader' },
      },
    ],
  },

  // Plugins
  plugins: [
    // Enable WebAssembly
    new webpack.experiments.AsyncWebAssembly(),
    
    // Build WebAssembly
    new WasmPackPlugin({
      crateDirectory: path.resolve(__dirname, '../wasm'),
      outDir: path.resolve(__dirname, 'dist/wasm'),
      extraArgs: '--target web',
      forceMode: 'production',
    }),

    // Worker support
    new WorkerPlugin({
      globalObject: 'self',
    }),

    // Environment variables
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
      'process.env.REACT_APP_WS_URL': JSON.stringify(process.env.REACT_APP_WS_URL),
    }),

    // Compression
    new CompressionPlugin({
      algorithm: 'gzip',
      test: /\.(js|css|html|svg|wasm)$/,
      threshold: 10240,
      minRatio: 0.8,
    }),

    // Bundle analysis
    process.env.ANALYZE && new BundleAnalyzerPlugin(),
  ].filter(Boolean),

  // Development settings
  devServer: {
    contentBase: path.join(__dirname, 'dist'),
    compress: true,
    port: 3000,
    hot: true,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },

  // Resolve
  resolve: {
    extensions: ['.js', '.jsx', '.wasm'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@services': path.resolve(__dirname, 'src/services'),
      '@hooks': path.resolve(__dirname, 'src/hooks'),
      '@wasm': path.resolve(__dirname, 'src/wasm'),
    },
  },

  // Performance hints
  performance: {
    hints: 'warning',
    maxEntrypointSize: 512000,
    maxAssetSize: 512000,
  },

  // Enable source maps for development
  devtool: process.env.NODE_ENV === 'development' ? 'eval-source-map' : false,

  // Stats configuration
  stats: {
    colors: true,
    modules: false,
    children: false,
    chunks: false,
    chunkModules: false,
  },
} 