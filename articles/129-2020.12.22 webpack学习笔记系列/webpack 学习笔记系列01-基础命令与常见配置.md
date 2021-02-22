# webpack 学习笔记系列01-基础命令与常见配置

> Write By [CS逍遥剑仙](http://home.ustc.edu.cn/~cssjf/)   
> 我的主页: [csxiaoyao.com](https://csxiaoyao.com)   
> GitHub: [github.com/csxiaoyaojianxian](https://github.com/csxiaoyaojianxian)   
> Email: [sunjianfeng@csxiaoyao.com](mailto:sunjianfeng@csxiaoyao.com)  
> QQ: [1724338257](http://wpa.qq.com/msgrd?uin=1724338257&site=qq&menu=yes)

## 1. webpack 命令

`webpack` 命令可以在 `package.json` 中的 `script` 字段中添加命令，再使用 `npm` 执行：

```javascript
"scripts": { 
    "dev": "webpack --mode development ./src/es/index.js --module-bind js=babel-loader", 
    "build": "webpack --mode production ./src/es/index.js --module-bind js=babel-loader" 
}
```

webpack-cli 命令的选项比较多，详细可以通过 [webpack-cli](https://webpack.js.org/api/cli/) 的文档进行查阅，常用的有：

**--config**：指定 webpack 配置文件的路径

**--mode**：指定打包环境 development / production

**--json**：输出打包结果，可用 `webpack --json > stats.json` 将打包结果输出到指定文件 

**--watch, -w**：watch 模式打包，监控文件变化

**--hot**：开启 Hot Module Replacement 模式 

**--progress**：显示打包进度

**--color / --no-color**：开启/关闭控制台输出内容的颜色

**--profile**：详细输出每个环节的用时，方便排查打包速度瓶颈

## 2. webpack 配置基础

### 2.1 常见概念

`webpack` 是一个模块打包工具，能够从一个 `JavaScript` 文件开始，构建一个依赖关系图（**dependency graph**）映射项目中每个模块，然后将这个依赖关系图输出到一个或者多个 `bundle` 中。`webpack.config.js` 配置中的一些概念：

**module**：每个文件都可以看做模块，模块不局限于 js，也包含 css、图片等

**chunk**：代码块，一个 chunk 可以由多个模块 module 组成

**bundle**：最终打包生成的文件，一般和 chunk 对应，是对 chunk 进行压缩打包等处理后的产出

**loader**：模块 module 源代码的处理器，对模块进行转换处理

**plugin**：扩展插件可以处理 chunk 或 bundle，可以完成 loader 不能完成的任务

### 2.2 占位符

#### 2.2.1 常见占位符

webpack 支持占位符，可灵活用于后面介绍的配置中，常见的有：

**[hash]**：模块 module 标识符的 hash

**[chunkhash]**：代码块 chunk 内容的 hash

**[name]**：模块名称

**[id]**：模块标识符

**[query]**：模块的 query，如文件名 ? 后的字符串

**[function]**：一个能 return 出一个 string 作为 filename 的函数

#### 2.2.2 三种 hash 对比

关于 hash 和 chunkhash，二者都可以指定长度，如 [hash:16]（默认20），区别在于：

**[hash]** 每次编译 Compilation 对象的 hash，在整个项目全局唯一，跟单次编译有关，跟单个文件无关，每次修改任何文件编译都会生成新的 hash，因此无法实现前端静态资源在浏览器上的长缓存，不推荐；

**[chunkhash]** chunk 的 hash，根据不同的入口文件 entry 进行依赖文件解析，构建对应的 chunk 生成相应的 hash，chunk 中包含的任意模块发生变化，则 chunkhash 发生变化，对于变动较少的公共库代码，使用 chunkhash 可以发挥最长缓存的作用，推荐使用；

**[contenthash]** CSS 文件特有的 hash 值，使用 chunkhash 存在一个问题，当一个 JS 文件中引入了 CSS 文件，编译后它们的 hash 是相同的，只要 JS 文件内容发生改变，与其关联的 CSS 文件 hash 也会改变，针对这种情况，可以把 CSS 从 JS 中使用 mini-css-extract-plugin 或 extract-text-webpack-plugin 插件抽离出来并使用 contenthash，CSS 发生变化则 contenthash 值发生变化，推荐 css 导出中使用。

## 3. webpack 常见配置项

### 3.1 entry 入口配置

entry 入口支持多种类型：`字符串`、`对象`、`数组`。

#### 3.1.1 单文件入口

```javascript
module.exports = {
    // context 上下文在实际开发中一般不需要配置，默认为 process.cwd() 工作目录，必须是一个绝对路径，代表项目的相对路径上下文
    context: '/Users/test/webpack',

    // 字符串，直接把该 string 指定的模块（文件）作为入口模块
    entry: 'path/to/my/entry/file.js',
    // 对象
    entry: {
        main: 'path/to/my/entry/file.js'
    },
    // 数组，实际只有一个入口，会自动生成另外一个入口模块并加载数组指定的模块
    entry: ['./src/app.js', './src/home.js'],
};
```

#### 3.1.1 多文件入口

相对于单文件入口，具有较高的灵活性，例如多页应用、页面模块分离优化等。

```javascript
module.exports = {
    entry: {
        home: 'path/to/my/entry/home.js',
        search: 'path/to/my/entry/search.js',
        list: 'path/to/my/entry/list.js'
    }
};
```

### 3.2 output 出口配置

#### 3.2.1 核心属性

output 出口指定了 entry 对应文件编译打包后的输出 bundle。一个 webpack 的配置，可以包含多个 entry，但是只能有一个 output，但可以通过 name 占位符语法来区分：

```javascript
module.exports = {
    entry: {
        home: 'path/to/my/entry/home.js',
        search: 'path/to/my/entry/search.js',
        list: 'path/to/my/entry/list.js'
    },
    output: {
        // 输出 bundle 的名称
        filename: '[name].js',
        // 输出 bundle 的存放路径
        path: __dirname + '/dist',
        // 指定在浏览器中引用地址，如静态资源CDN等
        publicPath: '/assets/'
    }
};
```

当不指定 output 时，默认输出到 dist/main.js ，即 output.path 是 dist ， output.filename 是 main 。

#### 3.2.2 output.library 输出为库

可以使用 output.library 生成库供第三方使用。

```javascript
module.exports = {
    output: {
        library: 'myLib' // 也可使用占位符，如 '[name]'
    }
};
```

#### 3.2.3 output.libraryTarget 输出规范对比

使用 output.libraryTarget 可指定库打包出来的规范，可选值有：`var`、`assign`、`this`、`window`、`global`、`commonjs`、`commonjs2`、`commonjs-module`、`amd`、`umd`、`umd2`、`jsonp` ，默认是 `var`，libraryTarget = global 时，如果 target = node 才是 global，默认 target = web 下 global 为

window，保险起见可以使用 this 。

```javascript
module.exports = {
    output: {
        library: 'myLib' // 也可使用占位符，如 '[name]',
        filename: 'var.js',
        libraryTarget: 'var'
    }
};
```

下面是各种规范打包后的代码：

```javascript
// var
var myLib = (function(modules) {})({
    './src/index.js': function(module, exports) {}
});

// assign，相比var规范，缺少一个var
myLib = (function(modules) {})({
    './src/index.js': function(module, exports) {}
});

// this
this["myLib"] = (function(modules) {})({
    './src/index.js': function(module, exports) {}
});

// window，target=web
window["myLib"] = (function(modules) {})({
    './src/index.js': function(module, exports) {}
});

// global，target=node
global["myLib"] = (function(modules) {})({
    './src/index.js': function(module, exports) {}
});

// commonjs
exports["myLib"] = (function(modules) {})({
    './src/index.js': function(module, exports) {}
});

// commonjs2 / commonjs-module
module.exports = (function(modules) {})({
    './src/index.js': function(module, exports) {}
});

// amd
define('myLib', [], function() {
    return (function(modules) {})({
        './src/index.js': function(module, exports) {}
    });
});

// umd
(function webpackUniversalModuleDefinition(root, factory) {
    if (typeof exports === 'object' && typeof module === 'object') module.exports = factory();
    else if (typeof define === 'function' && define.amd) define([], factory);
    else if (typeof exports === 'object') exports['myLib'] = factory();
    else root['myLib'] = factory();
})(window, function() {
    return (function(modules) {})({
        './src/index.js': function(module, exports) {}
    });
});

// umd2
(function webpackUniversalModuleDefinition(root, factory) {
    if (typeof exports === 'object' && typeof module === 'object') module.exports = factory();
    else if (typeof define === 'function' && define.amd) define([], factory);
    else if (typeof exports === 'object') exports['myLib'] = factory();
    else root['myLib'] = factory();
})(window, function() {
    return (function(modules) {})({
        './src/index.js': function(module, exports) { }
    });
});

// jsonp
myLib((function(modules) {})({
    './src/index.js': function(module, exports) {}
}));
```

### 3.3 externals 外部模块配置

externals 配置项用于去除输出的打包文件中依赖的某些第三方 js 模块（例如 jquery，vue 等），由使用者主动引入，例如开发 jquery 插件等，引入方式如下：

| js-lib 导出方式(libraryTarget)   | 使用者引入方式                     | 被依赖模块的提供方式 |
| -------------------------------- | ---------------------------------- | -------------------- |
| var (默认，包含非js库的普通方式) | 以 `<script>` 标签形式引入         | 以全局变量形式引入   |
| commonjs                         | 按 commonjs 规范引入               | 按 commonjs 规范引入 |
| amd                              | 按 amd 规范引入                    | 按 amd 规范引入      |
| umd                              | 以 `<script>` 、commonjs、amd 引入 | 按对应方式引入       |

### 3.4 target 构建目标配置

```javascript
module.exports = {
  	// 构建目标，可以传入字符串，默认是 web，可以省略
    target: 'web',
    // 也可以传入 function，接收 compiler 作为参数
    target: compiler => {
        compiler.apply(new webpack.JsonpTemplatePlugin(options.output), new webpack.LoaderTargetPlugin('web'));
    }
};
```

构建目标 target 支持以下类型：

**node**：编译为类 Node.js 环境可用（使用 node.js require 加载 chunk）

**async-node**：编译为类 Node.js 环境可用（使用 fs 和 vm 异步加载分块）

**electron-main**：编译为 Electron 主进程

**electron-renderer**：编译为 Electron 渲染进程

**node-webkit**：编译为 Webkit 可用（使用 jsonp 加载分块）

**webworker**：编译成一个 WebWorker

### 3.5 devtool 配置 sourcemap

devtool 参数用来控制如何显示 sourcemap：

| devtool                        | 构建速度 | 重新构建速度 | 生产环境支持 | 品质(quality)          |
| ------------------------------ | -------- | ------------ | ------------ | ---------------------- |
| 留空，none                     | +++      | +++          | yes          | 打包后的代码           |
| eval                           | +++      | +++          | no           | 生成后的代码           |
| cheap-eval-source-map          | +        | ++           | no           | 转换过的代码（仅限行） |
| cheap-module-eval-source-map   | o        | ++           | no           | 原始源代码（仅限行）   |
| eval-source-map                | ––       | +            | no           | 原始源代码             |
| cheap-source-map               | +        | o            | no           | 转换过的代码（仅限行） |
| cheap-module-source-map        | o        | –            | no           | 原始源代码（仅限行）   |
| inline-cheap-source-map        | +        | o            | no           | 转换过的代码（仅限行） |
| inline-cheap-module-source-map | o        | –            | no           | 原始源代码（仅限行）   |
| source-map                     | ––       | ––           | yes          | 原始源代码             |
| inline-source-map              | ––       | ––           | no           | 原始源代码             |
| hidden-source-map              | ––       | ––           | yes          | 原始源代码             |
| nosources-source-map           | ––       | ––           | yes          | 无源代码内容           |

> +++ 非常快速  ++ 快速  + 比较快  o 中等  - 比较慢  -- 慢
>
> 推荐生产环境不使用或者使用 **source-map**，开发环境使用 **cheap-module-eval-source-map**

### 3.6 resolve 配置依赖查询解析规则

配置 resolve 参数可以帮助 webpack 快速查找依赖。

#### 3.6.1 resolve.extensions 扩展名解析

配置后载入模块可以省略对应等扩展名

```javascript
module.exports = {
    resolve: {
        extensions: ['.js', '.json', '.css']
    }
};
```

#### 3.6.2 resolve.alias 路径解析

```javascript
module.exports = {
    resolve: {
        alias: {
            src: path.resolve(__dirname, 'src'),
            // 使用特殊字符 @ ! ~，便于区分
            '@lib': path.resolve(__dirname, 'src/lib'),
            // 根据环境加载不同的库
          	aLib: process.env.NODE_ENV === 'production' ? 'aLib/dist/aLib.min.js' : 'aLib/dist/aLib.dev.js',
            // 支持在名称末尾添加 $ 实现精准匹配
            // 如能匹配 import vue from 'vue';
            // 只触发普通解析 import file from 'vue/file.js';
            vue$: '/path/to/vue.min.js'
        }
    }
};
```

设置了 alias 就可以在任意文件中使用短路径来定位模块，如 `require('@lib/utils')` 或 `require('src/lib/utils')`。

#### 3.6.3 其他配置

`resolve.mainFields`：设置使用的模块代码版本，如 `['browser', 'module', 'main'] `

`resolve.mainFiles`：解析目录时的默认文件名，默认 index，即查找目录下的 index + resolve.extensions 文件

`resolve.modules`：模块依赖名，默认是 node_modules

`resolve.plugins`：添加解析插件，数组格式

`resolve.cachePredicate`：是否缓存，支持 boolean 和 function(path:string,require:object):boolean。

### 3.7 module 配置模块解析规则

#### 3.7.1 module.noParse 忽略非模块化文件

忽略对部分没采用模块化的文件的递归解析和处理，能提高构建性能。需要确定被排除出去的模块代码中不能包含 import 、require 、define 等内容，以保证webpack的打包包含了所有的模块，否则打包后的代码会因为缺少模块报错。

```javascript
module.exports = {
    module: {
        // 使用正则表达式
        noParse: /jquery|lodash/,
        // 使用函数，从 Webpack 3.0.0 开始支持
        noParse: (content) => {
            // content 代表一个模块的文件路径
            return /jquery|lodash/.test(content); // 返回 true or false
        }
    }
}
```

#### 3.7.2 module.rules.parser 控制模块化语法解析

noParse 只能控制哪些文件不进行解析，而 parser 属性可以更细粒度地从语法层面配置模块的解析。

```javascript
module: {
    rules: [{
        test: /\.js$/,
        use: ['babel-loader'],
        parser: {
            amd: false, // 禁用 AMD
            commonjs: false, // 禁用 CommonJS
            system: false, // 禁用 SystemJS
            harmony: false, // 禁用 ES6 import/export
            requireInclude: false, // 禁用 require.include
            requireEnsure: false, // 禁用 require.ensure
            requireContext: false, // 禁用 require.context
            browserify: false, // 禁用 browserify
            requireJs: false, // 禁用 requirejs
        }
    }]
}
```

#### 3.7.3 module.rules 模块解析规则配置

webpack 处理模块时将符合规则条件的模块，提交给对应的处理器来处理。

##### 3.7.3.1 条件匹配

通过 test、include、exclude 等配置来命中可以应用规则的模块文件。如下述 rule 规则匹配来自 src 和 test 文件夹，不包含 node_modules 和 bower_modules 子目录，模块的文件路径为 .tsx 和 .jsx 结尾的文件。

```javascript
{
    test: [/\.jsx?$/, /\.tsx?$/],
    include: [
        path.resolve(__dirname, 'src'),
        path.resolve(__dirname, 'test')
    ],
    exclude: [
        path.resolve(__dirname, 'node_modules'),
        path.resolve(__dirname, 'bower_modules')
    ]
}
```

##### 3.7.3.2 loader 配置

在使用对应的 loader 之前需要先安装。如在 JavaScript 中引入 less，则需要安装 less-loader：

```shell
$ npm i -D less-loader
```

然后配置 loader，这样 less 文件都会被 less-loader 处理成对应的 css 文件。

```javascript
module.exports = {
    module:{
        rules:[
            test: /\.less$/,
            // string 类型，结果会被作为 require() 的参数直接使用
            use: 'less-loader'
        ]
    }
}
```

还可以直接在 js 文件中使用 loader 内联配置方式：

```javascript
const html = require('html-loader!./loader.html');
// or
import html from 'html-loader!./loader.html';

console.log(html);
```

效果等同于：

```javascript
const html = require('./loader.html');

console.log(html);
```

加上 webpack 配置文件：

```javascript
module.exports = {
    module: {
        rules: [{
            test: /\.html$/,
            use: ['html-loader']
        }]
    }
};
```

> 注意：如果没有 html-loader，直接 require 一个 html 文件，会被当作 js 模块来执行，会报错。

##### 3.7.3.3 loader 参数

loader 传参支持 options 和 query 两种方式：

```javascript
// inline 内联写法，通过 query 传入
const html = require("html-loader?attrs[]=img:src&attrs[]=img:data-src!./file.html");

// config 内写法，通过 query 传入
module: {
    rules: [{
        test: /\.html$/,
        use: [{
            loader: 'html-loader?minimize=true&removeComments=false&collapseWhitespace=false'
        }]
    }]
}

// config 内写法，通过 options 传入
module: {
    rules: [{
        test: /\.html$/,
        use: [{
            loader: 'html-loader',
            options: {
                minimize: true,
                removeComments: false,
                collapseWhitespace: false
            }
        }]
    }]
}
```

##### 3.7.3.4 loader 解析顺序

简单配置一个 loader 往往不能满足一些模块的需求，如 less 模块文件，除了将 less 语法转换成 CSS 语法，还需要添加 css-loader 等处理为 js 能直接使用的模块，webpack 的 loader 解析顺序是从右到左（从后到前）的：

```javascript
// query 写法从右到左，使用!隔开
const styles = require('css-loader!less-loader!./src/index.less');

// 数组写法，从后到前
module.exports = {
    module: {
        rules: [{
            test: /\.less$/,
            use: [{
                loader: 'style-loader'
            },{
                loader: 'css-loader'
            },{
                loader: 'less-loader'
            }]
        }]
    }
};
```

**enforce** 参数可以调节 loader 的执行顺序，post 表示该 loader 最后执行，而 pre 表示该 loader 最先执行。

```javascript
use: [{
    loader: 'babel-loader',
    enforce: 'post'
}];
```

**oneOf** 参数可以设置只应用第一个匹配的规则，一般结合 resourceQuery。

```javascript
module.exports = {
    //...
    module: {
        rules: [{
            test: /\.css$/,
            oneOf: [{
                resourceQuery: /inline/, // foo.css?inline
                use: 'url-loader'
            },{
                resourceQuery: /external/, // foo.css?external
                use: 'file-loader'
            }]
        }]
    }
};
```

### 3.8 plugin 插件

loader 面向的是解决某个或者某类模块的问题，而 plugin 面向的是项目整体，解决的是 loader 解决不了的问题。webpack 本身内置了很多插件，可以直接通过 webpack 对象的属性来直接使用：

```javascript
module.exports = {
    plugins: [
        // 压缩js
        new webpack.optimize.UglifyJsPlugin();
    ]
}
```

除了内置插件，还可以通过安装 NPM 包的方式来使用插件：

```javascript
const ExtractTextPlugin = require('extract-text-webpack-plugin');
module.exports = {
    plugins: [
        // 导出css内容到单独的文件
        new ExtractTextPlugin({
             filename: 'style.css'
        })
    ]
};
```

## 4. 总结

本文是对系统化学习 webpack 到工程化优化实践过程中的一些细节的总结记录。webpack 早已成为前端开发不可或缺的脚手架工具，因此系统化学习 webpack 是前端er成长路上的必修课。

## 5. 附录

1. webpack-cli 常用命令官方文档：[https://webpack.js.org/api/cli/](https://webpack.js.org/api/cli/)


![sign](https://raw.githubusercontent.com/csxiaoyaojianxian/ImageHosting/master/img/sign.jpg)