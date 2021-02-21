# webpack 学习笔记系列04-资源处理优化

> Write By [CS逍遥剑仙](http://home.ustc.edu.cn/~cssjf/)   
> 我的主页: [csxiaoyao.com](https://csxiaoyao.com)   
> GitHub: [github.com/csxiaoyaojianxian](https://github.com/csxiaoyaojianxian)   
> Email: [sunjianfeng@csxiaoyao.com](mailto:sunjianfeng@csxiaoyao.com)  
> QQ: [1724338257](http://wpa.qq.com/msgrd?uin=1724338257&site=qq&menu=yes) 

## 1.  配置 typescript

### 1.1 tsconfig.json

新建 ts 文件：

```typescript
// hello.ts
function sayHello(name: string) {
    return 'Hello, ' + name;
}
let name = 'csxiaoyao';
console.log(sayHello(name));
```

直接在命令行安装 ts 并编译：

```shell
$ npm i -g typescript
# 编译为 hello.js
$ tsc hello.ts
```

编译后的文件：

```javascript
function sayHello(name) {
    return 'Hello, ' + name;
}
var name = 'csxiaoyao';
console.log(sayHello(name));
```

TypeScript 约定了 `tsconfig.json` 文件来存储项目配置，[文档链接](https://www.typescriptlang.org/docs/handbook/tsconfig-json.html)。

```json
{
    "compilerOptions": {
        "outFile": "dist/main.js",
        "sourceMap": true
    },
    "files": ["src/index.ts", "src/source.ts"]
}
```

若使用 tsconfig.json 文件，只需要执行 tsc 即可。

```shell
$ tsc
```

### 1.2 webpack 集成 typescript

安装 ts-loader：

```shell
$ npm i ts-loader --save-dev
```

配置 `webpack.config.js`：

```javascript
module.exports = {
    entry: './src/app.ts',
    output: {
        filename: 'app.js',
        path: './dist'
    },
    resolve: {
        extensions: ['', '.webpack.js', '.web.js', '.ts', '.js']
    },
    module: {
        loaders: [
            {
                test: /\.ts$/,
                loader: 'ts-loader'
            }
        ]
    }
};
```

配合项目根目录的 tsconfig.json文件即可实现 ts 的集成。

## 2. css 处理

### 2.1 css-loader

webpack 中一切皆模块，css 文件可以在 JavaScript 中被直接引用，但不能解析 css 语法，css-loader 能将 css 转成字符串供 js 使用。

```shell
$ npm i -D css-loader
```

添加 rule：

```javascript
{
    module: {
        rules: [
            {
                test: /\.css$/,
                use: ['css-loader']
            }
        ]
    }
}
```

或直接使用内联写法：

```javascript
import css from 'css-loader!./css/index.css';
console.log(css);
```

### 2.2 style-loader

style-loader 是将 css-loader 打包好的 CSS 代码以 `<style>` 标签的形式插入到 HTML 文件中，所以 style-loader 是在 css-loader 之后成对出现。

```shell
$ npm i -D style-loader
```

添加 rule：

```javascript
module: {
    rules: [
        {
            test: /\.css$$/,
            use: ['style-loader', 'css-loader']
        }
    ]
}
```

或直接使用内联写法：

```javascript
import css from 'style-loader!css-loader!./css/index.css';
console.log(css);
```

### 2.3 mini-css-extract-plugin

在将 css 以 `<style>` 标签的形式插入到 HTML 文件中的基础上，还需要将 css 以 `<link>` 标签的形式通过 URL 引入，此时需要借助 `mini-css-extract-plugin` 这个插件。

```shell
$ npm install --save-dev mini-css-extract-plugin
```

配置文件需要同时修改 loader 和 plugin，loader 需要放在 css-loader 之后代替 style-loader：

```javascript
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
module.exports = {
    plugins: [
        // 添加 plugin
        new MiniCssExtractPlugin({
            filename: '[name].css',
            chunkFilename: '[id].css'
        })
    ],
    module: {
        rules: [
            {
                test: /\.css$/,
                // 添加 loader
                use: [MiniCssExtractPlugin.loader, 'css-loader']
            }
        ]
    }
};
```

### 2.4 CSS Modules

编译工具可以实现 css 的模块化，参考 [css-loader](https://github.com/webpack-contrib/css-loader)。

来，这时候就需要使用mini-css-extract-plugin这个插件了，首先安装它：

```javascript
{
    module: {
        rules: [
            {
                test: /\.css$/,
                use: [
                    'style-loader',
                    {
                        loader: 'css-loader',
                        options: {
                            modules: true
                        }
                    }
                ]
            }
        ]
    }
}
```

打包后的 class 会被替换以实现模块化。

### 2.5 **CSS** 预处理器

常见的预处理器有：less、sass(scss)、stylus，此处以 less 为例。

```shell
$ npm i -D less-loader
```

修改 webpack 配置：

```javascript
// webpack.config.js
module.exports = {
    module: {
        rules: [{
            test: /\.less$/,
            use: [
                'style-loader',
                {
                    loader: 'css-loader',
                    options: {
                        modules: true
                    }
                },
                'less-loader' // 将 less 编译为 css
            ]
        }]
    }
};
```

### 2.6 CSS 后处理器 PostCSS

#### 2.6.1 PostCSS

PostCSS 是一个使用 JavaScript 插件来转换 css 的工具， 不仅可以处理 CSS 和预处理器语法，还能处理添加前缀、最新语法转义、压缩、甚至扩展 CSS 的语言特性等。其实现与 babel 类似，将 CSS 解析成 AST 再转换生成新 CSS。PostCSS 可以让 css 的编写更加轻松，如根据适配的浏览器使用 Autoprefixer 插件自动添加前缀适配不同浏览器。

```css
/* index.css */
.flex {
    display: flex;
}

/* 经 postcss autoprefixer 处理后 */
.flex {
    display: -webkit-box;
    display: -webkit-flex;
    display: -ms-flexbox;
    display: flex;
}
```

#### 2.6.2 postcss-loader

安装 postcss-loader：

```
$ npm i -D postcss-loader
```

修改 webpack.config.js，postcss-loader 需要在 css-loader 或预处理器 loader 之前。

```javascript
module.exports = {
    module: {
        rules: [
            {
                test: /\.less$/,
                use: [
                    'style-loader', 
                    {
                        loader: 'css-loader',
                        options: {
                            modules: true,
                            importLoader: 2
                        }
                    },
                    'less-loader',
                    'postcss-loader'
                ]
            }
        ]
    }
};
```

#### 2.6.3 postcss 配置

PostCSS 本身只是将 CSS 解析成 AST，需要依赖其强大的插件系统才能实现丰富的功能，配置写法有三种：

1. 项目的根目录下的配置文件 postcss.config.js

2. webpack 配置文件中对应 loader 的配置项 options

3. 直接在 package.json 中添加 postcss 属性

**方式1: postcss.config.js**

```javascript
// postcss.config.js
const autoprefixer = require('autoprefixer');
module.exports = {
    plugins: [autoprefixer(['IE 10'])]
};
```

**方式2: loader 配置项 options**

```javascript
// 引入postcss 插件
const autoprefixer = require('autoprefixer');
module.exports = {
    module: {
        rules: [
            {
                test: /\.css$/,
                use: [
                    'style-loader',
                    'css-loader',
                    {
                        loader: 'postcss-loader',
                        options: {
                            // plugins 选项
                            plugins: [autoprefixer(['IE 10'])]
                        }
                    }
                ]
            }
        ]
    }
};
```

**方式3: package.json 中添加 postcss 属性**

受限于 json 语法，可扩展性较弱，不推荐。

```json
{
    "postcss": {
        "plugins": {
            "autoprefixer": "IE 10"
        }
    }
}
```

#### 2.6.4 常用 postcss 插件

**autoprefixer**

主要参数是 browserslist，用于给 css 补齐各种浏览器私有前缀，如 -webkit、-moz 、-ms 等，同时还会处理各种兼容性问题，如 flex 处理成 -webkit-box 等。

**postcss-preset-env**

与 babel 的 preset-env 类似，可以安心地使用最新 css 语法来写样式，如 cssnext 等。

**PreCSS**

可以写类 sass 和 cssnext 语法的 CSS。

**cssnano**

根据 CSS 语法解析结果智能压缩代码，比如合并一些类写法、缩短颜色值等一些常见的值。

**postcss-import**

支持处理 @import 引入的 CSS 代码，效果和设置 css-loader 的 importLoaders 相同。

> importLoaders 表示 css-loader 作用于 @import 的资源之前有多少个 loader
>
> 取值：
>
> 0 => 默认，没有 loader
>
> 1 => postcss-loader
>
> 2 => postcss-loader, sass-loader

```javascript
// 直接使用 postcss-import 插件
const autoprefixer = require('autoprefixer');
const postcssImport = require('postcss-import');
module.exports = {
    plugins: [postcssImport(), autoprefixer(['IE 10'])]
};
```

### 2.7 css 压缩处理

cssnano 是基于 postcss 的插件包，集成了30多种插件，能够实现多方面的优化，如：

+ 删除空格和最后一个分号
+ 删除注释
+ 优化字体权重
+ 丢弃重复的样式规则
+ 压缩选择器
+ 减少手写属性
+ 合并规则
+ …

```javascript
// webpack.config.js
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
module.exports = {
  plugins: [
    new OptimizeCssAssetsPlugin({
      assetNameRegExp: /\.optimize\.css$/g,
      cssProcessor: require('cssnano'), // 指定引擎，默认 cssnano
      cssProcessorPluginOptions: {
        preset: ['default', {discardComments: {removeAll: true}}]
      },
      canPrint: true
    })
  ]
};
```

在 CSS 中推荐使用 [contenthash] 占位符做文件的 hash 算法。

## 3. lint 工具处理代码风格质量

### 3.1 ESLint

ESLint 通过配置规则 ([Rules](https://cn.eslint.org/docs/rules/)) 来检测 JavaScript 语法规范，业内比较著名的配置规则有：Airbnb、Standard、Google 等，在项目中使用：

```shell
# 安装 CLI 工具
$ npm install -D eslint
# 创建配置文件 .eslintrc.json
$ eslint --init
# 运行检查
$ npx eslint
```

生成的 .eslintrc.json 配置文件如下：

```json
{
    "env": {
        "browser": true,
        "es6": true
    },
    "extends": "airbnb-base",
    "globals": {
        "Atomics": "readonly",
        "SharedArrayBuffer": "readonly"
    },
    "parserOptions": {
        "ecmaVersion": 2018,
        "sourceType": "module"
    },
    "rules": {}
}
```

若想直接使用业界通用的规则，需要先安装规则：

```shell
# airbnb
$ npm install --save-dev eslint-config-airbnb
# google
$ npm install --save-dev eslint-config-google
# standard
$ npm install --save-dev eslint-config-standard
```

然后在 .eslintrc.json 配置文件中修改 extends 为对应值：

```json
{
    "extends": "standard",
    "rules": {}
}
```

若要额外定制一些规则，可以配置 rules，ESLint 报错类型分三种：off (0)、warn (1)、error (2)。

```javascript
{
    'rules': {
        // 禁止 console
        'no-console': 2,
        // 禁止 debugger
        'no-debugger': 2,
        // 禁止 alert
        'no-alert': 2,
        // 不用的 var，要删除，手动 tree shaking
        'no-unused-vars': 2,
        // 未定义的不能用，要用的写 eslint global 
        'no-undef': 2
    }
}
```

### 3.2 webpack 使用 eslint

安装 eslint-loader：

```shell
npm install -D eslint-loader
```

配置 rule：

```javascript
{
    test: /\.js$/,
    loader: 'eslint-loader',
    enforce: 'pre', // 手动调整 loader 加载顺序，保证先检测代码风格，再做 babel 转换等工作
    include: [path.resolve(__dirname, 'src')], // 指定检查的目录 
    options: { // 这里的配置项参数将会被传递到 eslint 的 CLIEngine
        formatter: require('eslint-formatter-friendly') // 指定错误报告的格式规范，需要额外安装
    }
}
```

注意：

1. 不管作为独立的 module.rule 配置，还是放到 babel 的 rule 中，都要保证先通过 eslint-loader 检测代码风格

2. TypeScript 需要用 tslint-loader 进行检测

JavaScript 代码规范，国

### 3.3 StyleLint

用于检测 css 语法，官方推荐的规则有：`stylelint-config-recommended` 和 `stylelint-config-standard`。

```shell
$ npm install -D stylelint
```

此外，通过安装 `stylelint-order` 插件可以规范 css 书写顺序，如先写定位，再写盒模型，再写内容区样式，最后写 CSS3 相关属性。

StyleLint 的配置文件是 .stylelintrc.json，写法和 ESLint 配置类似：

```json
{
    "extends": ["stylelint-config-standard", "stylelint-config-recess-order"],
    "rules": {
        // 支持 SCSS 语法中的 mixin、extend、content 语法
        "at-rule-no-unknown": [true, {"ignoreAtRules": ["mixin", "extend", "content"]}]
    }
}
```

### 3.4 webpack 使用 stylelint

通过 stylelint-webpack-plugin 插件来使用。

```shell
$ npm install -D stylelint-webpack-plugin
```

修改配置，可以配置 emitErrors 和 failOnError 参数。

```javascript
const StyleLintPlugin = require('stylelint-webpack-plugin');
module.exports = {
    plugins: [new StyleLintPlugin(options)]
};
```

插件默认会查找项目中的 .stylelintrc.json 配置文件。

## 4. 静态资源处理

### 4.1 使用 file-loader / url-loader 加载图片资源

`file-loader` 和 `url-loader` 是处理图片资源最常用的两个 loader，并且在一定应用场景下可以相互替代。

**file-loader**：根据配置项复制使用到的资源（不局限于图片）到构建后的文件夹，并更改对应的链接

**url-loader**：包含 `file-loader` 全部功能，并能根据配置转换为 Base64 方式引入

以 `url-loader` 为例，首先安装：

```shell
$ npm install -D url-loader
```

修改 `webpack.config.js`：

```js
module.exports = {
    module: {
        rules: [{
            test: /\.(png|svg|jpg|gif)$/,
            use: {
                loader: 'url-loader',
                options: {
                    limit: 3 * 1024 // 不超过3k的图片才会被转换为base64
                }
            }
        }]
    }
}
```

### 4.2 配置CDN

修改 publicPath 配置：

```javascript
module.exports = {
    output: {
        publicPath: 'http://xxx.com/img/'
    }
}
```

webpack 打包后结果如下：

```html
<body>
    <img src="http://xxx.com/img/xxxxxx.png" />
    <script src="http://xxx.com/img/main.js"></script>
</body>
```

### 4.3 **HTML** 和 **CSS** 中使用 alias

修改 webpack 的 alias 配置

```javascript
module.exports = {
    resolve: {
        alias: {
            '@assets': path.resolve(__dirname, './src/assets')
        }
    }
}
```

在html中使用alias：

```html
<img src="~@assets/img/large.png" />
```

在css中使用alias：

```css
.bg-img {
    background: url(~@assets/img/small.png) no-repeat;
}
```

> **Tips:**
>
> 1. 在 HTML 和 CSS 使用 alias 必须要前面添加 ~
> 2. 对于 svg 图片可以使用 svg-url-loader 处理

### 4.4 使用 img-webpack-loader 压缩优化图片

安装 loader：

```shell
$ npm install image-webpack-loader --save-dev
```

image-webpack-loader 不支持嵌入图片，所以必须和 url-loader 和 svg-url-loader 一起使用：

```javascript
module.exports = {
    module: {
        rules: [{
            test: /\.(jpe?g|png|gif|svg)$/,
            loader: 'image-webpack-loader',
            enforce: 'pre' // 提高优先级，在 url-loader 和 svg-url-loader 之前完成图片优化，避免在多个loader中重复引用
        }]
    }
};
```

### 4.5 使用 PostCSS 生成 CSS Sprite 雪碧图

安装 loader：

```shell
$ npm install postcss-sprites -D
$ npm install postcss-loader -D
```

修改 PostCSS 的 `postcss.config.js`，增加插件的调用：

```javascript
// postcss.config.js 
const postcssSprites = require('postcss-sprites');
module.exports = {
    plugins: [
        postcssSprites({
            spritePath: './src/assets/img/' // 只有指定路径下的图片会被处理为精灵图
        })
    ]
};
```

配置 loader，注意顺序：

```javascript
{
    test: /\.css$/,
    use: [
    		MiniCssExtractPlugin.loader,
    		'css-loader', {
        		loader: 'postcss-loader'
        }
    ]
}
```

完成后，下面的图片引入会被处理为雪碧图：

```css
/* 打包前 */
.bg-img01 {
    background: url(./assets/img/small-01.png) no-repeat;
}
.bg-img02 {
    background: url(./assets/img/small-02.png) no-repeat;
}

/* 打包后 */
.bg-img01 {
    background-image: url(xxxxxx.png);
    background-position: 0px 0px;
    background-size: 320px 320px;
}
.bg-img02 {
    background-image: url(xxxxxx.png);
    background-position: -160px 0px;
    background-size: 320px 320px;
}
```

### 4.6 使用 file-loader / url-loader 处理字体、富媒体资源

若不需要 Base64 可以直接使用 file-loader，否则用 url-loader：

```javascript
{
    // 文件解析
    test: /\.(eot|woff|ttf|woff2|appcache|mp4|pdf)(\?|$)/,
    loader: 'file-loader',
    query: {
        // 这么多文件，ext不同，所以需要使用[ext]
        name: 'assets/[name].[hash:7].[ext]'
    }
}
```

### 4.7 使用 loader 导入数据资源

JSON / CSV / TSV / XML 格式资源可以通过对应 loader 导入为已解析的 JSON 以便于使用。 其中，JSON的 loader 是内置的，直接使用即可。

```javascript
import Data from'./data.json'
```

对于其他三种数据格式，首先要安装对应的 loader：

```shell
$ npm i -D xml-loader csv-loader
```

然后修改 webpack 配置：

```javascript
{
    test: /\.(csv|tsv)$/,
    use: ['csv-loader']
}, {
    test: /\.xml$/,
    use: ['xml-loader']
}
```

## 5. HTML 和多页面配置

### 5.1 HTML 文件处理

安装 loader：

将正则（test）放在一起，那么需要使用 [ext] 配置输出的文件名。

```shell
$ npm i html-webpack-plugin --save-dev
```

配置插件：

```javascript
const HtmlWebPackPlugin = require('html-webpack-plugin');
module.exports = {
    mode: 'development',
    entry: {
        main: './src/index.js'
    },
    plugins: [
      	// case1: 在 dist 文件夹中自动生成一个 index.html 的文件，自动插入入口文件 main.js
      	new HtmlWebPackPlugin(),
        // case2: 修改自动生成的 html 文件参数
        new HtmlWebPackPlugin({ title: 'hello', filename: 'foo.html' }),
        // case3: 使用 template 模板文件生成 html 文件
      	new HtmlWebPackPlugin({ template: './src/index.html' })
    ]
};
```

### 5.2 多入口页面配置

对于多入口的 html 页面可以通过插件的多次实例化来实现，但仅配置插件，引入的入口 js 文件还是同样的 main.js，此时需要借助 html-webpack-plugin 插件的两个参数 chunks 和 excludeChunks 来解决。chunks 表示当前页面包含的 chunk，可以对应 entry 的 key，excludeChunks 则是排除某些 chunks。例如：

```javascript
const HtmlWebPackPlugin = require('html-webpack-plugin');
module.exports = {
    mode: 'development',
    entry: {
        index: './src/index.js',
        list: './src/list.js'
    },
    plugins: [new HtmlWebPackPlugin({
        template: './src/index.html',
        filename: 'index.html',
        chunks: ['index']
    }), new HtmlWebPackPlugin({
        template: './src/list.html',
        filename: 'list.html',
        chunks: ['list']
    })]
};
```

> **Tips:**
>
> 对于多页面应用，可以考虑使用 glob 等模块自动载入模板和入口文件来实现自动化加载

## 6. js 压缩处理

在 webpack 4 的 production 模式下已做了大量通用的优化配置，如 Tree-Shaking、Scope Hoisting 都默认开启，使用的压缩工具是 terser-webpack-plugin，是从 uglify-es 项目拉的一个分支以继续维护，具有和 uglifyjs-webpack-plugin 相同的参数。

```javascript
const TerserPlugin = require('terser-webpack-plugin');
module.exports = {
  optimization: {
    minimizer: [
      new TerserPlugin(
        parallel: true, // 多线程
        comments: false,
        compress: {
          unused: true,
          drop_debugger: true, // 删掉 debugger
          drop_console: true, // 移除 console
          dead_code: true // 移除无用的代码
        }
      )]
  }
};
```

Scope Hoisting 作用域提升是指 webpack 通过 ES6 语法静态分析出模块之间的依赖关系，尽可能地把模块放到同一个函数中，让webpack 打包出来的代码文件更小、运行更快。 其他代码级别优化技巧：

+ 合理划分代码职责，适当按需加载
+ 合理设置 SplitChunks 分组
+ 合理使用 hash 占位符，防止文件名变化使 HTTP 缓存过期
+ 合理使用 polyfill，减少产生多余的代码
+ 使用 ES6 语法，减少使用有副作用的代码以加强 Tree-Shaking 效果
+ 使用 Webpack 的 Scope Hoisting（作用域提升）功能

+ 使用 bable-plugin-import 等工具优化一些 UI 组件库
+ 善用 webpack-bundle-analyzer 插件，帮助分析 Webpack 打包后的模块依赖关系

## 7. 缓存优化策略

静态资源可以设置 http 缓存策略，如：

```
Cache-Control: max-age=31536000
```

### 7.1 chunk 代码拆分

当使用 chunkhash 时，得益于缓存策略，代码拆分和按需加载就很重要，webpack 的 chunk 代码拆分方式大致有三种：

+ **entry 配置**：配置多个 entry 入口文件

+ **动态(按需)加载**：代码中主动使用 import() 或 require.ensure

+ **抽取公共代码**：使用 splitChunks 配置



```javascript
module.exports = {
	// ...
  optimization: {
    splitChunks: {
      chunks: 'async', // "initial" | "all" | "async" (默认) 
      minSize: 30000, // 文件的最小尺寸，30K，development 下是10k，若此值很大，则公共部分不会被抽取，但按需加载仍会抽取
      maxSize: 0, // 文件的最大尺寸，0为不限制，优先级：maxInitialRequest/maxAsyncRequests < maxSize < minSize 
      minChunks: 1, // 默认1，被提取的一个模块至少需要在几个 chunk 中被引用，这个值越大，抽取出来的文件就越小 
      maxAsyncRequests: 5, // 在做一次按需加载的时候最多有多少个异步请求，为 1 的时候就不会抽取公共 chunk 了 
      maxInitialRequests: 3, // 针对一个 entry 做初始化模块分隔的时候的最大文件数，优先级高于 cacheGroup，所以为 1 的时候 就不会抽取 initial common 了 
      automaticNameDelimiter: '~', // 打包文件名分隔符 
      name: true, // 拆分出来文件的名字，默认为 true，表示自动生成文件名，如果设置为固定的字符串那么所有的 chunk 都会被合 并成一个 
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

![sign](https://raw.githubusercontent.com/csxiaoyaojianxian/ImageHosting/master/img/sign.jpg)