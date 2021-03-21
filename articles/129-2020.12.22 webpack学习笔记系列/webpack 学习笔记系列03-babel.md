# webpack 学习笔记系列03-babel

> Write By [CS逍遥剑仙](http://home.ustc.edu.cn/~cssjf/)   
> 我的主页: [csxiaoyao.com](https://csxiaoyao.com)   
> GitHub: [github.com/csxiaoyaojianxian](https://github.com/csxiaoyaojianxian)   
> Email: [sunjianfeng@csxiaoyao.com](mailto:sunjianfeng@csxiaoyao.com)  
> QQ: [1724338257](http://wpa.qq.com/msgrd?uin=1724338257&site=qq&menu=yes)

## 1.  babel-cli 命令行工具

babel 是 JavaScript 的编译器，可以将最新 ES 语法的代码轻松转换成任意版本的 JavaScript 代码，其实现原理是先使用 Babylon 解释器将 JavaScript 语法解析成 AST，然后通过遍历处理这颗树实现代码转换。在 babel 中可以通过配置 browserslist 来针对不同的浏览器组合，生成不同的适配代码。

```javascript
// code.js
[1, 2, 3].map(n => n ** 2);
```

使用 babel 转换 code.js 代码。Babel 7 使用了 @babel 命名空间来区分官方包，因此以前的官方包 babel-xxx 改成了 @babel/xxx。

```shell
# 安装 babel-cli 命令行工具
$ npm i -D @babel/core @babel/cli
# 安装 preset-env 转换规则
$ npm i -D @babel/preset-env
# 执行转换
$ npx babel code.js --presets=@babel/preset-env -o output.js
```

若不设置 --presets 转换规则，则输出内容与源文件没有区别；可使用 --out-file 或 -o 输出到指定文件。`@babel/preset-env` 是 babel 官方推出的插件预设，它可以根据开发者的配置按需加载对应的插件，通过 `@babel/preset-env` 可以根据代码执行平台环境和具体浏览器的版本来产出对应的 JavaScript 代码。转换后代码：

```javascript
'use strict';
[1, 2, 3].map(function(n) {
    return Math.pow(n, 2);
});
```

## 2. 配置文件

babel 有两种写配置文件的方式：

```javascript
// package.json 的 babel 字段
{
    "name": "my-package",
    "version": "1.0.0",
    "babel": {
        "presets": [
            "@babel/preset-env"
        ]
    }
}
// .babelrc 或 .babelrc.js 配置文件，会从当前目录向外层遍历查找
{
    "presets": [
        "@babel/preset-env"
    ]
}
```

**env** 参数可以使不同环境使用不同的 babel 配置。env 选项的值将从 process.env.BABEL_ENV 获取，若没有，则获取 process.env.NODE_ENV 的值，也无法获取时会设置为 "development" 。

```json
// .babelrc
{
    "env": {
        "production": {
            "presets": ["@babel/preset-env"]
        }
    }
}
```

## 3. @babel/preset-env

### 3.1 polyfill / runtime

babel 只负责语法的转换，如 es6 转 es5，但部分对象、方法实际在浏览器中是不支持的，所以需要借助 polyfill / runtime 两种方式来模拟。如 polyfill，首先安装：

```shell
$ npm i @babel/polyfill
```

然后在文件内直接通过 import 或 require 引入：

```javascript
// polyfill
import '@babel/polyfill';
console.log([1, 2, 3].includes(1));
```

@babel/polyfill 有以下两个问题：

1. 直接修改内置的原型，造成全局污染
2. 无法按需引入，导致产出文件过大

babel 社区又提出了 @babel/runtime 方案解决上述问题。@babel/runtime 支持按需引入，且不再修改原型，而是采用替换的方式。比如对于 Promise，@babel/polyfill 会产生一个 window.Promise 对象，而 @babel/runtime 则会生成一个新的如 _Promise 的对象来替换代码中用到的 Promise。

以转换 Object.assign 为例：

```shell
# 安装依赖 @babel/runtime
$ npm i @babel/runtime
# 安装 babel 插件
$ npm i -D @babel/plugin-transform-runtime
# 安装用于 Object.assign 转换的插件
$ npm i -D @babel/plugin-transform-object-assign
```

代码如下：

```javascript
// code.js
Object.assign({}, {a: 1});
```

执行转换：

```shell
$ npx babel runtime.js --plugins @babel/plugin-transform-runtime,@babel/plugin-transform-object-assign
```

输出结果自动引入了 @babel/runtime/helpers/extends：

```javascript
import _extends from '@babel/runtime/helpers/extends';
_extends(
    {},
    {
        a: 1
    }
);
```

@babel/runtime 也不是完美的解决方案，由于 @babel/runtime 不修改原型，所以类似 [].includes() 这类使用直接使用原型方法的语法是不能被转换的。

### 3.2 @babel/preset-env

@babel/preset-env 可以零配置转化 ES6 代码，也支持精细化配置，`useBuiltIns` 用来设置浏览器 polyfill，`target` 用来设置目标浏览器或对应的环境（browser/node）。相比 @babel/polyfill 和 @babel/runtime 两种繁琐方式实现浏览器 polyfill，使用 @babel/preset-env 的 useBuildIn 选项做 polyfill 简单而且智能。

```json
{
    "presets": [
        ["@babel/preset-env", {
            "useBuiltIns": "usage|entry|false",
          	"targets": [
                "node": "8.9.3"
            ]
        }]
    ]
}
```

#### 3.2.1 useBuiltIns

**useBuiltIns: false**

```json
["@babel/preset-env", {
    "useBuiltIns": false
}]
```

默认为 false，此时不对 `polyfill` 做操作。如果引入 `@babel/polyfill`，则无视配置的 target 浏览器兼容，引入所有的 `polyfill`。

**useBuiltIns: usage【推荐】**

一般情况下，usage 能够满足日常开发，建议直接使用。

```json
["@babel/preset-env", {
    "useBuiltIns": "usage"
}]
```

根据配置的 target 浏览器兼容及代码中用到的 API 进行 `polyfill`，实现了按需添加，如代码如下：

```javascript
// code.js
const p = new Promise();
[1, 2].includes(1);
'foobar'.includes('foo');
```

转换后，[].includes 原型方法也能被转换：

```javascript
'use strict';
require('core-js/modules/es.array.includes');
require('core-js/modules/es.object.to-string');
require('core-js/modules/es.promise');
require('core-js/modules/es.string.includes');
var p = new Promise();
[1, 2].includes(1);
'foobar'.includes('foo');
```

**useBuiltIns: entry**

```json
["@babel/preset-env", {
    "useBuiltIns": "entry",
    "corejs": 3,
}]
```

根据配置的 target 浏览器兼容，引入浏览器不兼容的 `polyfill`。需要在入口文件手动添加 @babel/polyfill，会自动根据 `browserslist` 替换成浏览器不兼容的所有 `polyfill`

```javascript
import '@babel/polyfill';
```

entry 可以指定 `core-js` 的版本, 如果 `"corejs": 3`, 则 `import '@babel/polyfill'` 需要改成：

```javascript
import 'core-js/stable';
import 'regenerator-runtime/runtime';
```

由于引入了所有的  polyfill，打包文件的体积会比较大。

#### 3.2.2 target

```json
{
    "presets": [
        ["env", {
            "targets": {
                "node": "8.9.3"
            }      
        }]
    ]
}
```

**targets.node**：当值为 true / "current" 表示根据当前 node.js 版本动态转换，若填写具体的数字，表示需要支持的最低的 node.js 版本

**targets.esmodules**：设置使用 ES Modules 语法，最新浏览器支持

**targets.browsers**：设置目标浏览器 browserslist，让代码更有针对性地输出兼容性代码（包括 CSS前缀、JS 的 Polyfill 等），而不是无脑地全部兼容。

#### 3.2.3 browserslist

browserslist 是一个通用的设置目标浏览器的工具，被广泛应用于 babel、postcss-preset-env、autoprefixer 等开发工具上。其配置可放在 package.json 中，也可单独放在配置文件 `.browserslistrc` 中。所有的工具都会主动查找 browserslist 的配置文件，根据配置找出对应的目标浏览器集合。此外，支持设置环境变量，设置 `BROWSERSLIST_ENV` 或 `NODE_ENV` 可以配置不同的环境变量，默认会优先加载 production 配置项。

**package.json**

```json
{
    "browserslist": ["last 2 version", "> 1%", "maintained node versions", "not ie < 11"]
}
```

支持设置环境变量

```json
{
    "browserslist": {
        "production": ["> 1%", "ie 10"],
        "development": ["last 1 chrome version", "last 1 firefox version"]
    }
}
```

**.browerslistrc**

```text
# 每行一个浏览器集合描述
last 2 version
> 1%
maintained node versions
not ie < 11
```

支持设置环境变量

```json
[production staging]
> 1%
ie 10

[development]
last 1 chrome version
last 1 firefox version
```

##### 3.2.3.1 常见集合范围

| 范围                     | 说明                                                         |
| ------------------------ | ------------------------------------------------------------ |
| last 2 versions          | caniuse.com网站跟踪的最新两个版本，若 iOS 12 是最新版本，向后兼容两个版本就是 iOS 11 和 iOS 12 |
| \> 1%                    | 全球超过 1%人使用的浏览器，类似 > 5% in US 则指代美国 5%以上用户 |
| cover 99.5%              | 覆盖 99.5%主流浏览器                                         |
| chrome > 50 ie 6-8       | 指定某个浏览器版本范围                                       |
| unreleased versions      | 所有浏览器的 beta 版本                                       |
| not ie < 11              | 不兼容 ie11 以下版本                                         |
| since 2013 last 2 years  | 某时间范围发布的所有浏览器版本                               |
| maintained node versions | 所有被 node 基金会维护的 node 版本                           |
| current node             | 当前环境的 node 版本                                         |
| dead                     | 通过 last 2 versions 筛选的浏览器中，全球使用率低于 0.5% 且官方声明不再维护或者事实上已经两年没有再更新的版本 |
| defaults                 | 默认配置， > 0.5% last 2 versions Firefox ESR not dead       |

##### 3.2.3.2 浏览器名称列表

大小写不敏感

| 名称                    | 说明                  |
| ----------------------- | --------------------- |
| Android                 | 安卓 webview 浏览器   |
| Baidu                   | 百度浏览器            |
| BlackBerry / bb         | 黑莓浏览器            |
| Chrome                  | chrome 浏览器         |
| ChromeAndroid / and_chr | chrome 安卓移动浏览器 |
| Edge                    | 微软 Edge 浏览器      |
| Electron                | Electron              |
| Explorer / ie           | ie 浏览器             |
| ExplorerMobile / ie_mob | ie 移动浏览器         |
| Firefox / ff            | 火狐浏览器            |
| FirefoxAndroid / and_ff | 火狐安卓浏览器        |
| iOS / ios_saf           | iOS Safari 浏览器     |
| Node                    | nodejs                |
| Opera                   | opera 浏览器          |
| OperaMini / op_mini     | operaMini 浏览器      |
| OperaMobile / op_mob    | opera 移动浏览器      |
| QQAndroid / and_qq      | QQ 安卓浏览器         |
| Samsung                 | 三星浏览器            |
| Safari                  | 桌面版本 Safari       |
| UCAndroid / and_uc      | UC 安卓浏览器         |

整个目标浏览器的集合是取并集，即满足配置的全部条件。

## 4. 在 webpack 中使用 babel

```shell
# 安装开发依赖
$ npm i webpack babel-loader webpack-cli @babel/core @babel/preset-env @babel/plugin-transform-runtime -D
# 将 runtime 作为依赖
$ npm i @babel/runtime -S
```

修改 webpack.config.js 文件

```javascript
// webpack.config.js
module.exports = {
    entry: './code.js',
    module: {
        rules: [{
            test: /\.js$/,
            use: [{
                loader: 'babel-loader',
                options: {
                    presets: [
                        [
                            '@babel/preset-env', {
                                useBuiltIns: 'usage'
                            }
                        ]
                    ]
                }
            }]
        }]
    }
};
```

上面的 webpack.config.js 文件直接将 babel 配置写到 options 中，还可以在项目根目录下创建 .babelrc 文件或使用 package.json 的 babel 字段。

## 5. babel polyfill 的最佳实践

babel 在每个需要转换的代码前面都会插入一些 helpers 代码，而不是通过 import 的方式，可能会导致重复。@babel/plugin-transform-runtime 的 helpers 选项可以把这些代码抽离出来。所以 babel 的 polyfill 的最佳实践如下：

```javascript
// .babelrc
{
    "plugins": [
        [
            "@babel/plugin-transform-runtime", {
                "corejs": false, // 默认值，可以不写
                "helpers": true, // 默认，可以不写
                "regenerator": false, // 通过 preset-env 已经使用了全局的 regeneratorRuntime, 不再需要 transform-runtime 提供的不污染全局的 regeneratorRuntime
                "useESModules": true // 使用 es modules helpers, 减少 commonJS 语法代码
            }
        ]
    ],
    "presets": [
        [
            "@babel/preset-env", {
                "targets": {}, // 这里是targets的配置，根据实际browserslist设置
                "corejs": 3, // 添加core-js版本
                "modules": false, // 模块使用 es modules ，不使用 commonJS 规范
                "useBuiltIns": "usage" // 默认 false, 可选 entry, usage
            }
        ]
    ]
}
```

![sign](https://raw.githubusercontent.com/csxiaoyaojianxian/ImageHosting/master/img/sign.jpg)