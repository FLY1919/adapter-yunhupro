# 语音消息

云湖机器人的官方发送接口不提供可直接使用的 `audio` 消息类型。用户发送的语音可以在事件订阅结果中出现，但机器人不能直接通过上传音频 Key 发送语音消息。

适配器在发送 `<audio>` 元素时会将其转换为 A2UI `AudioPlayer` 组件：

```ts
await session.send(h('audio', {
  src: 'https://example.com/audio.mp3',
  name: '示例音频',
}));
```

具体发送行为见 [A2UI 消息](./a2ui)。
