# 【云+社区年度征文】webpack 学习笔记系列02-模块化开发

[TOC]

> Write By CS逍遥剑仙   
> 我的主页: [www.csxiaoyao.com](http://www.csxiaoyao.com/)    
> GitHub: [github.com/csxiaoyaojianxian](https://github.com/csxiaoyaojianxian)    
> Email: sunjianfeng@csxiaoyao.com   

## 1. 模块化规范

三大 JavaScript 主流模块规范：CommonJS、AMD 和 ES6 Module。**CommonJS** 和  **AMD** 都未统一浏览器和客户端的模块化规范。目前 Node.js 使用 CommonJS 作为官方的模块解决方案，虽然内置的模块方案促进了 Node.js 的流行，但是也为引入新的 ES Modules（ESM）标准造成了一定的阻碍，不过 Node.js 9.0+ 已经支持 ESM 语法。

## 2. CommonJS

CommonJS 规范是 JavaScript 中最常见的模块格式规范，从 2009 年提出后起先主要应用在 Node.js 服务端中，由于依赖了 Node.js 如文件系统等功能的实现，导致在浏览器环境无法使用。随着 Browserify 和 Webpack 等打包工具的崛起，通过处理的 CommonJS 前端代码也可以在浏览器中使用。

```javascript
// sayhi.js
var hi = 'hello world';
function sayHi() {
    return hi;
}
module.exports = sayHi;

// index.js
var sayHi = require('./sayhi.js');
console.log(sayHi());
```

CommonJS 的语法，使用 require 导入模块，使用 module.exports 导出模块，在 Node.js 中会被处理为以下代码：

```javascript
(function(exports, require, module, __filename, __dirname) {
    // ...
    // 模块的代码在这里
    // ...
});
```

## 3. AMD

AMD 规范最早随 RequireJS 发展而提出，是在 CommonJS 规范之后推出的一个解决 web 页面动态异步加载 JavaScript 的规范，其浏览器内支持、实现简单且支持异步加载。AMD 的语法，最核心的是两个方法：require()  引入其他模块，define() 定义新的模块。

```javascript
// sayhi.js
define(function() {
    var hi = 'hello world';
    return function sayHi() {
        return hi;
    };
});

// index.js
// 依赖前置
require(['./sayhi.js'], function(sayHi) {
    console.log(sayHi());
});
```

AMD 模式很适合浏览器端的开发，后续有很多变种规范相继提出，如国内 Sea.js 的 CMD，还有兼容 CommonJS 和 AMD 的 UMD 规范（Universal Module Definition），随着 npm 的流行逐渐被取代。

## 4. ES6 Module

又称 ES2015 modules，是 ES2015 标准提出来的一种 ES 标准模块加载方式。作为 ECMAScript 官方方案，不仅在 Web 现代浏览器上得到实现，也在 Node.js 9+ 版本得到原生支持。

```javascript
// sayhi.js
const hi = 'hello world';
export default function sayHi() {
    return hi;
}

// index.js
import sayHi from './sayhi';
console.log(sayHi());
```

## 5. webpack 对 **Module** 的增强

在 webpack 中，一切皆模块，而且可以在一个文件中混合使用 CommonJS 、AMD 和 ES6 Module 三种规范，还可以使用 webpack 对 Module 的增强方法和属性。

### 5.1 import() 动态加载模块

webpack 中可以通过 import('path/to/module') 的方式引入一个模块，类似 require，返回一个 Promise 对象。

```javascript
import('path/to/module').then(mod => {
    console.log(mod);
});
```

import from 是静态分析打包语法，而 import() 是动态打包语法，可以通过异步的方式加载进来。

### 5.2 Magic Comments 神奇注释

在 import() 参数中可以添加指定的注释，称为神奇注释，如下面打包后的结果原本应为 main.js 和 0.js 两个文件，添加 webpackChunkName 注释后 0.js 变成了 my-chunk-name.js。通过神奇注释，import() 不再是简单的 JavaScript 异步加载器，还是任意模块资源的加载器。

```javascript
import hello from './hello';
import(
    /* webpackInclude: /\.json$/ */
    /* webpackExclude: /\.noimport\.json$/ */
    /* webpackChunkName: "my-chunk-name" */
    /* webpackMode: "lazy" */
    /* webpackPrefetch: true */
    /* webpackPreload: true */
    `./locale/${language}`
).then(lazy => {
    console.log(lazy);
});
```

#### 5.2.1 基础神奇注释 

**webpackIgnore**：true 将不能动态导入

**webpackChunkName**：chunk 文件的名称，如 "my-chunk-name-[index]-[request]"，支持占位符，[index] 为递增数字，[request] 为实际解析的文件名

**webpackInclude**：在导入期间这个正则表达式会用于匹配，只有被匹配到的模块才会被打包

**webpackExclude**：在导入期间这个正则表达式会用于匹配，被匹配到的模块不会被打包

#### 5.2.2 神奇注释之 webpackMode 

webpackMode 可以用于设置 chunk 的生成方式，可选值有：lazy / lazy-once / eager / weak。

针对 **webpackMode** 可选值说明如下：

**lazy**：默认，为每个 import() 导入的模块生成一个可延迟加载的 chunk

**lazy-once**：只生成一个满足所有 import() 调用的懒加载chunk，在第一次调用 import() 时就会去获取 chunk，之后调用 import() 会使用相同的网络响应。注意这只在部分动态语句中才有意义，例如：import(\`./locales/${language}.json\`)，将为 locales 目录下所有模块共同创建一个异步 chunk

**eager**：阻止生成额外的 chunk，返回 Promise 的 resolve 状态。和静态导入不同的是，直到调用 import() 完成，module 才会被执行

**weak**：彻底阻止额外的网络请求，只有当该模块已在其他地方被加载过了之后，Promise 才被 resolve，否则直接 reject

#### 5.2.3 神奇注释之 prefetch & preload 

webpack4.6+支持配置 **预先拉取** 和 **预先加载**。

**webpackPrefetch**：是否预取模块，可选值 true(优先级0) 或整数优先级别，使用预先拉取则表示该模块可能以后会用到，浏览器会在空闲时间下载该模块，且下载是发生在父级chunk加载完成之后。

```html
<!-- 被添加至页面头部，浏览器会在空闲时间预先拉取该文件 -->
<link rel="prefetch" as="script" href="my-chunk-name.js">
```

**webpackPreload**：是否预加载模块，可选值 true(优先级0) 或整数优先级别，使用预先加载则表示该模块需要立即被使用，**异步chunk** 会和 **父级chunk** 并行加载。若**父级chunk**先下载好，页面就已可显示了，同时等待**异步chunk**的下载，这能大幅提升性能。注意，不当地使用wepbackPreload会损害性能，所以使用时要小心。

```html
<link rel="preload" as="script" href="my-chunk-name.js">
```

> 注意：prefetch 和 preload 都可以用于提前加载图片、样式等资源，但 prefetch 优先级低于 preload，preload 会并行或在主文件加载完后立即加载，而 prefetch 则会在主文件加载完后的空闲时间加载

### 5.3 require.resolve() / require.resolveWeak() 获取模块ID 

都可以获取模块的唯一 ID(moduleId)，区别在于 require.resolve(dependency: String) 会把模块真实引入进 bundle，而 require.resolveWeak() 则不会。配合 `require.cache` 和 `__webpack_modules__` 可判断模块是否加载成功或是否可用。

```javascript
// in file.js
module.id === require.resolve("./file.js")
```

### 5.4 require.context() 批量加载

require.context(directory, includeSubdirs, filter) 可以批量将 directory 内的文件全部引入进文件，并且返回一个具有 resolve 的 context 对象，使用 context.resolve(moduleId) 则返回对应的模块。

> **参数说明：**
> directory: 目录 string
> includeSubdirs: 是否包含子目录，可选，默认 true
> filter: 过滤正则规则，可选项

### 5.5 require.include()

require.include(dependency) 顾名思义为引入某个依赖，但并不执行它，可以用于优化 chunk。

```javascript
// 当前 hello.js 独立为一个 chunk，若不使用 include，会被打包进 weak.js 和 lazy.js
require.include('./hello.js');
require.ensure(['./hello.js', './weak.js'], function(require) {
    /* ... */
});
require.ensure(['./hello.js', './lazy.js'], function(require) {
    /* ... */
});
```

### 5.6 __resourceQuery

当前模块的资源查询(resource query)，即当前模块引入是传入的 query 信息。

```javascript
// main.js
const component = require('./component-loader?param=demo');
// component-loader.js
const querystring = require('querystring');
const query = querystring.parse(__resourceQuery.slice(1)); // 去掉? 
console.log(query); // {param: demo}
```

### 5.7 其他			

**webpack_public_path**：等同于 output.publicPath

**webpack_require**：原始 require 函数，这个表达式不会被解析器解析为依赖

**webpack_chunk_load**：内部 chunk 载入函数，`__webpack_chunk_load__(chunkId, callback(require))`

**webpack_modules**：所有模块的内部对象，可以通过传入 moduleId 来获取对应的模块

**module.hot**：用于判断是否在 hotModuleReplace 模式下

**webpack_hash**：提供对编译过程中(compilation)的 hash 信息的获取

**non_webpack_require**：生成一个不会被 webpack 解析的 require 函数

## 6. webpack 资源模块化处理

### 6.1 css 中 @import

css（less、sass…）可以通过 @import 的方式引入样式资源。

```Css
@import 'vars.less';
body {
    background: @bg-color;
}
```

### 6.2 js 中 import

此时样式资源文件可作为模块在 js 中引入。

```javascript
import styles from './style.css';
```

### 6.3 使用 loader 把资源作为模块引入

```javascript
const html = require('html-loader!./loader.html');
console.log(html);
```



![](./pic/sign.jpg)