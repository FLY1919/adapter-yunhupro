# 群成员事件

## 事件类型

| 事件类型 | 说明 |
| --- | --- |
| `group.join` | 用户加入群 |
| `group.leave` | 用户退出群 |

## 字段说明

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `time` | `number` | 事件时间，13 位毫秒时间戳 |
| `chatId` | `string` | 群 ID |
| `chatType` | `string` | 固定为 `group` |
| `userId` | `string` | 用户 ID |
| `nickname` | `string` | 用户昵称 |
| `avatarUrl` | `string` | 用户头像地址 |

## 加入群示例

```json
{
  "version": "1.0",
  "header": {
    "eventId": "87d128d3404048ada4e1004e4998f495",
    "eventType": "group.join",
    "eventTime": 1761936093582
  },
  "event": {
    "time": 1761936093347,
    "chatId": "307149245",
    "chatType": "group",
    "userId": "4827368",
    "nickname": "小小学？",
    "avatarUrl": "https://chat-storage1.jwznb.com/a0068c6770fe2df08d1923287bb9cdbf.jpg?sign=b5a523cca7ce43349e483c706b0fc50d&t=690510ed"
  }
}
```

## 退出群示例

```json
{
  "version": "1.0",
  "header": {
    "eventId": "b9e4effa6f3e492e8f0af9582d196ede",
    "eventType": "group.leave",
    "eventTime": 1761935761230
  },
  "event": {
    "time": 1761935761198,
    "chatId": "307149245",
    "chatType": "group",
    "userId": "4827368",
    "nickname": "小小学？",
    "avatarUrl": "https://chat-storage1.jwznb.com/a0068c6770fe2df08d1923287bb9cdbf.jpg?sign=1c3e223f5a39cc7bb3720eb4946664fd&t=69050fa1"
  }
}
```
