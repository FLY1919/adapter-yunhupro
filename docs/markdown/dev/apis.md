# APIs

## 获取 Bot 实例

以下所有 bot 均通过这样获取：

```typescript
//  import { Universal, Bot } from "koishi";
const bot = (Object.values(ctx.bots) as Bot[]).find(b => b.selfId === "botId" || b.user?.id === "botId");
if (!bot || bot.status !== Universal.Status.ONLINE) {
  ctx.logger.error(`机器人离线或未找到。`);
  return;
}
if (bot == null) return;

// 在这里继续使用 bot.方法
```

## Bot 方法

### sendMessage()

发送消息到指定的频道。这是 Koishi 的标准方法，适配器实现了其具体逻辑。

```typescript
bot.sendMessage(channelId: string, content: Fragment, guildId?: string, options?: SendOptions): Promise<string[]>
```

* **`channelId`**: 频道 ID。对于私聊，格式为 `private:USER_ID`；对于群聊，格式为 `group:GROUP_ID`。
* **`content`**: 要发送的消息内容，可以是字符串或使用 `h()` 创建的消息元素。
* **`guildId`**: (可选) 群组 ID。
* **`options`**: (可选) 发送选项。
* **返回值**: `Promise<string[]>`，包含已发送消息的 ID 列表。

### deleteMessage()

撤回（删除）一条已发送的消息。

```typescript
bot.deleteMessage(channelId: string, messageId: string): Promise<void>
```

* **`channelId`**: 消息所在的频道 ID。
* **`messageId`**: 要删除的消息 ID。
* **返回值**: `Promise<void>`。

### editMessage()

编辑已发送的消息。

```typescript
bot.editMessage(channelId: string, messageId: string, content: Fragment): Promise<void>
```

* **`channelId`**: 消息所在的频道 ID。
* **`messageId`**: 要编辑的消息 ID。
* **`content`**: 新的消息内容，可以是字符串或使用 `h()` 创建的消息元素。
* **返回值**: `Promise<void>`。

### getMessage()

获取单条消息的详细信息。

```typescript
bot.getMessage(channelId: string, messageId: string): Promise<Universal.Message>
```

* **`channelId`**: 消息所在的频道 ID。
* **`messageId`**: 要获取的消息 ID。
* **返回值**: `Promise<Universal.Message>`，一个符合 Koishi 规范的消息对象。

### getUser()

获取用户的详细信息。

```typescript
bot.getUser(userId: string): Promise<Universal.User>
```

* **`userId`**: 要查询的用户 ID。
* **返回值**: `Promise<Universal.User>`，一个符合 Koishi 规范的用户对象。

### getGuild()

获取群组（服务器）的详细信息。

```typescript
bot.getGuild(guildId: string): Promise<Universal.Guild>
```

* **`guildId`**: 要查询的群组 ID。
* **返回值**: `Promise<Universal.Guild>`，一个符合 Koishi 规范的群组对象。

### getGuildMember()

获取群组成员的详细信息。

```typescript
bot.getGuildMember(guildId: string, userId: string): Promise<Universal.GuildMember>
```

* **`guildId`**: 成员所在的群组 ID。
* **`userId`**: 要查询的成员的用户 ID。
* **返回值**: `Promise<Universal.GuildMember>`，一个符合 Koishi 规范的群组成员对象。

### getChannel()

获取频道（子频道）的详细信息。在云湖中，一个群组就是一个频道。

```typescript
bot.getChannel(channelId: string, guildId?: string): Promise<Universal.Channel>
```

* **`channelId`**: 要查询的频道 ID。
* **`guildId`**: (可选) 频道所在的群组 ID。
* **返回值**: `Promise<Universal.Channel>`，一个符合 Koishi 规范的频道对象。

### start()

启动机人。

```typescript
bot.start(): Promise<void>
```

* **返回值**: `Promise<void>`。

### stop()

停止机器人。

```typescript
bot.stop(): Promise<void>
```

* **返回值**: `Promise<void>`。

### setDisposing()

设置机器人状态。

```typescript
bot.setDisposing(disposing: boolean): void
```

* **`disposing`**: 是否正在处理中。
* **返回值**: `void`。

### logInfo()

记录信息日志（仅在配置开启时记录）。

```typescript
bot.logInfo(...args: any[]): void
```

* **`args`**: 日志参数。
* **返回值**: `void`。

### loggerInfo()

记录信息日志。

```typescript
bot.loggerInfo(...args: any[]): void
```

* **`args`**: 日志参数。
* **返回值**: `void`。

### loggerError()

记录错误日志。

