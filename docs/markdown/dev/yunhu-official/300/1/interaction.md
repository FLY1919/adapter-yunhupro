# 交互事件

交互事件包括快捷菜单操作和消息按钮点击。

## 事件类型

| 事件类型 | 说明 |
| --- | --- |
| `bot.shortcut.menu` | 聊天框上方的快捷菜单按钮事件 |
| `button.report.inline` | 消息中的 action 按钮点击事件 |

## 快捷菜单事件

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `botId` | `string` | 机器人 ID |
| `menuId` | `string` | 菜单 ID |
| `menuType` | `number` | 菜单类型 |
| `menuAction` | `number` | 菜单动作 |
| `chatId` | `string` | 聊天对象 ID |
| `chatType` | `string` | 聊天对象类型 |
| `senderType` | `string` | 发送者类型 |
| `senderId` | `string` | 发送者 ID |
| `sendTime` | `number` | 发送时间，Unix 秒时间戳 |

```json
{
  "version": "1.0",
  "header": {
    "eventId": "2c3c14181f0a4e59aef0308b272df071",
    "eventType": "bot.shortcut.menu",
    "eventTime": 1761936125985
  },
  "event": {
    "botId": "37090343",
    "menuId": "MNM1L2YC",
    "menuType": 1,
    "menuAction": 1,
    "chatId": "307149245",
    "chatType": "group",
    "senderType": "user",
    "senderId": "4827368",
    "sendTime": 1761936125
  }
}
```

## 消息按钮事件

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `time` | `number` | 事件时间，13 位毫秒时间戳 |
| `msgId` | `string` | 按钮所属消息 ID |
| `recvId` | `string` | 接收对象 ID |
| `recvType` | `string` | 接收对象类型 |
| `userId` | `string` | 点击按钮的用户 ID |
| `value` | `string` | 按钮点击时上报的值 |

```json
{
  "version": "1.0",
  "header": {
    "eventId": "f6e70610f8934d56afc31185b5aed6fa",
    "eventType": "button.report.inline",
    "eventTime": 1761936422152
  },
  "event": {
    "time": 1761936422147,
    "msgId": "a412dd8074c0467f99c3f8f411af269a",
    "recvId": "307149245",
    "recvType": "group",
    "userId": "4827368",
    "value": "action按钮"
  }
}
```
