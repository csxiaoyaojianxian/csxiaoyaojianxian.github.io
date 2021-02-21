# onload与ready对比

> Write By [CS逍遥剑仙](http://home.ustc.edu.cn/~cssjf/)   
> 我的主页: [csxiaoyao.com](https://csxiaoyao.com)   
> GitHub: [github.com/csxiaoyaojianxian](https://github.com/csxiaoyaojianxian)   
> Email: [sunjianfeng@csxiaoyao.com](mailto:sunjianfeng@csxiaoyao.com)  
> QQ: [1724338257](http://wpa.qq.com/msgrd?uin=1724338257&site=qq&menu=yes)

## 1 `window.onload` & `$(document).ready()` & `$(window).load()`
ready , onload 类函数 : JS的 `window.onload` 方法， jQuery 的 `$(document).ready` 方法和 `$(window).load` 方法  
ready 事件的触发，表示文档结构已经加载完成（不包含图片等非文字媒体文件）  
onload / load 事件的触发，表示页面包含图片等文件在内的所有元素都加载完成  
## 2 区别
### 2.1 执行时间
`window.onload` 在页面的DOM加载完成，所有的图片、子frame等所有元素加载完才触发
```
window.onload = function () {
	alert('window onload event');
};
```
`$(document).ready` 方法发生在DOM树构造完成（在onload之前发生），不必等图片等资源加载完
```
$(document).ready(function(){
	alert("jquery ready event");
})
```
`$(window).load` 方法等同于 `window.onload`
### 2.2 数量
`window.onload` 最多一个，若存在多个，后面的覆盖前面的
`$(document).ready` 可有多个，并都可以得到执行
`$(window).load` 可有多个，并都可以得到执行
```
window.onload = function(){
	alert('window onload event1');
}
window.onload = function(){
	alert('window onload event2');
}
$(document).ready(function(){
	alert("jquery ready event1");
})
$(document).ready(function(){
	alert("jquery ready event2");
})
```
结果：
```
jquery ready event1
jquery ready event2
window onload event2
```
### 2.3 简化写法
`window.onload` 没有简化写法
`$(document).ready(function(){})` 可以简写成 `$(function(){});`
## 3 原生JS实现 jQuery 的 ready 方法
```
function ready(fn){  
	if(document.addEventListener){      
		//标准浏览器  
		document.addEventListener('DOMContentLoaded',function(){  
			//注销事件，避免反复触发  
			document.removeEventListener('DOMContentLoaded',arguments.callee,false); 
			//执行函数   
			fn();
		},false);  
	}else if(document.attachEvent){     
		//IE浏览器  
		document.attachEvent('onreadystatechange',function(){  
			if(document.readyState=='complete'){  
				document.detachEvent('onreadystatechange',arguments.callee);  
				//执行函数   
				fn();  
			}  
		});  
	}  
}
```
执行
```
window.onload = function(){
	console.log("window.onload event");
}
ready(function(){
	console.log('window ready event')
})
```
结果
```
window ready event
window.onload event
```

![sign](https://raw.githubusercontent.com/csxiaoyaojianxian/ImageHosting/master/img/sign.jpg)