```typescript
bot.loggerError(...args: any[]): void
```

* **`args`**: 日志参数。
* **返回值**: `void`。

### muteGuildMember()

禁言群成员。

```typescript
bot.muteGuildMember(guildId: string, userId: string, duration: number, reason?: string): Promise<void>
```

* **`guildId`**: 群组 ID。
* **`userId`**: 要禁言的用户 ID。
* **`duration`**: 禁言时长（秒）。
  * `0`: 解除禁言
  * `600`: 禁言10分钟
  * `3600`: 禁言1小时
  * `21600`: 禁言6小时
  * `43200`: 禁言12小时
  * `-1`: 永久禁言
* **`reason`**: (可选) 禁言原因。
* **返回值**: `Promise<void>`。

**权限要求**: 机器人需要在该群聊中，且拥有允许禁言用户权限（allowGagMember = 1）。

### kickGuildMember()

移除群成员。

```typescript
bot.kickGuildMember(guildId: string, userId: string, permanent?: boolean): Promise<void>
```

* **`guildId`**: 群组 ID。
* **`userId`**: 要移除的用户 ID。
* **`permanent`**: (可选) 是否永久移除。
* **返回值**: `Promise<void>`。

**权限要求**: 机器人需要在该群聊中，且拥有允许移除群成员权限（allowRemoveMember = 1）。

**注意**: 不可以移除群主。

### setGuildMemberRole()

给用户添加群组角色（标签）。

```typescript
bot.setGuildMemberRole(guildId: string, userId: string, roleId: string): Promise<void>
```

* **`guildId`**: 群组 ID。
* **`userId`**: 用户 ID。
* **`roleId`**: 角色 ID的标签名称）。
* **返回值**: `Promise<void>`。

**权限要求**: 机器人需要在该群聊中，且拥有允许控制标签组权限（allowGroupTagManage = 1）。

**事件**: 调用成功后会触发 `guild-role-created` 事件。

### unsetGuildMemberRole()

移除用户的群组角色（标签）。

```typescript
bot.unsetGuildMemberRole(guildId: string, userId: string, roleId: string): Promise<void>
```

* **`guildId`**: 群组 ID。
* **`userId`**: 用户 ID。
* **`roleId`**: 角色 ID（标签名称）。
* **返回值**: `Promise<void>`。

**权限要求**: 机器人需要在该群聊中，且拥有允许控制标签组权限（allowGroupTagManage = 1）。

**事件**: 调用成功后会触发 `guild-role-deleted` 事件。

### getGuildRoleList()

获取群组角色（标签）列表。

```typescript
bot.getGuildRoleList(guildId: string, next?: string): Promise<Universal.List<Universal.GuildRole>>
```

* **`guildId`**: 群组 ID。
* **`next`**: (可选) 分页令牌（暂不支持）。
* **返回值**: `Promise<Universal.List<Universal.GuildRole>>`，角色列表。

**权限要求**: 机器人需要在该群聊中。

**返回数据结构**:
```typescript
{
  data: [
    { id: "标签名称", name: "标签名称" },
    ...
  ],
  next: undefined
}
```

### createGuildRole()

创建群组角色（标签）。

```typescript
bot.createGuildRole(guildId: string, data: Partial<Universal.GuildRole>): Promise<Universal.GuildRole>
```

* **`guildId`**: 群组 ID。
* **`data`**: 角色信息。
  * `name`: 角色名称（最长9个字符）。
  * `id`: 角色 ID（可选，默认使用 name）。
* **返回值**: `Promise<Universal.GuildRole>`，创建的角色对象。

**权限要求**: 机器人需要在该群聊中，且拥有允许控制标签组权限（allowGroupTagManage = 1）。

**事件**: 调用成功后会触发 `guild-role-created` 事件。

**示例**:
```typescript
const role = await bot.createGuildRole('307149245', { name: 'VIP用户' });
// 返回: { id: 'VIP用户', name: 'VIP用户' }
```

### updateGuildRole()

修改群组角色（标签）。

```typescript
bot.updateGuildRole(guildId: string, roleId: string, data: Partial<Universal.GuildRole>): Promise<void>
```

* **`guildId`**: 群组 ID。
* **`roleId`**: 要修改的角色 ID（标签名称）。
* **`data`**: 新的角色信息。
  * `name`: 新的角色名称（可选）。
* **返回值**: `Promise<void>`。

**权限要求**: 机器人需要在该群聊中，且拥有允许控制标签组权限（allowGroupTagManage = 1）。

**事件**: 调用成功后会触发 `guild-role-updated` 事件。

