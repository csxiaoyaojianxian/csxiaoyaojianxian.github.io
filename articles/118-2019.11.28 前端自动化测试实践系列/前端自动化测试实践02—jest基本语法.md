# 前端自动化测试实践02—jest基本语法

[toc]

> Write By CS逍遥剑仙
> 我的主页: [www.csxiaoyao.com](http://www.csxiaoyao.com)
> GitHub: [github.com/csxiaoyaojianxian](https://github.com/csxiaoyaojianxian)
> Email: sunjianfeng@csxiaoyao.com   

> 本节代码地址 [https://github.com/csxiaoyaojianxian/JavaScriptStudy](https://github.com/csxiaoyaojianxian/JavaScriptStudy) 下的自动化测试目录

## 1. matchers 匹配器 

测试工具中最基本的就是断言匹配器，下面是 jest 中常用的匹配器。

【 toBe 】【 toEqual 】 

```javascript
test('jest匹配器', () => {
	const a = 1;
    const b = { one: 1 };
    expect(a).toBe(1);
    // expect(b).toBe({ one: 1 }); // false 地址不同
    expect(b).toEqual({ one: 1 });
})
```

【 toBeNull 】【 toBeUndefined 】【 toBeDefined 】【 toBeTruthy 】【 toBeFalsy 】

```javascript
test('jest匹配器', () => {
	expect(null).toBeNull();
})
```

【 not 】

```javascript
test('jest匹配器', () => {
	expect(1).not.toBeFalsy();
})
```

**Number**

【 toBeCloseTo 】【 toBeGreaterThan 】【 toBeLessThan 】【 toBeGreaterThanOrEqual 】【 toBeLessThanOrEqual 】

```javascript
test('jest匹配器', () => {
    expect(10).toBeGreaterThanOrEqual(10);
    expect(0.1 + 0.2).toBeCloseTo(0.3);
})
```

**String**

【 toMatch 】

```javascript
test('jest匹配器', () => {
	expect('www.csxiaoyao.com').toMatch('csxiaoyao');
})
```

**Array/Set**

【 toContain 】

```javascript
test('jest匹配器', () => {
    const a = ['www', 'csxiaoyao', 'com'];
    expect(a).toContain('csxiaoyao');
    expect(new Set(a)).toContain('csxiaoyao');
})
```

**Object**

【 toMatchObject 】

```javascript
test('jest匹配器', () => {
    expect({ data: { success: true } }).toMatchObject({ data: { success: true } });
})
```

**异常**

【 toThrow 】

```javascript
test('jest匹配器', () => {
    const a = () => { throw new Error('this is a new error') };
    expect(a).toThrow();
    expect(a).toThrow('this is a new error');
    expect(a).toThrow(/this is a new error/);
    // expect(a).not.toThrow(); // 没有抛出异常
})
```

**其他**

【 any 】...

## 2. hook 钩子函数

**beforeAll** / **afterAll** / **beforeEach** / **afterEach**

```javascript
beforeAll(() => {
	console.log('beforeAll')
})
afterAll(() => {
	console.log('afterAll')
})
// 每个用例执行前执行，一般用于针对不同用例初始化不同的实例对象
beforeEach(() => {
	console.log('beforeEach')
    // 实例化
    counter = new Counter()
})
afterEach(() => {
	console.log('afterEach')
})
```

## 3. describe 分组

可以用于限定作用域，可以与钩子函数配合使用，写在不同层级的钩子函数，作用域不同

```javascript
describe('测试分组和钩子函数', () => {
    let counter = null
    // 外层 beforeEach
    beforeEach(() => { counter = new Counter() })
    // 分组1
    describe('测试分组1代码', () => {
        // 【 使用 describe 限定作用域 】
        // 内层 beforeEach 不会对后面的同级 describe 产生影响
        beforeEach(() => { console.log('beforeEach test group1') })
        test('xxx', () => { /* ... */ })
        // ...
    })
    // 分组2
    describe('测试分组2代码', () => {
        test('xxx', { /* ... */ })
        // ...
    })
})
```

## 4. only 跳过 case

```javascript
test('该 case 被跳过', () => { /* ... */ })
test.only('只测试这个用例，跳过其他 case', () =>{ /* ... */ })
test('该 case 被跳过', () => { /* ... */ })
```

## 5. snapshot 快照测试

快照测试适用于配置文件、UI等内容的测试，快照保存上次运行的结果存储在 `__snapshots__` 下，如果两次执行结果不一致则不通过，需要检查后更新快照，按 `u` 更新全部快照，按 `i` 进入交互式单独更新。例如测试下面的配置文件 `snapshot.js`

```javascript
// 固定值
export const generateConfig1 = () => {
    return {
        server: 'http://localhost',
        port: 8080
    }
}
// 存在变化的时间值
export const generateConfig2 = () => {
    return {
        server: 'http://localhost',
        port: 8080,
        time: new Date()
    }
}
```

编写测试用例，注意匹配时间类变化值

```javascript
import { generateConfig1, generateConfig2 } from "./11-snapshot";
test("测试 generateConfig1 函数", () => {
	expect(generateConfig1()).toMatchSnapshot();
});
test("测试 generateConfig2 函数", () => {
	expect(generateConfig2()).toMatchSnapshot({
		// 用于匹配时间类变化的值
        time: expect.any(Date)
	});
});
```

`inline snapshot`，可以将快照保存在用例中，需要安装 `prettier` 模块

```shell
$ npm install prettier --save
```

编写测试用例

```javascript
test("测试 generateConfig2 函数 inline", () => {
	expect(generateConfig2()).toMatchInlineSnapshot({
		time: expect.any(Date)
	});
});
```

执行后快照保存在用例文件中

```javascript
test("测试 generateConfig2 函数 inline", () => {
	expect(generateConfig2()).toMatchInlineSnapshot({
			time: expect.any(Date)
    	},
        `
        Object {
            "port": 8080,
            "server": "http://localhost",
            "time": Any<Date>,
        }
  		`
	);
});
```

## 6. DOM 测试

dom 测试一般用于测试 UI，例如需要测试下面 jquery 操作 dom 的代码 `dom.js`

```javascript
import { jsdom } from 'jsdom'
import $ from 'jquery'
const addDivToBody = () => {
	$('body').append('<div/>')
};
export default addDivToBody
```

编写测试用例，node 不具备 dom，因此 jest 在 node 环境下模拟了 dom api — `jsDom`

```javascript
import addDivToBody from './dom'
import $ from 'jquery'
test('测试 addDivToBody', () => {
    addDivToBody()
    addDivToBody()
    expect($('body').find('div').length).toBe(2)
})
```



![](https://raw.githubusercontent.com/csxiaoyaojianxian/ImageHosting/master/img/sign.jpg)