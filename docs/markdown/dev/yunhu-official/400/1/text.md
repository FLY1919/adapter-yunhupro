# 文本消息

`contentType` 设置为 `text`。

## Content 字段

| 字段 | 类型 | 是否必填 | 说明 |
| --- | --- | --- | --- |
| `text` | `string` | 是 | 消息正文 |
| `at` | `string[]` | 否 | 被 `@` 的用户 ID 列表 |
| `buttons` | `Button[][]` | 否 | 消息按钮 |

## @ 用户

`at` 数组按消息中 `@` 用户出现的顺序排列，允许重复。消息中的用户标记必须以零宽空格 `U+200B` 结束。

```json
{
  "recvId": "307149245",
  "recvType": "group",
  "contentType": "text",
  "content": {
    "text": "@小学不在这里哦​ 你好啊！我at你了",
    "at": ["7756242"]
  }
}
```

多个用户和重复 `@`：

```json
{
  "recvId": "307149245",
  "recvType": "group",
  "contentType": "text",
  "content": {
    "text": "你好@小学云bot ​，我饿了@小学不在这里哦 ​，一起去吃饭吧@小学云bot ​。",
    "at": ["37090343", "7756242", "37090343"]
  }
}
```

用户名包含空格时，仍然使用零宽空格作为结束标志：

```json
{
  "recvId": "307149245",
  "recvType": "group",
  "contentType": "text",
  "content": {
    "text": "@yunhu test bot ​你好啊",
    "at": ["86297657"]
  }
}
```