**示例**:
```typescript
await bot.updateGuildRole('307149245', 'VIP用户', { name: 'SVIP用户' });
```

### deleteGuildRole()

删除群组角色（标签）。

```typescript
bot.deleteGuildRole(guildId: string, roleId: string): Promise<void>
```

* **`guildId`**: 群组 ID。
* **`roleId`**: 要删除的角色 ID（标签名称）。
* **返回值**: `Promise<void>`。

**权限要求**: 机器人需要在该群聊中，且拥有允许控制标签组权限（allowGroupTagManage = 1）。

**事件**: 调用成功后会触发 `guild-role-deleted` 事件。

## Bot.Internal 方法

### getYunhuMessageList()

获取云湖原始的消息列表。

```typescript
bot.internal.getYunhuMessageList(channelId: string, messageId: string, options?: { before?: number; after?: number }): Promise<any>
```

* **`channelId`**: 消息所在的频道 ID。
* **`messageId`**: 作为基准点的消息 ID。
* **`options`**: 可选参数。
  * `before`: 获取 `messageId` 之前的消息数量。
  * `after`: 获取 `messageId` 之后的消息数量。
* **返回值**: `Promise<any>`，云湖 API 返回的原始消息列表数据。

### uploadImage()

上传一张图片，仅返回URL。

```typescript
bot.internal.uploadImage(image: string | Buffer): Promise<string>
```

* **`image`**: 图片资源，可以是图片的 URL (字符串) 或 Buffer。
* **返回值**: `Promise<string>`，上传成功后返回的图片URL。

### uploadImageKey()

上传一张图片，获取图片的URL和key。

:::tip
`key` 是用于发送云湖消息的重要参数，用于适配器发送消息使用。

一般情况下，其他插件上传文件时 无需获取key值，仅获取URL即可。

**即：一般调用 `uploadImage` 即可**

下面几个API接口也是同样的设计，不再赘述。
:::

```typescript
bot.internal.uploadImageKey(image: string | Buffer): Promise<{ url: string; key: string; }>
```

* **`image`**: 图片资源，可以是图片的 URL (字符串) 或 Buffer。
* **返回值**: `Promise<{ url: string; key: string; }>`，上传成功后返回的图片URL和key。

### uploadVideo()

上传一个视频，仅返回URL。

```typescript
bot.internal.uploadVideo(video: string | Buffer): Promise<string>
```

* **`video`**: 视频资源，可以是视频的 URL (字符串) 或 Buffer。
* **返回值**: `Promise<string>`，上传成功后返回的视频URL。

### uploadVideoKey()

上传一个视频，获取视频的URL和key。

```typescript
bot.internal.uploadVideoKey(video: string | Buffer): Promise<{ url: string; key: string; }>
```

* **`video`**: 视频资源，可以是视频的 URL (字符串) 或 Buffer。
* **返回值**: `Promise<{ url: string; key: string; }>`，上传成功后返回的视频URL和key。

### uploadAudio()

上传一个音频，仅返回URL。

```typescript
bot.internal.uploadAudio(audio: string | Buffer): Promise<string>
```

* **`audio`**: 音频资源，可以是音频的 URL (字符串) 或 Buffer。
* **返回值**: `Promise<string>`，上传成功后返回的音频URL。

### uploadAudioKey()

上传一个音频，获取音频的URL和key。

```typescript
bot.internal.uploadAudioKey(audio: string | Buffer): Promise<{ url: string; key: string; }>
```

* **`audio`**: 音频资源，可以是音频的 URL (字符串) 或 Buffer。
* **返回值**: `Promise<{ url: string; key: string; }>`，上传成功后返回的音频URL和key。

### uploadFile()

上传一个文件，仅返回URL。

```typescript
bot.internal.uploadFile(file: string | Buffer): Promise<string>
```

* **`file`**: 文件资源，可以是文件的 URL (字符串) 或 Buffer。
* **返回值**: `Promise<string>`，上传成功后返回的文件URL。

### uploadFileKey()

上传一个文件，获取文件的URL和key。

```typescript
bot.internal.uploadFileKey(file: string | Buffer): Promise<{ url: string; key: string; }>
```

* **`file`**: 文件资源，可以是文件的 URL (字符串) 或 Buffer。
* **返回值**: `Promise<{ url: string; key: string; }>`，上传成功后返回的文件URL和key。

### getBotInfo()

获取机器人的详细信息。

```typescript
bot.internal.getBotInfo(botId: string): Promise<any>
```

* **`botId`**: 要查询的机器人 ID。
* **返回值**: `Promise<any>`，API 返回的机器人信息数据。

### setBoard()

