# HTML 消息

`contentType` 设置为 `html`。

## Content 字段

| 字段 | 类型 | 是否必填 | 说明 |
| --- | --- | --- | --- |
| `text` | `string` | 是 | HTML 字符串 |
| `buttons` | `Button[][]` | 否 | 消息按钮 |

## 示例

```json
{
  "recvId": "307149245",
  "recvType": "group",
  "contentType": "html",
  "content": {
    "text": "<h1>标题</h1><p>HTML 消息</p>"
  }
}
```

HTML 支持范围以云湖官方文档为准：<https://www.yhchat.com/c/p/863>
