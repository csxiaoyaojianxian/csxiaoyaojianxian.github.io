# webpack 学习笔记系列05-devserver

> Write By [CS逍遥剑仙](http://home.ustc.edu.cn/~cssjf/)   
> 我的主页: [csxiaoyao.com](https://csxiaoyao.com)   
> GitHub: [github.com/csxiaoyaojianxian](https://github.com/csxiaoyaojianxian)   
> Email: [sunjianfeng@csxiaoyao.com](mailto:sunjianfeng@csxiaoyao.com)  
> QQ: [1724338257](http://wpa.qq.com/msgrd?uin=1724338257&site=qq&menu=yes)

## 1. Webpack Dev Server

### 1.1 命令行使用

webpack-dev-server 是一个小型的 express 服务器，它通过 express 的中间件 webpack-dev-middleware 和 webpack 进行交互。

```shell
# 项目中安装 webpack-dev-server
$ npm i webpack-dev-server
# 使用 npx 启动
$ npx webpack-dev-server
```

启动后读取 webpack 配置文件并将打包到内存中。建议将命令写到 package.json 中，同时支持使用选项参数：

```shell
# 修改 port 和 host
$ webpack-dev-server --port 3000 --host 127.0.0.1
# 启动 inline 模式的自动刷新
$ webpack-dev-server --hot --inline
# 使用监听
$ webpack-dev-server --watch
# 指定 webpack config 文件
$ webpack-dev-server --config webpack.xxx.js
# 指定 webpack mode
$ webpack-dev-server --mode development
# 手动修改工作目录为非当前目录
$ webpack-dev-server --content-base ./dist
```

> **Tips:**
>
> webpack-dev-server 支持两种模式的自动刷新页面：iframe 和 inline
>
> iframe：页面放到一个 iframe 内，内容变化页面重新加载
>
> inline：将 webpack-dev-server 重载代码添加到产出的 bundle 中，相比 iframe 方式不用刷新整个页面

### 1.2 HMR（Hot Module Replacement）

Webpack 可以通过配置 webpack.HotModuleReplacementPlugin 插件来开启全局 HMR，可以在不刷新页面的情况下，直接替换、增删模块。

```javascript
const path = require('path');
module.exports = {
    entry: './src/index.js',
    devServer: {
        contentBase: path.join(__dirname, 'dist'),
        port: 8080,
      	// 开启 hmr 支持，相当于命令行 --hot
        hot: true
    },
    plugins: [
        // 添加 hmr 插件，若命令行添加 --inline 则可以自动配置
        new webpack.HotModuleReplacementPlugin()
    ]
};
```

执行 webpack-dev-server，打开 http://localhost:8080 ，当 index.js 修改时能实时看到修改结果。

### 1.3 proxy 代理

devServer.proxy 可以解决本地开发跨域的问题。

```javascript
module.exports = {
    devServer: {
        // case1: /api/users => http://csxiaoyao.com/api/users
        proxy: {
            '/api': 'http://csxiaoyao.com'
        },
        // case2: /api/users => https://csxiaoyao.com/users
        proxy: {
            '/api': {
                target: 'http://csxiaoyao.com',
                pathRewrite: { '^/api': '' },
              	secure: false
            }
        },
        // case3: 代理绕过 html 资源文件请求
      	proxy: {
            '/api': {
                target: 'http://csxiaoyao.com',
                bypass(req, res, proxyOptions) {
                    // 判断请求头中的 accept 值 
                    if (req.headers.accept.indexOf('html') !== -1) {
                        // 返回 contentBase 的路径
                      	// return xxx
                    }
                }
            }
        },
      	// case4: 只代理 /api 和 /auth 两个地址，其余放行
        proxy: [{
            context: ['/auth', '/api'],
            target: 'http://csxiaoyao.com'
        }]
    }
};
```

### 1.4 自定义中间件 & mock server

在 webpack-dev-server 加载所有内部中间件之前和之后可以通过 devServer.before 和 devServer.after 实现自定义中间件。

```javascript
module.exports = {
    devServer: {
        before(app, server) {
          	// 设置 mock 数据，http://localhost:8080/api/mock.json
            app.get('/api/mock.json', (req, res) = > {
                res.json({ text: 'hello world' });
            });
        },
  			after(app, server) {
        		// ... 
        }
    }
};
```

### 1.5 webpack dev server 常用配置

**devServer.historyApiFallback**：失败默认页面
**devServer.compress**：启用 gzip 压缩
**devServer.hotOnly**：构建失败的时候是否不允许回退到使用刷新网页
**devServer.inline**：模式切换，默认为内联模式，使用 false 切换到 iframe 模式
**devServer.open**：启动后，是否自动使用浏览器打开首页
**devServer.openPage**：启动后，自动使用浏览器打开设置的页面
**devServer.overlay**：是否允许使用全屏覆盖的方式显示编译错误，默认不允许
**devServer.port**：监听端口号，默认 8080
**devServer.host**：指定 host，使用 0.0.0.0 可局域网内访问
**devServer.contentBase**：静态文件根路径
**devServer.publicPath**：设置内存中的打包文件虚拟路径映射，区别于 output.publicPath
**devServer.staticOptions**：配置 express.static 参数
**devServer.clientLogLevel**：在 inline 模式下控制浏览器中打印的 log 级别
**devServer.quiet**：静默模式，设置为 true 则不在控制台输出 log
**devServer.noInfo**：不输出启动 log
**devServer.lazy**: 不监听文件变化，而是当请求来时再重新编译
**devServer.watchOptions**：watch 相关配置，如修改监测间隔
**devServer.headers**：自定义请求头，如自定义 userAgent 等
**devServer.https**：https 证书签名等配置

![sign](https://raw.githubusercontent.com/csxiaoyaojianxian/ImageHosting/master/img/sign.jpg)