为指定用户设置看板（个人看板）。

```typescript
bot.internal.setBoard(chatId: string, contentType: 'text' | 'markdown' | 'html', content: string, options?: { memberId?: string; expireTime?: number }): Promise<any>
```

* **`chatId`**: 对话 ID (私聊为用户 ID，群聊为群组 ID)。
* **`contentType`**: 内容类型。
* **`content`**: 看板内容。
* **`options`**:
  * `memberId`: 要设置看板的用户 ID。
  * `expireTime`: (可选) 过期时间戳 (秒)。
* **返回值**: `Promise<any>`，API 返回的原始数据。

### setAllBoard()

设置全局看板（对群内所有人生效）。

```typescript
bot.internal.setAllBoard(chatId: string, contentType: 'text' | 'markdown' | 'html', content: string, options?: { expireTime?: number }): Promise<any>
```

* **`chatId`**: 群组 ID。
* **`contentType`**: 内容类型。
* **`content`**: 看板内容。
* **`options`**:
  * `expireTime`: (可选) 过期时间戳 (秒)。
* **返回值**: `Promise<any>`，API 返回的原始数据。

### dismissBoard()

取消指定用户的看板。

```typescript
bot.internal.dismissBoard(chatId: string, chatType: 'user' | 'group', memberId?: string): Promise<any>
```

* **`chatId`**: 对话 ID。
* **`chatType`**: 对话类型。
* **`memberId`**: (可选) 要取消看板的用户 ID。如果 `chatType` 为 `user`，则此项必填。
* **返回值**: `Promise<any>`，API 返回的原始数据。

### dismissAllBoard()

取消全局看板。

```typescript
bot.internal.dismissAllBoard(): Promise<any>
```

* **返回值**: `Promise<any>`，API 返回的原始数据。

### setGroupMessageTypeLimit()

设置群内消息类型限制。这是云湖特有的功能，用于控制群内允许发送的消息类型。

```typescript
bot.internal.setGroupMessageTypeLimit(guildId: string, types: string[]): Promise<void>
```

* **`guildId`**: 群组 ID。
* **`types`**: 允许的消息类型数组。可选值：
  * `'text'`: 文本消息
  * `'image'`: 图片消息
  * `'video'`: 视频消息
  * `'audio'`: 音频消息
  * `'file'`: 文件消息
  * `'markdown'`: Markdown 消息
  * `'ark'`: ARK 消息
  * `'embed'`: Embed 消息
  * 传入空数组 `[]` 表示不限制消息类型
* **返回值**: `Promise<void>`。

**权限要求**: 机器人需要在该群聊中，且拥有管理群聊的权限。

## 使用示例

### 禁言和踢出成员

```typescript
// 禁言用户 10 分钟
await bot.muteGuildMember('群组ID', '用户ID', 600);

// 永久禁言
await bot.muteGuildMember('群组ID', '用户ID', -1);

// 解除禁言
await bot.muteGuildMember('群组ID', '用户ID', 0);

// 踢出群成员
await bot.kickGuildMember('群组ID', '用户ID');
```

### 群组角色（标签）管理

```typescript
// 获取群组角色列表
const roleList = await bot.getGuildRoleList('群组ID');
console.log('角色列表:', roleList.data);

// 创建新角色
const newRole = await bot.createGuildRole('群组ID', {
  name: '管理员',
});
console.log('创建的角色:', newRole);

// 更新角色信息
await bot.updateGuildRole('群组ID', '角色ID', {
  name: '超级管理员',
});

// 为用户添加角色
await bot.setGuildMemberRole('群组ID', '用户ID', '角色ID');

// 移除用户的角色
await bot.unsetGuildMemberRole('群组ID', '用户ID', '角色ID');

// 删除角色
await bot.deleteGuildRole('群组ID', '角色ID');
```

### 消息类型控制

```typescript
// 只允许文本消息
await bot.internal.setGroupMessageTypeLimit('群组ID', ['text']);

// 允许文本和图片
await bot.internal.setGroupMessageTypeLimit('群组ID', ['text', 'image']);

// 不限制消息类型
await bot.internal.setGroupMessageTypeLimit('群组ID', []);
```

### 监听角色事件

```typescript
// 监听角色创建事件
ctx.on('guild-role-created', (session) => {
  console.log('角色已创建:', session.event.role);
});

// 监听角色更新事件
ctx.on('guild-role-updated', (session) => {
  console.log('角色已更新:', session.event.role);
});

// 监听角色删除事件
ctx.on('guild-role-deleted', (session) => {
  console.log('角色已删除:', session.event.role);
});
```
