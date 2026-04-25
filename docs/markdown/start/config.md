# 配置项说明

`adapter-yunhupro` 适配器的所有配置都在 Koishi 的插件配置页面中完成。

本页将详细介绍每个配置项的含义和用法。

## 订阅配置

### 机器人 Token (`token`)

* **`token`**: (字符串)
  * **描述**: 填写您在云湖平台获取的机器人 **Token**。请妥善保管，不要泄露。
  * **必填**: 是
  * **类型**: 密钥（输入时会隐藏）

:::tip
**无需填写机器人 ID**

新版本会在启动时自动获取机器人 ID，您只需要提供 Token 即可。
:::

### 订阅方式 (`type`)

* **`type`**: (选择)
  * **描述**: 选择与云湖平台的连接方式。
  * **默认值**: `websocket`
  * **可选值**:
    * `websocket`: WebSocket 长连接方式（推荐）
    * `webhook`: Webhook 推送方式

:::tip
**推荐使用 WebSocket 方式**

- ✅ 无需公网 IP
- ✅ 配置简单
- ✅ 不会出现消息混乱
- ✅ 支持自动重连
:::

### WebSocket 配置

当 `type` 选择为 `websocket` 时，需要配置以下项：

* **`serverPath`**: (字符串)
  * **描述**: 云湖 WebSocket 服务器地址。
  * **默认值**: `wss://ws.jwzhd.com/subscribe`
  * **建议**: 通常无需修改

### Webhook 配置

当 `type` 选择为 `webhook` 时，需要配置以下项：

* **`path`**: (字符串)
  * **描述**: 本机接收 Webhook 事件的监听路径。
  * **默认值**: `/yunhu`

:::warning
**关于 Webhook 路径的重要说明**

使用 Webhook 方式时，如果您需要运行多个云湖机器人实例：

- 每个实例必须配置**不同的监听路径**
- 相同的路径会导致消息混乱

**推荐做法**：使用 Koishi 的多开插件功能，为每个机器人实例配置不同的路径。

例如：
- 机器人实例 1：`/yunhu1`
- 机器人实例 2：`/yunhu2`

**为什么会混乱？**

云湖的 Webhook 推送没有身份验证机制，使用相同路径会导致所有机器人收到相同的消息。
:::

## 进阶设置

### 文件上传超时时间 (`uploadTimeout`)

* **`uploadTimeout`**: (数字)
  * **描述**: 下载/上传文件的超时时间（秒）。
  * **默认值**: `120`
  * **范围**: 30-3600 秒
  * **步长**: 1 秒

### 音频背景颜色 (`audioBackgroundColor`)

* **`audioBackgroundColor`**: (字符串)
  * **描述**: 音频转为视频时使用的背景颜色。
  * **默认值**: `rgba(0, 0, 0, 1)`
  * **注意**: 仅RGB通道生效，A通道（透明度）不生效

## 网络请求设置

### 最大重试次数 (`maxRetries`)

* **`maxRetries`**: (数字)
  * **描述**: 网络请求失败时的最大重试次数。
  * **���认值**: `3`
  * **范围**: 1-10 次
  * **步长**: 1 次

## 流式消息设置

### 是否开启流式消息 (`enableStream`)

* **`enableStream`**: (布尔值)
  * **描述**: 是否开启流式消息。开启后，文本、Markdown消息将以流式消息方式发送。
  * **默认值**: `false`
  * **实验性功能**: 是

:::warning
流式消息是实验性功能，不推荐在生产环境中开启。
:::

### 流式消息总时长 (`streamDuration`)

* **`streamDuration`**: (数字)
  * **描述**: 流式消息总时长（秒）。数值越小，发消息越快。流式消息将被标记为`本内容为AI生成，仅供参考`。
  * **默认值**: `2`
  * **范围**: 1-10 秒
  * **步长**: 1 秒
  * **注意**: 仅在 `enableStream` 为 `true` 时生效

## 界面设置

### 显示云湖控制台入口 (`showConsole`)

* **`showConsole`**: (布尔值)
  * **描述**: 是否在侧边栏显示云湖控制台入口。
  * **默认值**: `false`

## 连接设置

这些是与云湖 API 服务器连接相关的设置。

通常情况下，您**不需要修改**这些默认值。

* **`endpoint`**: (字符串)
  * **描述**: 云湖开放平台 API 的主地址。
  * **默认值**: `https://chat-go.jwzhd.com/open-apis/v1`

* **`endpointweb`**: (字符串)
  * **描述**: 云湖 Web API 的地址。
  * **默认值**: `https://chat-web-go.jwzhd.com/v1`

* **`resourceEndpoint`**: (字符串)
  * **描述**: 资源服务器地址。
  * **默认值**: `https://chat-img.jwznb.com/`

## 调试设置

### 日志调试模式 (`loggerinfo`)

* **`loggerinfo`**: (布尔值)
  * **描述**: 日志调试模式。开启后会输出详细的调试日志。
  * **默认值**: `false`
  * **实验性功能**: 是
  * **建议**: 仅在需要进行问题排查时开启，以免产生过多的日志。

## 多机器人配置

如果您需要运行多个云湖机器人，请使用 Koishi 的**多开插件功能**：

1. 在插件列表中找到 `adapter-yunhupro`
2. 点击「添加实例」按钮
3. 为每个实例配置不同的 Token

### WebSocket 方式

每个实例会独立建立 WebSocket 连接，无需额外配置，不会出现消息混乱。

### Webhook 方式

每个实例必须配置不同的监听路径（`path`），否则会导致消息混乱。

## 配置示例

### WebSocket 方式（推荐）

```yaml
token: "your_bot_token_here"
type: websocket
serverPath: wss://ws.jwzhd.com/subscribe
loggerinfo: false
uploadTimeout: 120
enableStream: false
maxRetries: 3
```

### Webhook 方式

```yaml
token: "your_bot_token_here"
type: webhook
path: /yunhu
loggerinfo: false
uploadTimeout: 120
enableStream: false
maxRetries: 3
```

## 常见问题

### Q: 为什么推荐使用 WebSocket 方式？

A: WebSocket 方式有以下优势：
- 无需公网 IP，本地开发更方便
- 不会出现消息混乱问题
- 支持自动重连，连接更稳定
- 配置更简单

### Q: 我可以同时使用 WebSocket 和 Webhook 吗？

A: 不可以。每个机器人实例只能选择一种连接方式。如果需要使用不同的连接方式，请创建多个插件实例。

### Q: Webhook 方式什么时候使用？

A: 如果您的部署环境有以下特点，可以考虑使用 Webhook：
- 已经有公网 IP 或域名
- 需要通过反向代理进行流量管理
- 有特殊的网络架构要求

### Q: 如何知道机器人的 ID？

A: 启动适配器后，查看 Koishi 控制台日志，会显示自动获取到的机器人 ID。您也可以在云湖客户端中查看机器人的个人资料。
