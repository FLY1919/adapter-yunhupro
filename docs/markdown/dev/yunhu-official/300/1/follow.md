# 机器人关注事件

## 事件类型

| 事件类型 | 说明 |
| --- | --- |
| `bot.followed` | 用户关注机器人 |
| `bot.unfollowed` | 用户取消关注机器人 |

## 字段说明

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `time` | `number` | 事件时间，13 位毫秒时间戳 |
| `chatId` | `string` | 机器人 ID |
| `chatType` | `string` | 固定为 `bot` |
| `userId` | `string` | 用户 ID |
| `nickname` | `string` | 用户昵称 |
| `avatarUrl` | `string` | 用户头像地址 |

## 关注机器人示例

```json
{
  "version": "1.0",
  "header": {
    "eventId": "8e3c15c090894cedb5df2032daf6839f",
    "eventType": "bot.followed",
    "eventTime": 1761936136441
  },
  "event": {
    "time": 1761936136291,
    "chatId": "37090343",
    "chatType": "bot",
    "userId": "4827368",
    "nickname": "小小学？",
    "avatarUrl": "https://chat-storage1.jwznb.com/a0068c6770fe2df08d1923287bb9cdbf.jpg?sign=479a3fc9b52f670fbaf8f389c4753afe&t=69051118"
  }
}
```

## 取消关注机器人示例

```json
{
  "version": "1.0",
  "header": {
    "eventId": "3650dec0bc7b43c1b615145f80ca4634",
    "eventType": "bot.unfollowed",
    "eventTime": 1761936347220
  },
  "event": {
    "time": 1761936347111,
    "chatId": "37090343",
    "chatType": "bot",
    "userId": "4827368",
    "nickname": "小小学？",
    "avatarUrl": "https://chat-storage1.jwznb.com/a0068c6770fe2df08d1923287bb9cdbf.jpg?sign=22f03dfca81db75490589dcd186920b3&t=690511eb"
  }
}
```
