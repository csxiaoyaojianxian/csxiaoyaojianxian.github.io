# 前端性能分析 Chrome Dev Tools 之 Performance

[TOC]

> Write By CS逍遥剑仙
> 我的主页: [www.csxiaoyao.com](http://www.csxiaoyao.com)
> GitHub: [github.com/csxiaoyaojianxian](https://github.com/csxiaoyaojianxian)
> Email: sunjianfeng@csxiaoyao.com   

作为前端开发，肯定对 Chrome 的 dev tools 不陌生，除了日常 Debug，还提供了一个非常强大的功能：performance 用做性能分析。

**window.performance** 提供了一组精确的数据，配合数据上报即可实现简单的性能统计。

## 1. 属性字段

首先可以打开官方提供的测试页：[<https://googlechrome.github.io/devtools-samples/jank/>](https://googlechrome.github.io/devtools-samples/jank/)，在 Chrome 控制台下输入 `window.performance` 即可得到 performance 属性字段。

![](./pic/01.png)

```javascript
var performance = {
    // memory 内存 ( only Chrome )
    memory: {
        usedJSHeapSize:  17045133, // JS对象占用的内存
        totalJSHeapSize: 18463485, // 可使用的总内存
        jsHeapSizeLimit: 2197815296 // 内存大小限制
    },
    // navigation 导航
    navigation: {
        redirectCount: 0, // 重定向次数
        type: 0           // 0 TYPE_NAVIGATENEXT 正常进入的页面(非刷新、非重定向等)
                          // 1 TYPE_RELOAD 通过 window.location.reload() 刷新的页面
                          // 2 TYPE_BACK_FORWARD 通过浏览器的前进后退按钮进入的页面
                          // 255 TYPE_UNDEFINED 非以上方式进入的页面
    },
 	// timing 时间
    timing: {
        // 前一个网页 unload 的时间戳
        navigationStart: 1573989694438,
        // 前一个网页(与当前页面同域) unload 开始的时间戳
        unloadEventStart: 0,
        // 前一个网页(与当前页面同域) unload 结束的时间戳
        unloadEventEnd: 0,
        // 第一个 HTTP 重定向发生时的时间。有跳转且是同域名内的重定向才算，否则值为 0
        redirectStart: 0,
        // 最后一个 HTTP 重定向完成时的时间。有跳转且是同域名内部的重定向才算，否则值为 0
        redirectEnd: 0,
        // 浏览器准备好使用 HTTP 请求抓取文档的时间
        fetchStart: 1573989694445,
        // DNS 域名查询开始的时间
        domainLookupStart: 1573989694445,
        // DNS 域名查询完成的时间
        domainLookupEnd: 1573989694445,
        // HTTP 开始建立连接的时间
        connectStart: 1573989694445,
        // HTTP 完成建立连接的时间
        connectEnd: 1573989694445,
        // HTTPS 连接开始的时间
        secureConnectionStart: 0,
        // HTTP 请求完成建立连接
        requestStart: 1573989694564,
        // HTTP 开始接收响应的时间
        responseStart: 1573989694605,
        // HTTP 响应全部接收完成的时间
        responseEnd: 1573989694618,
        // DOM 树开始解析渲染
        domLoading: 1573989694688,
        // DOM 解析完成，资源未加载的时间
        domInteractive: 1573989696189,
        // DOM 解析完成，资源加载开始的时间
        domContentLoadedEventStart: 1573989696189,
        // DOM 解析完成，网页内资源加载完成的时间
        domContentLoadedEventEnd: 1573989696330,
        // DOM 解析完成，且资源准备就绪的时间
        domComplete: 1573989697523,
        // load 事件回调函数开始执行的时间 (若未绑定 load 事件，值为 0)
        loadEventStart: 1573989697531,
        // load 事件回调函数执行完毕的时间
        loadEventEnd: 1573989697553
    }
};
```

## 2. 常用性能数据指标计算

![](./pic/02.png)

封装常用性能指标统计函数

```javascript
// 计算加载时间
function getPerformanceTiming () {  
    var performance = window.performance;
    if (!performance) {
        console.log('你的浏览器不支持 performance 接口');
        return;
    }
    var t = performance.timing;
    var times = {};
    
    // * 用户等待整个页面加载完成的时间
    times.loadPage = t.loadEventEnd - t.navigationStart;
    // * DOM 树解析时间
    times.domReady = t.domComplete - t.responseEnd;
    // * 重定向的时间
    times.redirect = t.redirectEnd - t.redirectStart;
    // * DNS 解析时间
    times.lookupDomain = t.domainLookupEnd - t.domainLookupStart;
    // * 白屏时间 TTFB (Time To First Byte)  ? cdn
    times.ttfb = t.responseStart - t.navigationStart;
    // * 内容加载完成的时间  ? gzip 文件压缩
    times.request = t.responseEnd - t.requestStart;
    // 执行 onload 回调函数的时间  ? onload回调函数执行过多，延迟加载、懒加载
    times.loadEvent = t.loadEventEnd - t.loadEventStart;
    // DNS 缓存时间 (App Cache)
    times.appcache = t.domainLookupStart - t.fetchStart;
    // 卸载页面的时间
    times.unloadEvent = t.unloadEventEnd - t.unloadEventStart;
    // TCP 连接时间
    times.connect = t.connectEnd - t.connectStart;
 
    return times;
}
```

## 3. 其他 api

### 3.1 performance.getEntries()

返回值为所有资源的加载情况的数组，除了 `performance.timing` 中包含的部分属性，新增四个属性：

```
name: "http://cdn.xxx/xxx.css",  // 资源名称(绝对路径)
entryType: "resource",           // 资源类型
initiatorType: "link",           // link => <link>标签
                                 // script => <script>标签
                                 // redirect => 重定向
duration: 18.00099999999999      // 加载时间
```

封装获取对某个资源的加载情况：

```javascript
function getEntryTiming (entry) {
    var t = entry;
    var times = {};
    // 重定向时间
    times.redirect = t.redirectEnd - t.redirectStart;
    // DNS查询时间
    times.lookupDomain = t.domainLookupEnd - t.domainLookupStart;
    // 内容加载完成的时间
    times.request = t.responseEnd - t.requestStart;
    // TCP 建立连接完成握手的时间
    times.connect = t.connectEnd - t.connectStart;
	// 新增属性
    times.name = entry.name;
    times.entryType = entry.entryType;
    times.initiatorType = entry.initiatorType;
    times.duration = entry.duration;
    return times;
}
```

### 3.2 performance.now() / performance.mark() 

精确计算程序执行时间，`performance.now()` 返回以微秒为单位的时间，更加精准，而且 `Date.now()` 可能受系统时间影响且可能阻塞，而 `performance.now()` 输出的是相对于 `performance.timing.navigationStart` (页面初始化) 的时间，而 `performance.mark()` 则可以在程序中进行时间打点存储，以便后面分析。

`performance.now()`

```javascript
function getFunctionTimeWithPerformance (func) {  
    var timeStart = window.performance.now();
    func();
    var timeEnd = window.performance.now();
    return (timeEnd - timeStart);
}
```

`performance.mark()`

```javascript
function randomFunc (n) {
    if (!n) {
        n = ~~(Math.random() * 10000); // 生成一个随机数
    }
    var nameStart = 'markStart' + n;
    var nameEnd   = 'markEnd' + n;
    var name = 'measureRandomFunc' + n;
    // 函数执行前做标记
    window.performance.mark(nameStart);
    for (var i = 0; i < n; i++) {
        // do nothing
    }
    // 函数执行后再做标记
    window.performance.mark(nameEnd);
    // 测量这个两个标记的时间距离，并保存
    window.performance.measure(name, nameStart, nameEnd);
}
randomFunc();  
randomFunc(888);
// 查看保存的标记
var marks = window.performance.getEntriesByType('mark');
var measure = window.performance.getEntriesByType('measure');
var entries = window.performance.getEntriesByName('measureRandomFunc888'); // 查看自定义测量
console.log(marks,measure,entries);
// 清除标记
window.performance.clearMarks('markStart888'); // 清除指定标记
window.performance.clearMarks(); // 清除所有标记
window.performance.clearMeasures('measureRandomFunc');
window.performance.clearMeasures();
```

使用 `measure` 计算 domReady 时间

```javascript
// 旧方案
var t = performance.timing  
var domReadyTime = t.domComplete - t.responseEnd;
console.log(domReadyTime)
// 新方案
window.performance.measure('domReady','responseEnd','domComplete');
var domReadyMeasure = window.performance.getEntriesByName('domReady');
console.log(domReadyMeasure);
```

### 3.3 performance.memory

查看浏览器内存情况，包含：

1. `jsHeapSizeLomit`：内存大小限制


2. `totalJSHeadSize`：可使用的内存
3. `userdJSHeadSize`：已使用的内存



**参考**：

[https://developers.google.cn/web/tools/chrome-devtools/network/understanding-resource-timing](https://developers.google.cn/web/tools/chrome-devtools/network/understanding-resource-timing)


![](https://raw.githubusercontent.com/csxiaoyaojianxian/ImageHosting/master/img/sign.jpg)


