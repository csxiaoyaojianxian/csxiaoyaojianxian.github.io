# 前端自动化测试实践05—cypress-e2e入门

[TOC]

> Write By CS逍遥剑仙
> 我的主页: [www.csxiaoyao.com](http://www.csxiaoyao.com)
> GitHub: [github.com/csxiaoyaojianxian](https://github.com/csxiaoyaojianxian)
> Email: sunjianfeng@csxiaoyao.com   

> 本节代码地址 [https://github.com/csxiaoyaojianxian/JavaScriptStudy](https://github.com/csxiaoyaojianxian/JavaScriptStudy) 下的自动化测试目录

## 1. 端到端测试

### 1.1 区别

在 jest 单元测试中使用快照、API-mock 和 DOM 样式状态断言已经能够实现基础的 UI 测试，但是单元测试属于白盒测试，更关注数据的流动，而端到端测试(End To End Test)属于黑盒测试，更关注操作结果的展示，因此测试效果自然不同。端到端测试更贴近真实用户操作，页面运行在真实的浏览器环境中，因此端到端测试是从用户角度出发的测试。

### 1.2 工具选择

端到端测试的工具也有不少，最为突出的是老牌 e2e 测试工具 `NightWatch`，根据需要安装 `Selenium`或其他`Webdriver`，优势是可以测试多类浏览器，兼容性好，而 `Cypress` 是为现代网络打造的下一代前端测试工具，安装更简单，可以测试任何在浏览器中运行的内容，测试执行效率更高，此处选用 `Cypress` 作为端到端测试工具。

就像官网所说，Cypress就像一个完整的烘烤箱，他还自带电池，下面是一些其它测试框架无法做到的事情：

- **时间旅行：** Cypress在你运行测试的时候拍摄快照。 只要将鼠标悬停在 [命令日志](https://docs.cypress.io/guides/core-concepts/test-runner.html#Command-Log) 上就能够清楚的了解到每一步发生了什么。
- **可调式能力：** 你再也不需要去猜测测试为什么失败了。 [调试工具](https://docs.cypress.io/guides/guides/debugging.html) 和Chrome的调试工具差不多。 清晰的错误原因和堆栈跟踪让调试能够更加快速。
- **自动等待：** 在你的测试中不再需要添加等待或睡眠函数了。在执行下一条命令或断言前Cypress会 [自动等待](https://docs.cypress.io/guides/core-concepts/introduction-to-cypress.html#Cypress-is-Not-Like-jQuery) 异步将不再是问题.
- **Spies, Stubs, and Clocks:** 验证和 [控制](https://docs.cypress.io/guides/guides/stubs-spies-and-clocks.html) 函数、服务器响应或者计时器的行为。你喜欢的单元测试的功能都掌握在你的手中。
- **网络流量控制：** 非常容易的进行 [控制、保存和边缘测试](https://docs.cypress.io/guides/guides/network-requests.html)，而这并不需要涉及到你的服务。你可以根据需要保留网络流量。
- **一致的结果：** 架构不需要Selenium或者WebDriver。向快速，一致和可靠的无侵入测试看齐。
- **屏幕截图和视频：** 可以查看测试失败时候系统自动截取的图片，或者整个测试的录制视频。

## 2. 环境搭建

安装非常简单：

```Shell
$ npm install cypress --save-dev
```

可以选择多种打开方式：

```shell
# 1. 二进制文件可以从./node_modules/.bin中访问
$ ./node_modules/.bin/cypress open
# 2. 使用npm bin
$ $(npm bin)/cypress open
# 3. 使用npx
$ npx cypress open
# 4. 使用yarn
$ yarn run cypress open
```

配置文件修改：

```
// baseUrl: "http://localhost:8080", // 测试域名
fixturesFolder: 'tests/e2e/fixtures', // 外部静态数据，如网络请求或存放模拟上传或读取的文件
integrationFolder: 'tests/e2e/specs', // 测试用例文件夹
screenshotsFolder: 'tests/e2e/screenshots', // 屏幕快照
// videoRecording: true,
videosFolder: 'tests/e2e/videos', // 录制后的文件夹
supportFile: 'tests/e2e/support/index.js', // 配置自定义命令全局注入
viewportHeight: 768, // 测试浏览器视口高度
viewportWidth: 1366 // 测试浏览器视口宽度
```

然后，可以将命令写到 `package.json` 中，如果使用 `vue-cli`，可以看到已经存在 `"test:e2e": "vue-cli-service test:e2e"`，直接执行即可启动测试，在这之前需要先启动项目和mock服务。

```shell
$ npm run test:e2e
```

## 3. Hello world

Cypress 提供了4个测试方法，`context()` 与 `describe()` 相同，`specify()` 与 `it()` 相同。

首先添加测试文件 `/tests/e2e/specs/integration/sample_spec.js`，并添加测试用例

```javascript
describe('My First Test', function () {
  it('Gets, types and asserts', function () {
    cy.visit('https://example.cypress.io')
    cy.contains('type').click()
    // 应该存在一个包含'/commands/actions'的新URL
    cy.url().should('include', '/commands/actions')
    // 获取一个输入, 输入进去并且验证文本值已经更新了
    cy.get('.action-email')
      .type('fake@email.com')
      .should('have.value', 'fake@email.com')
  })
})
```

可以看到用例已经被添加到控制台：

![](./pic/5-01.png)

点击执行用例，可以看到 chrome 被打开并自动执行用例：

![](./pic/5-03.png)

>其中：
>
>- `describe`和`it`来自[Mocha](https://mochajs.org/)
>- `expect`来自[Chai](http://www.chaijs.com/)

更多内容，官网提供了详尽的文档 [<https://docs.cypress.io/>](https://docs.cypress.io/)，可以阅读进一步学习 `Cypress`。

## 4. 常用命令

**调试：**

```javascript
cy.pause()
cy.debug()
```

**元素查询：**

```javascript
// 【 .get() 】类似 jQuery 的 dom 查询
cy.get('#main-content')
  .find('.article')
  .children('img[src^="/static"]')
  .first()

// 【 .contains() 】通过文本内容查询
cy.contains('New Post')
cy.get('.main').contains('New Post')
```

**元素交互：**

```javascript
// 【 .click() 】【 .type() 】配合使用cy.get() 或 cy.contains() 进行点击或输入
cy.get('textarea.post-body')
  .type('This is an excellent post.')

// 【 .dblclick() 】双击DOM元素
// 【 .focus() 】使DOM元素聚焦
// 【 .blur() 】使DOM元素失焦
// 【 .clear() 】清除输入或文本区域的值
// 【 .check() 】选中复选框或者单选框
// 【 .uncheck() 】取消选中复选框
// 【 .select() 】选择一个含有 <option>属性的<select>元素
```

**断言：**

在 Cypress 中有两种断言写法:

1. **隐式:** 使用 `.should()` 或者 `.and()`，`.and()` 只是 `.should()` 的别名，它链接多个断言使代码更易读
2. **显式:** 使用 `expect`

```javascript
// 隐式
cy.get('#header a')
  .should('have.class', 'active')
  .and('have.attr', 'href', '/users')
// 显式
cy.get('tbody tr:first').should(($tr) => {
  expect($tr).to.have.class('active')
  expect($tr).to.have.attr('href', '/users')
})

// 常用断言
cy.get(':checkbox').should('be.disabled')
cy.get('form').should('have.class', 'form-horizontal')
cy.get('input').should('not.have.value', 'US')
cy.request('/users/1').its('body').should('deep.eq', { name: 'Jane' })

// 默认断言
/*
cy.visit() 预期这个页面是状态为200的 text/html内容页
cy.request() 预期远程服务器存在并提供响应
cy.contains() 预期包含内容的元素最终存在于DOM中
cy.get() 预期元素最终存在于 DOM中
.find() 预期元素最终存在于 DOM 中
.type() 预期元素最终为 可输入 状态
.click() 预期元素最终为 可操作 状态
.its() 预期最终找到当前主题的一个属性
*/
```

**别名：**

```javascript
cy.get('.my-selector')
  .as('myElement') // 设置别名
  .click()
cy.get('@myElement') // 使用别名
  .click()
```

**超时：**

```javascript
// 设置这个元素10秒的超时时间
cy.get('.my-slow-selector', { timeout: 10000 })
// 默认时间
cy.visit() // 60000ms
cy.exec() // 60000ms
cy.wait() // 30000ms
// 大多数其他命令(包括所有基于 DOM 的命令)默认在 4000ms 之后超时
```

**使用 .then() 来操作一个主题**

```javascript
cy.get('#some-link')
  .then(($myElement) => {
    // ...模拟任意主题的一段代码
    const href = $myElement.prop('href') // 获取它的 href 属性
    return href.replace(/(#.*)/, '') // 替换'hash'字符和它之后的一切
  })
  .then((href) => {
    // href 是现在的新主题
  })
```

## 5. 截屏和视频录制

屏幕录制截屏是 Cypress 的一大特色，在 `Test Runner` 中单击项目的 **Runs** 选项卡，登录账号，再根据提示执行指令，即可完成屏幕录制和自动截屏。

```
$ ./node_modules/cypress/bin/cypress run --record --key xxxxxxxx
```

还可以在用例中主动截屏，存储在 `screenshots` 目录下。

```
cy.screenshot()
```

![](./pic/5-04.png)

## 6. 总结

Cypress 非常强大，本文涉及的只是很小一部分，更多有用的功能可以去官网探索。



![](https://raw.githubusercontent.com/csxiaoyaojianxian/ImageHosting/master/img/sign.jpg)