# webpack 学习笔记系列06-打包优化

> Write By [CS逍遥剑仙](http://home.ustc.edu.cn/~cssjf/)   
> 我的主页: [csxiaoyao.com](https://csxiaoyao.com)   
> GitHub: [github.com/csxiaoyaojianxian](https://github.com/csxiaoyaojianxian)   
> Email: [sunjianfeng@csxiaoyao.com](mailto:sunjianfeng@csxiaoyao.com)  
> QQ: [1724338257](http://wpa.qq.com/msgrd?uin=1724338257&site=qq&menu=yes)

## 1. splitChunks 拆分代码

### 1.1 三种拆分方式

webpack 的三种代码拆分方式：

+ 多 `entry` 入口配置
+ 使用 `import()` 或 `require.ensure` 动态按需加载
+ webpack4 的 `splitChunks` 配置取代之前的 `CommonsChunkPlugin`

### 1.2 splitChunks 默认配置

`splitChunks` 默认配置对应上述的第二种按需加载方式：

```javascript
module.exports = {
    // ... 
    optimization: {
        splitChunks: {
            chunks: 'async', // initial|all|async(默认)
          	maxInitialRequests: 3, // 初始化最大文件数，优先级高于 cacheGroup，为 1 时不抽取 initial common
          	maxAsyncRequests: 5, // 按需加载最大异步请求数量，为 1 时不抽取公共 chunk
            maxSize: 0, // 文件最大尺寸，0不限制
          	minSize: 30000, // 文件最小尺寸，默认30K，development 下10k，与 chunk 数量成反比
            minChunks: 1, // 默认 1，被提取的模块至少要在几个 chunk 中被引用，值越大，抽取出的文件越小
            automaticNameDelimiter: '~', // 打包文件名分隔符
            name: true, // 拆分的文件名，默认 true 自动生成文件名，若设置为固定字符串，则所有 chunk 合并成一个
            cacheGroups: {
                vendors: {
                    test: /[\\/]node_modules[\\/]/, // 正则规则，如果符合就提取 chunk 
                    priority: -10 // 缓存组优先级，当一个模块可能属于多个 chunkGroup，这里是优先级 
                },
                default: {
                    minChunks: 2,
                    priority: -20, // 优先级 
                    reuseExistingChunk: true // 如果该chunk包含的modules都已经另一个被分割的chunk中存在，那么直接引用已存在的c hunk，不会再重新产生一个 
                }
            }
        }
    }
};
```

> 除 JavaScript， splitChunks 也适用于使用 mini-css-extract-plugin 插件的 css 配置

#### 1.2.1 chunks

可选值：`async`(默认) | `initial` | `all`(推荐)，针对下面的 `a.js` 和 `b.js`

```javascript
// a.js
import $ from 'jquery';
import react from 'react';
import( /* webpackChunkName: "a-lodash" */ 'lodash');

// b.js
import $ from 'jquery';
import( /* webpackChunkName: "b-react" */ 'react');
import( /* webpackChunkName: "b-lodash" */ 'lodash');
```

采用三种不同配置：

```javascript
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
module.exports = {
    mode: 'development',
    entry: {
        a: './a.js',
        b: './b.js'
    },
    plugins: [new BundleAnalyzerPlugin()],
    optimization: {
        splitChunks: {
            cacheGroups: {
                vendors: {
                    chunks: 'async', // async|initial|all 
                    test: /[\\/]node_modules[\\/]/
                }
            }
        }
    }
};
```

**async**: 只对动态引入的代码拆分

- `jquery` 分别打包进 `a.js` 和 `b.js`
- `react` 被打包进 `a.js` 和拆出 `venders~b-react.js`
- `lodash` 拆为同一个 `venders~a-lodash.js`

**initial**: 共用即拆(动态引入一定拆分)，根据阈值 `minChunks` 配置拆分

+ `jquery` 因共用被拆为 `vendors~a~b.js`
+ `react` 分别拆为 `vendors~a.js`(动态引入) 和 `b-react.js`(魔法注释)，注意：若 `minSize` 设置较大，不会单独拆出 `vendors~a.js`
+ `lodash` 拆为同一个 `a-lodash.js`(魔法注释)

**all**: 推荐，在 `initial` 基础上尽可能生成复用代码，如 `initial` 的 `react` 拆为同一个 `vendors~a~b-react.js`

#### 1.2.2 maxInitialRequests / maxAsyncRequests / maxSize / minSize

优先级：`maxInitialRequest` / `maxAsyncRequests` < `maxSize` < `minSize`

**maxInitialRequests**: 针对每个 entry 初始化的最大文件数，优先级高于 cacheGroup，因此为 1 时不会抽取 initial common

**maxAsyncRequests**: 每次按需加载最多有多少个异步请求，为 1 时不抽取公共 chunk

**maxSize**: 文件最大尺寸，0不限制

**minSize**: 文件最小尺寸，默认30K，development 下10k，与 chunk 数量成反比



> **webpack 魔法注释**
>
> ```javascript
> import(/* webpackChunkName: "react" */ 'react'); // 可以设置生成的 bundle 名称
> ```
>
> 使用 `webpack-bundle-analyzer` 插件查看打包情况
>
> ```javascript
> const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
> module.exports = {
>     mode: 'production',
>     entry: {
>         main: './default/index.js'
>     },
>     plugins: [new BundleAnalyzerPlugin()]
> };
> ```

### 1.3 cacheGroups 缓存组

**splitChunks 的配置项都是作用于 cacheGroup 上的**，默认有两个 cacheGroup：`vendors` 和 `default` (上节 splitChunks 默认配置)，支持重写，也支持设置为 false (splitChunks将失效)

cacheGroups 除拥有上节所有 splitChunks 默认配置，额外支持 `test` / `priority` / `reuseExistingChunk`

#### 1.3.1 reuseExistingChunk

是否使用已有的 chunk

#### 1.3.2 priority

权重，若一个模块满足多个缓存组条件，则按权重决定

#### 1.3.3 test

缓存组命中条件，取值为正则、字符串和函数

```javascript
cacheGroups: {
    vendors: {
      	// test: /[\\/]node_modules[\\/]/,
        test(module, chunks) {
            //...
            return module.type === 'javascript/auto'; 
        },
        priority: -20
    }
}
```

## 2. 构建速度优化

影响 webpack 构建速度的主要是：

+ loader/plugin 的构建过程
+ 压缩过程

可以从减少查找过程、多线程、提前编译和 Cache 多角度优化

### 2.1 减少查找过程

+ **resolve.alias**: 通过别名跳过耗时的递归模块解析操作

```javascript
module.exports = {
    resolve: {
        // 生产环境直接使用 react.min.js
        alias: {
            react: path.resolve(__dirname, './node_modules/react/dist/react.min.js'),
            '@lib': path.resolve(__dirname, './src/lib/')
        }
    }
};
```

+ **resolve.extensions**: 配置后缀顺序，减少模块导入时的推测

```javascript
resolve.extensions = ['js', 'json']
```

+ **module.noParse**: 排除不需要解析的模块

尤其是 jQuery 等未采用模块化标准且体积庞大的库，但要注意，排除的文件不能包含 `import`、`require`、`define` 等模块化语句。

+ **rule**: 通过 `test`、`include`、`exclude` 控制查找范围

```javascript
rules: [{
    loader: 'babel-loader',
    test: /\.js$/, // test 正则
    exclude: [path.resolve(__dirname, './node_modules')], // 排除绝对路径 Array
    include: [path.resolve(__dirname, './src')] // 查找绝对路径 Array
}];
```

`exclude` 优先级 > `include` / `test`，建议多用 include 避免用 exclude。

### 2.2 多线程

使用 `thread-loader`和 `HappyPack` 可以实现对大项目的多线程打包。

**thread-loader**: 将 loader 放在一个 worker 池中运行，以达到多线程构建

```javascript
module.exports = {
    module: {
        rules: [{
            test: /\.js$/,
            include: path.resolve('src'),
            use: [
            		'thread-loader', // 需要放在其他 loader 之前
                // 其他高开销 loader (e.g babel-loader)
            ]
        }]
    }
};
```

**HappyPack**: 通过多进程模型加速代码构建，但需要对应的 loader 支持

```javascript
const os = require('os');
const HappyPack = require('happypack');
// 根据 cpu 数量创建线程池 
const happyThreadPool = HappyPack.ThreadPool({
    size: os.cpus().length
});
module.exports = {
    module: {
        rules: [{
            test: /\.js$/,
            use: 'happypack/loader?id=jsx'
        }, {
            test: /\.less$/,
            use: 'happypack/loader?id=styles'
        }]
    },
    plugins: [
        new HappyPack({
            id: 'jsx',
            threads: happyThreadPool,
            loaders: ['babel-loader']
        }),
        new HappyPack({
            id: 'styles',
            threads: 2, // 自定义线程数量 
            loaders: ['style-loader', 'css-loader', 'less-loader']
        })
    ]
};
```

### 2.3 DllPlugin 预编译

预先编译打包一些不变化的库文件，在业务代码中直接引入。需要单独为 dll 文件创建一个配置文件，通过 **DLLPlugin** 插件将第三方依赖打包到 bundle 文件，并生成 `manifest.json` 文件，在项目的 webpack 配置文件中使用 **DllReferencePlugin** 插件解析 `manifest.json`，跳过 dll 中包含的依赖的打包。

```javascript
// 单独的 dll 打包配置文件 webpack.config.dll.js 
const webpack = require('webpack');
const vendors = ['react', 'react-dom']; // 第三方依赖库 
module.exports = {
    mode: 'production',
    entry: {
        vendor: vendors // 打包公共文件的入口文件设为 vendor.js
    },
    output: {
        filename: '[name].[chunkhash].js',
        library: '[name]_[chunkhash]' // 将 verdor 作为 library 导出，并指定全局变量名 [name]_[chunkhash]
    },
    plugins: [
      	new webpack.DllPlugin({
            path: 'manifest.json', // 设置 mainifest.json 路径
            name: '[name]_[chunkhash]',
            context: __dirname
    		})
    ]
};
```

执行 `webpack --config webpack.config.dll.js`

```javascript
// 项目配置文件 webpack.config.js 
const webpack = require('webpack');
module.exports = {
    output: {
        filename: '[name].[chunkhash].js'
    },
    entry: {
        app: './src/index.js'
    },
    plugins: [
      	new webpack.DllReferencePlugin({
            context: __dirname,
            manifest: require('./manifest.json') // 导入
    		})
    ]
};
```

注意：打包后的 html 中不会主动引入 dll 的 vendor.js 文件，需要手动处理。

### 2.4 cache 缓存

`babel-loader` 往往是编译过程中最耗时的环节，虽然提供了 `cacheDirectory` 配置指定缓存目录，但默认为 false 关闭，设为 true 则使用默认的缓存目录 `node_modules/.cache/babel-loader`

```javascript
rules: [{
    test: /\.js$/,
    loader: 'babel-loader',
    options: {
        cacheDirectory: true
    },
    exclude: /node_modules/,
    include: [path.resolve('.src')]
}];
```

### 2.5 其他

+ sourceMap 选择合适的 devtool 值
+ 切换更快的 loader

+ terser-webpack-plugin 开启多线程和缓存

```javascript
const TerserPlugin = require('terser-webpack-plugin');
module.exports = {
    optimization: {
        minimizer: [new TerserPlugin({
            cache: true, // 开启缓存
            parallel: true // 多线程
        })]
    }
};
```

## 3. Tree-Shaking

ES6 Modules 是 Tree-Shaking 静态分析的基础。Webpack 通过分析 ES6 模块的引入和使用情况，去除不使用的 import 引入；此外，可以借助工具如 `uglifyjs-webpack-plugin` 和 `terser-webpack-plugin` 进行删除(仅 mode=production 下生效)。树摇的实现需要保持良好的开发习惯：

1. 必须使用 ES6 模块
2. 按需引入，尤其是 UI 框架
3. 减少代码中的副作用(纯函数)

```json
// package.json
{
    "name": "tree-shaking-side-effect",
    "sideEffects": ["./src/utils.js"]
}
```

在 `package.json 中`，除了通过 `sideEffects` 指定有副作用的文件，若能确保没有副作用，可以设置 `sideEffects: false` 不再考虑副作用。



![sign](https://raw.githubusercontent.com/csxiaoyaojianxian/ImageHosting/master/img/sign.jpg)