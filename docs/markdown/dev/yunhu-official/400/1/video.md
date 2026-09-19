# 视频消息

`contentType` 设置为 `video`。

## Content 字段

| 字段 | 类型 | 是否必填 | 说明 |
| --- | --- | --- | --- |
| `videoKey` | `string` | 是 | 通过视频上传接口获得的视频 Key |
| `buttons` | `Button[][]` | 否 | 消息按钮 |

## 示例

```json
{
  "recvId": "307149245",
  "recvType": "group",
  "contentType": "video",
  "content": {
    "videoKey": "uploaded-video-key"
  }
}
```

上传的视频必须包含有效画面。
