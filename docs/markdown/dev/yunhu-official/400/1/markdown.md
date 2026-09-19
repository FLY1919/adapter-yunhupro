# Markdown 消息

`contentType` 设置为 `markdown`。

## Content 字段

| 字段 | 类型 | 是否必填 | 说明 |
| --- | --- | --- | --- |
| `text` | `string` | 是 | Markdown 字符串 |
| `buttons` | `Button[][]` | 否 | 消息按钮 |

## 示例

```json
{
  "recvId": "307149245",
  "recvType": "group",
  "contentType": "markdown",
  "content": {
    "text": "# 标题\n\n这是 **Markdown** 消息。"
  }
}
```
