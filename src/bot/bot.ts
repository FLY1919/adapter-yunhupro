import { Bot, Context, Fragment, Logger, Universal } from 'koishi';
import { BidiList, Direction, Order, SendOptions } from '@satorijs/protocol';
import { Buffer } from 'node:buffer';
import { Config, DEFAULT_EXTERNAL_MEDIA_PROXY_BASE_URL } from '../config';
import { YunhuMessageEncoder } from './message';
import { fragmentToPayload } from './message';
import { Internal } from './internal';
import { BotHttp } from './http';
import { getMediaProxyUrl } from '../utils/media-proxy';

const logger = new Logger('adapter-yunhupro');

export class YunhuBot extends Bot<Context, Config>
{
  static inject = ['server'];
  static MessageEncoder = YunhuMessageEncoder;
  public internal: Internal;
  public http: BotHttp;
  private Encoder: YunhuMessageEncoder;
  private isDisposing = false;

  constructor(public ctx: Context, config: Config)
  {
    super(ctx, config, 'yunhu');
    this.platform = 'yunhu';
    this.selfId = ''; // 初始为空，稍后通过API获取

    // 创建Bot HTTP实例
    this.http = new BotHttp(this, this.config.endpoint, this.config.endpointweb);

    // 初始化内部接口
    this.internal = new Internal(config.token, this.config.endpoint, this);
    this.Encoder = new YunhuMessageEncoder(this, config.token);
  }

  async getUser(userId: string)
  {
    return this.internal.getUser(userId);
  }

  async getGuildMember(guildId: string, userId: string)
  {
    return this.internal.getGuildMember(guildId, userId);
  }

  // 平台未提供好友列表接口，返回空列表避免调用报错
  async getFriendList(next?: string): Promise<Universal.List<Universal.Friend>>
  {
    return { data: [] };
  }

  // 平台未提供群组列表接口，返回空列表避免调用报错
  async getGuildList(next?: string): Promise<Universal.List<Universal.Guild>>
  {
    return { data: [] };
  }

  // 平台未提供群成员列表接口，返回空列表避免调用报错
  async getGuildMemberList(guildId: string, next?: string): Promise<Universal.List<Universal.GuildMember>>
  {
    return { data: [] };
  }

  async getGuild(guildId: string)
  {
    return this.internal.getGuild(guildId);
  }

  async getChannel(channelId: string, guildId?: string)
  {
    return this.internal.getChannel(channelId, guildId);
  }

  // 平台未提供频道列表接口，返回空列表避免调用报错
  async getChannelList(guildId: string, next?: string): Promise<Universal.List<Universal.Channel>>
  {
    return { data: [] };
  }

  buildExternalMediaUrl(mediaUrl: string): string
  {
    // 测试云湖客户端直接渲染原始 URL 时，取消下一行注释以跳过反代。
    // return mediaUrl;

    const baseUrl = this.config.externalMediaProxyBaseUrl?.trim() || DEFAULT_EXTERNAL_MEDIA_PROXY_BASE_URL;
    const url = new URL(baseUrl);
    url.searchParams.set('url', mediaUrl);
    return url.toString();
  }

  async deleteMessage(channelId: string, messageId: string)
  {
    return this.internal.deleteMessage(channelId, messageId);
  }

  async getMessage(channelId: string, messageId: string)
  {
    return this.internal.getMessage(channelId, messageId);
  }

  // 使用平台消息接口封装 Satori 标准消息列表
  async getMessageList(channelId: string, next?: string, direction: Direction = 'before', limit?: number, order?: Order): Promise<BidiList<Universal.Message>>
  {
    const count = Math.max(1, limit ?? 10);
    let before = 0;
    let after = 0;

    if (direction === 'after')
    {
      after = count;
    } else if (direction === 'around')
    {
      before = Math.ceil(count / 2);
      after = Math.floor(count / 2);
    } else
    {
      before = count;
    }

    const response = await this.internal.getMessageList(channelId, next || '', { before, after });
    if (response.code !== 1)
    {
      this.loggerError('获取消息列表失败:', response.msg);
      throw new Error(`获取消息列表失败: ${response.msg}`);
    }

    const messages = await Promise.all((response.data?.list || []).map(item => this.internal.toUniversalMessage(item)));
    if (order === 'asc')
    {
      messages.reverse();
    }
    return { data: messages };
  }

  // 使用平台上传器实现 Satori 标准上传接口
  async createUpload(...uploads: Universal.Upload[]): Promise<string[]>
  {
    const urls: string[] = [];
    for (const upload of uploads)
    {
      const mime = upload.type || 'application/octet-stream';
      const dataUrl = `data:${mime};base64,${Buffer.from(upload.data).toString('base64')}`;

      if (mime.startsWith('image/'))
      {
        urls.push(await this.internal.uploadImage(dataUrl));
      } else if (mime.startsWith('video/'))
      {
        urls.push(await this.internal.uploadVideo(dataUrl));
      } else if (mime.startsWith('audio/'))
      {
        urls.push(await this.internal.uploadAudio(dataUrl));
      } else
      {
        urls.push(await this.internal.uploadFile(dataUrl));
      }
    }
    return urls;
  }

