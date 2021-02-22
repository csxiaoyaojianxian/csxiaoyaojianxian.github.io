# 使用 requestAnimationFrame 替代 throttle 优化页面性能

> Write By [CS逍遥剑仙](http://home.ustc.edu.cn/~cssjf/)   
> 我的主页: [csxiaoyao.com](https://csxiaoyao.com)   
> GitHub: [github.com/csxiaoyaojianxian](https://github.com/csxiaoyaojianxian)   
> Email: [sunjianfeng@csxiaoyao.com](mailto:sunjianfeng@csxiaoyao.com)  
> QQ: [1724338257](http://wpa.qq.com/msgrd?uin=1724338257&site=qq&menu=yes)

## 1. throttle 的缺陷

前面的文章《函数防抖(debounce)和节流(throttle)在H5编辑器项目中的应用》中讲过，对于 `mousemove`, `scroll` 这类事件，一般的解决方法是使用 `throttle` 节流函数，但是节流函数解决这类问题并不完美，存在两点缺陷：

+ **无法充分利用高性能、高刷新率设备**

这点很好理解，普通设备的刷新率是 60Hz，大约 16.67ms / 帧，所以在节流函数中设置节流时间为 16 ms。

然而，喜欢玩大型游戏的人应该知道，一些显示器是可以达到 120Hz 甚至更高的刷新率的，高刷新率可以减少游戏动画的拖影，获得更细腻流畅的游戏体验，随着高刷新率显示器技术的不断成熟，其价格不断下降并且逐步普及。关注手机圈的人也不难看出，2020年各大手机厂商纷纷把 90Hz / 120Hz 流速屏作为首要卖点，可见屏幕的高刷新率是未来的趋势。

在高刷新频率的显示屏上刷新时间会小于 16.67ms，节流函数写死的 16ms 刷新时间并不能充分利用设备性能，若缩短节流函数时间，又起不到节流效果，并且会增加低性能机器的处理时间，造成卡顿。

+ **节流函数的回调函数的处理时间并不准确**

这个问题是由于浏览器的页面事件循环系统的设计造成的，浏览器的页面事件循环系统采用消息队列的机制，虽然  `setTimeout` 定时器会有单独的队列进行处理，但是渲染进程的单处理线程必须等前面的事件处理完才能执行定时器回调，因此实际的执行时间很可能会超过设定的 16ms。更详细的说明在另一篇文章 《浏览器原理学习笔记04—浏览器中的页面循环系统》中会有详尽的描述。

## 2. requestAnimationFrame 的使用 

### 2.1 概念

`requestAnimationFrame` 作为前端开发或多或少了解过，一般应用于 JavaScript 动画的优化，例如 [MDN 中文文档](https://developer.mozilla.org/zh-CN/docs/Web/API/Window/requestAnimationFrame) 中的 Demo，递归调用可以取代 `setTimeout` 实现动画帧控制。

```javascript
var start = null;
var element = document.getElementById('SomeElementYouWantToAnimate');
element.style.position = 'absolute';
function step(timestamp) {
  if (!start) start = timestamp;
  var progress = timestamp - start;
  element.style.left = Math.min(progress / 10, 200) + 'px';
  if (progress < 2000) {
    window.requestAnimationFrame(step); // 递归调用
  }
}
window.requestAnimationFrame(step);
```

`window.requestAnimationFrame` 需要传入一个回调函数作为参数，并要求浏览器在下次重绘之前调用指定的回调函数，它有两个特点：

+ 回调函数执行次数通常与浏览器屏幕刷新次数相匹配
+ 当运行在后台标签页或者隐藏的 `iframe` 里时，`requestAnimationFrame` 会被暂停调用以提升性能和电池寿命

### 2.2 使用 requestAnimationFrame 对 throttle 优化

`requestAnimationFrame` 函数不需要传入时间参数，是根据设备刷新率自动调节的，可以解决节流函数是通过时间管理队列不灵活的问题，很自然会想到下面的写法：

```javascript
window.addEventListener('scroll', e => {
    window.requestAnimationFrame(timestamp => {
        doAnimation(timestamp)
    })
})
```

但是 `requestAnimationFrame` 不管理回调函数，即在回调被执行前，多次调用带有同一回调函数的 `requestAnimationFrame`，会导致回调在同一帧中执行多次。

### 2.3 解决重复调用问题 

可以通过一个 lock 锁变量来保证 `requestAnimationFrame` 队列里同样的回调函数只有一个：

```javascript
const onScroll = e => {
    if (lock) { return }
    lock = true
    window.requestAnimationFrame(timestamp => {
        lock = false
        doAnimation(timestamp)
    })
}
window.addEventListener('scroll', onScroll)
```

对上述代码进行封装得到 `animationFrame` 函数：

```javascript
let lock = {}
function animationFrame (callback = (time) => {}, key = 'default') {
    if (lock[key]) { return false }
    lock[key] = true
    window.requestAnimationFrame((time) => {
        lock[key] = false
        callback(time)
    })
    return true
}
// 调用
window.addEventListener('scroll', () => { animationFrame((time) => doAnimation(time)) })
```

## 3. 兼容性

对于IE9及以下浏览器可以使用 setTimeout 来兼容：

```javascript
(function() {
    var lastTime = 0;
    var vendors = ['webkit', 'moz'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame =
          window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
    }
    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); },
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());
```

## 4. 总结

与防抖节流函数使用 `settimeout` 基于时间来管理队列不同，`window.requestAnimationFrame` 基于设备的刷新频率，因此不用传时间参数，但是函数的执行仍然使用的是浏览器的页面事件循环系统，因此问题 2：回调函数的处理时间不准确的问题同样不能解决。需要注意：节流函数和 `window.requestAnimationFrame` 二者不能混用，否则回调函数的调用将可能延长。`window.requestAnimationFrame` 相比节流函数降低了可控性，但是提升了性能和精确度，在处理 `scroll`、`move` 之类的事件时，若不考虑低版本浏览器兼容性，更加推荐使用。


![sign](https://raw.githubusercontent.com/csxiaoyaojianxian/ImageHosting/master/img/sign.jpg)