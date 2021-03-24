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
+ 压缩

可以从减少查找过程、多线程、提前编译和 Cache 多角度优化







































![sign](https://raw.githubusercontent.com/csxiaoyaojianxian/ImageHosting/master/img/sign.jpg)