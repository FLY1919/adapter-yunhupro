# 消息按钮

按钮可用于文本、图片、Markdown、HTML、文件、视频和 A2UI 消息。

## Button 对象

| 字段 | 类型 | 是否必填 | 说明 |
| --- | --- | --- | --- |
| `text` | `string` | 是 | 按钮文字 |
| `actionType` | `number` | 是 | `1` 跳转 URL，`2` 复制，`3` 点击上报 |
| `url` | `string` | 否 | `actionType` 为 `1` 时使用 |
| `value` | `string` | 否 | `actionType` 为 `2` 时复制到剪贴板，为 `3` 时发送给订阅端 |

## 完整示例

```json
{
  "recvId": "307149245",
  "recvType": "group",
  "contentType": "text",
  "content": {
    "text": "这里是消息内容",
    "buttons": [
      [
        {
          "text": "复制",
          "actionType": 2,
          "value": "xxxx"
        },
        {
          "text": "点击跳转",
          "actionType": 1,
          "url": "https://www.baidu.com"
        }
      ]
    ]
  }
}
```
