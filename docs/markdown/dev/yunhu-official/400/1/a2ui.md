# A2UI 消息

`contentType` 设置为 `a2ui`，`content.text` 中放置由 A2UI JSON 对象生成的 JSONL 内容。

::: warning
调用 Koishi 的 `h('a2ui')` 时必须传入 JSON 对象或 JSON 对象数组，不能传入 JSON 字符串。适配器负责把对象序列化为 `content.text`。
:::

## 消息结构

```json
{
  "recvId": "307149245",
  "recvType": "group",
  "contentType": "a2ui",
  "content": {
    "text": "```json\n{\"version\":\"v0.9\",\"createSurface\":{\"surfaceId\":\"main\",\"catalogId\":\"https://a2ui.org/specification/v0_9/basic_catalog.json\",\"sendDataModel\":true}}\n```\n\n```json\n{\"version\":\"v0.9\",\"updateComponents\":{\"surfaceId\":\"main\",\"components\":[{\"id\":\"root\",\"component\":\"Text\",\"text\":\"Hello A2UI\"}]}}\n```"
  }
}
```

## 音频播放器

适配器会为音频元素自动生成以下 A2UI 内容：

```json
{
  "version": "v0.9",
  "createSurface": {
    "surfaceId": "audio-example",
    "catalogId": "https://a2ui.org/specification/v0_9/basic_catalog.json",
    "sendDataModel": true
  }
}
```

```json
{
  "version": "v0.9",
  "updateComponents": {
    "surfaceId": "audio-example",
    "components": [
      {
        "id": "root",
        "component": "Column",
        "children": ["player"]
      },
      {
        "id": "player",
        "component": "AudioPlayer",
        "url": "https://example.com/audio.mp3",
        "description": "示例音频"
      }
    ]
  }
}
```

在 Koishi 插件中推荐直接使用适配器提供的消息元素，详见 [发送 A2UI 消息](../../../a2ui)。
