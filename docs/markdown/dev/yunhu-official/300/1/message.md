# 消息事件

消息事件用于接收用户发送的普通消息和斜线指令。

## 事件类型

| 事件类型 | 说明 |
| --- | --- |
| `message.receive.normal` | 用户发送普通消息 |
| `message.receive.instruction` | 用户触发机器人斜线指令 |

## 数据结构

### Sender

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `senderId` | `string` | 发送者 ID |
| `senderType` | `string` | 发送者类型，取值为 `user` |
| `senderUserLevel` | `string` | 发送者级别：`owner`、`administrator`、`member`、`unknown` |
| `senderNickname` | `string` | 发送者昵称 |

### Chat

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `chatId` | `string` | 聊天对象 ID |
| `chatType` | `string` | 聊天对象类型：`bot` 或 `group` |

### Message

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `msgId` | `string` | 消息 ID |
| `parentId` | `string` | 引用消息的父消息 ID |
| `sendTime` | `number` | 发送时间，13 位毫秒时间戳 |
| `chatId` | `string` | 当前聊天对象 ID |
| `chatType` | `string` | 当前聊天对象类型 |
| `contentType` | `string` | 消息内容类型，例如 `text`、`image`、`markdown`、`file` |
| `content` | `Content` | 消息正文 |
| `commandId` | `number` | 指令 ID |
| `commandName` | `string` | 指令名称 |

## 普通消息示例

```json
{
  "version": "1.0",
  "header": {
    "eventId": "f10b35f5ea3b46968eeb44a858c1e0e9",
    "eventType": "message.receive.normal",
    "eventTime": 1761936492340
  },
  "event": {
    "sender": {
      "senderId": "7756242",
      "senderType": "user",
      "senderUserLevel": "owner",
      "senderNickname": "小小学？"
    },
    "chat": {
      "chatId": "307149245",
      "chatType": "group"
    },
    "message": {
      "msgId": "2a50d66c747f4d119fe49fa531390e93",
      "parentId": "",
      "sendTime": 1761936492319,
      "chatId": "307149245",
      "chatType": "group",
      "contentType": "text",
      "content": {
        "text": "你好啊，第一次在这里发言",
        "menu": {}
      },
      "instructionId": 0,
      "instructionName": "",
      "commandId": 0,
      "commandName": ""
    }
  }
}
```

## 指令消息示例

```json
{
  "version": "1.0",
  "header": {
    "eventId": "6853aad18d0045ab8f05d89e3fb4c35b",
    "eventType": "message.receive.instruction",
    "eventTime": 1761936520039
  },
  "event": {
    "sender": {
      "senderId": "7756242",
      "senderType": "user",
      "senderUserLevel": "owner",
      "senderNickname": "小小学？"
    },
    "chat": {
      "chatId": "307149245",
      "chatType": "group"
    },
    "message": {
      "msgId": "7bc20ab6113948c487e19c9394cd22ee",
      "parentId": "",
      "sendTime": 1761936520009,
      "chatId": "307149245",
      "chatType": "group",
      "contentType": "text",
      "content": {
        "text": "这是普通指令的默认文字",
        "menu": {}
      },
      "instructionId": 2104,
      "instructionName": "这是普通指令",
      "commandId": 2104,
      "commandName": "这是普通指令"
    }
  }
}
```