  async sendMessage(channelId: string, content: Fragment, guildId?: string, options?: SendOptions): Promise<string[]>
  {
    const session = options?.session;
    const resolvedChannelId = channelId
      || session?.channelId
      || session?.event?.channel?.id
      || (session?.guildId ? `group:${session.guildId}` : undefined)
      || (session?.userId ? `private:${session.userId}` : undefined);

    if (!resolvedChannelId)
    {
      this.loggerError('发送消息失败：无法确定频道 ID', session?.event);
      return [];
    }

    const encoder = new YunhuMessageEncoder(this, resolvedChannelId, guildId, options);
    await encoder.send(content);
    const messageId = encoder.getMessageId();
    if (messageId)
    {
      return [messageId];
    } else
    {
      return [];
    }
  }

  async sendPrivateMessage(userId: string, content: Fragment, guildId?: string, options?: SendOptions): Promise<string[]>
  {
    return this.sendMessage(`private:${userId}`, content);
  }

  async editMessage(channelId: string, messageId: string, content: Fragment): Promise<void>
  {
    if (!content)
    {
      this.loggerError('editMessage 调用失败，content不能为空');
      return;
    }

    const [type, id] = channelId.split(':');
    const recvType = type === 'private' ? 'user' : type;
    const recvId = id;

    const messagePayload = await fragmentToPayload(this, content);

    if (!messagePayload)
    {
      this.loggerError('editMessage失败: 解析后的消息内容为空，无法发送');
      return;
    }
    const payload = {
      msgId: messageId,
      recvId,
      recvType,
      contentType: messagePayload.contentType,
      content: messagePayload.content,
    };

    this.logInfo(`editMessage payload: ${JSON.stringify(payload, null, 2)}`);
    await this.internal.editMessage(payload);
  }

  // 禁言群成员
  async muteGuildMember(guildId: string, userId: string, duration: number, reason?: string): Promise<void>
  {
    await this.internal.muteGuildMember(guildId, userId, duration);
  }

  // 踢出群成员
  async kickGuildMember(guildId: string, userId: string, permanent?: boolean): Promise<void>
  {
    await this.internal.kickGuildMember(guildId, userId);
  }

  // 设置群组成员角色
  async setGuildMemberRole(guildId: string, userId: string, roleId: string): Promise<void>
  {
    await this.internal.setGuildMemberRole(guildId, userId, roleId);
  }

  // 取消群组成员角色
  async unsetGuildMemberRole(guildId: string, userId: string, roleId: string): Promise<void>
  {
    await this.internal.unsetGuildMemberRole(guildId, userId, roleId);
  }

  // 获取群组角色列表
  async getGuildRoleList(guildId: string, next?: string): Promise<Universal.List<Universal.GuildRole>>
  {
    return this.internal.getGuildRoleList(guildId, next);
  }

  // 创建群组角色
  async createGuildRole(guildId: string, data: Partial<Universal.GuildRole>): Promise<Universal.GuildRole>
  {
    return this.internal.createGuildRole(guildId, data);
  }

  // 修改群组角色
  async updateGuildRole(guildId: string, roleId: string, data: Partial<Universal.GuildRole>): Promise<void>
  {
    await this.internal.updateGuildRole(guildId, roleId, data);
  }

  // 删除群组角色
  async deleteGuildRole(guildId: string, roleId: string): Promise<void>
  {
    await this.internal.deleteGuildRole(guildId, roleId);
  }

  logInfo(...args: any[])
  {
    if (this.config.loggerinfo)
    {
      (logger.info as (...args: any[]) => void)(...args);
    }
  }

  loggerInfo(...args: any[])
  {
    (logger.info as (...args: any[]) => void)(...args);
  }

  loggerError(...args: any[])
  {
    (logger.error as (...args: any[]) => void)(...args);
  }

  setDisposing(disposing: boolean)
  {
    this.isDisposing = disposing;
  }

  // 启动机器人
  async start()
  {
    try
    {
      // 通过发送消息到不存在的群组来获取机器人ID
      await this.fetchBotId();

      // 获取机器人详细信息
      const botInfo = await this.internal.getBotInfo(this.selfId);
      if (botInfo.code === 1)
      {
        this.user.name = botInfo.data.bot.nickname;
        this.user.avatar = getMediaProxyUrl(botInfo.data.bot.avatarUrl, 'image', this);
        this.selfId = botInfo.data.bot.botId;
      }
      await super.start();
      this.online();
    } catch (error)
    {
      this.loggerError('Failed to get bot info:', error);
      this.offline();
    }
  }

  /**
   * 通过发送消息到不存在的群组来获取机器人ID
   */
  private async fetchBotId()
  {
    try
    {
      // 向不存在的群组发送消息
      const response = await this.http.post(`/bot/send?token=${this.config.token}`, {
        recvId: '不存在的群组ID',
        recvType: 'group',
        contentType: 'text',
        content: {
          text: '获取机器人ID'
        }
      });

      // 解析错误消息中的机器人ID
      if (response.code === -1 && response.msg)
      {
        // 匹配格式: "群(ID:xxx)中未添加当前机器人(ID: 37090343)。"
        const match = response.msg.match(/当前机器人\(ID:\s*(\d+)\)/);
        if (match && match[1])
        {
          this.selfId = match[1];
          return;
        }
      }

      throw new Error('无法从响应中解析机器人ID');
    } catch (error)
    {
      this.loggerError('获取机器人ID失败:', error);
      throw error;
    }
  }

  // 停止机器人
  async stop()
  {
    await super.stop();
  }
}
