# 图片消息

`contentType` 设置为 `image`。

## Content 字段

| 字段 | 类型 | 是否必填 | 说明 |
| --- | --- | --- | --- |
| `imageKey` | `string` | 是 | 通过[图片上传](https://www.yhchat.com/document/400-452)接口获得的图片 Key |
| `buttons` | `Button[][]` | 否 | 消息按钮 |

## 示例

```json
{
  "recvId": "307149245",
  "recvType": "group",
  "contentType": "image",
  "content": {
    "imageKey": "uploaded-image-key"
  }
}
```
