# 发送 A2UI 消息

适配器提供 `a2ui` 和 `yunhu:a2ui` 两个等价的消息元素。发送时传入的是 JSON 对象或 JSON 对象数组，不是 JSON 字符串。

## 单条 JSON

传入一个 JSON 对象时，适配器会将它转换为 JSON 代码块：

```ts
const message = {
  version: 'v0.9',
  createSurface: {
    surfaceId: 'main',
    catalogId: 'https://a2ui.org/specification/v0_9/basic_catalog.json',
    sendDataModel: true,
  },
};

await session.send(h('a2ui', message));
```

`yunhu:a2ui` 完全等价：

```ts
await session.send(h('yunhu:a2ui', message));
```

## 多条 JSON

Koishi 的 `h()` 不支持将多个普通对象直接作为子参数，因此多条消息使用 `content` 数组：

```ts
const messages = [
  {
    version: 'v0.9',
    createSurface: {
      surfaceId: 'main',
      catalogId: 'https://a2ui.org/specification/v0_9/basic_catalog.json',
      sendDataModel: true,
    },
  },
  {
    version: 'v0.9',
    updateComponents: {
      surfaceId: 'main',
      components: [
        {
          id: 'root',
          component: 'Text',
          text: 'Hello A2UI',
        },
      ],
    },
  },
];

await session.send(h('a2ui', {
  content: messages,
}));
```

适配器会依次处理数组中的对象，在 `content.text` 中生成：

````text
```json
{"version":"v0.9","createSurface":{}}
```

```json
{"version":"v0.9","updateComponents":{}}
```
````

## 字符串不受支持

调用方不需要、也不应该手动拼接 JSON 字符串或 Markdown 代码块。以下写法会被适配器拒绝：

```ts
// 错误：字符串不是 A2UI JSON 对象
await session.send(h('a2ui', '{"version":"v0.9"}'));
```

必须传入对象：

```ts
await session.send(h('a2ui', {
  version: 'v0.9',
}));
```

## 音频播放器

发送 `AudioPlayer` 时，将 `createSurface` 和 `updateComponents` 两个对象放入 `content` 数组：

```ts
await session.send(h('a2ui', {
  content: [
    {
      version: 'v0.9',
      createSurface: {
        surfaceId: 'audio-example',
        catalogId: 'https://a2ui.org/specification/v0_9/basic_catalog.json',
        sendDataModel: true,
      },
    },
    {
      version: 'v0.9',
      updateComponents: {
        surfaceId: 'audio-example',
        components: [
          {
            id: 'root',
            component: 'Column',
            children: ['player'],
          },
          {
            id: 'player',
            component: 'AudioPlayer',
            url: 'https://example.com/audio.mp3',
            description: '示例音频',
          },
        ],
      },
    },
  ],
}));
```

## 平台限制

`a2ui` 和 `yunhu:a2ui` 只应由云湖适配器处理。适配器最终发送以下负载：

```ts
{
  recvId,
  recvType,
  contentType: 'a2ui',
  content: {
    text,
  },
}
```

其中 `text` 由适配器根据传入的 JSON 对象自动生成。
