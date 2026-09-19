# 文件消息

`contentType` 设置为 `file`。

## Content 字段

| 字段 | 类型 | 是否必填 | 说明 |
| --- | --- | --- | --- |
| `fileKey` | `string` | 是 | 通过文件上传接口获得的文件 Key |
| `fileName` | `string` | 否 | 展示给用户的自定义文件名 |
| `buttons` | `Button[][]` | 否 | 消息按钮 |

## 示例

```json
{
  "recvId": "307149245",
  "recvType": "group",
  "contentType": "file",
  "content": {
    "fileKey": "uploaded-file-key",
    "fileName": "example.zip"
  }
}
```
