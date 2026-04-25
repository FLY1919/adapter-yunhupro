import { getImageAsBase64 } from '../utils/utils';
import { Bot, Context, Fragment, Logger, Universal } from 'koishi';
import { SendOptions } from '@satorijs/protocol';
import { Config } from '../config';
import { YunhuMessageEncoder } from './message';
import { fragmentToPayload } from './message';
import { Internal } from './internal';
import { BotHttp } from './http';

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

  async getGuild(guildId: string)
  {
    return this.internal.getGuild(guildId);
  }

  async getGuildList(next?: string): Promise<Universal.List<Universal.Guild>>
  {
    return null;
  }

  async getGuildMemberList(guildId: string, next?: string): Promise<Universal.List<Universal.GuildMember>>
  {
    return null;
  }

  async getChannel(channelId: string, guildId?: string)
  {
    return this.internal.getChannel(channelId, guildId);
  }

  async getChannelList(guildId: string, next?: string): Promise<Universal.List<Universal.Channel>>
  {
    return null;
  }

  async deleteMessage(channelId: string, messageId: string)
  {
    return this.internal.deleteMessage(channelId, messageId);
  }

  async getMessage(channelId: string, messageId: string)
  {
    return this.internal.getMessage(channelId, messageId);
  }

  async sendMessage(channelId: string, content: Fragment, guildId?: string, options?: SendOptions): Promise<string[]>
  {
    const encoder = new YunhuMessageEncoder(this, channelId, guildId, options);
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
        this.user.avatar = await getImageAsBase64(botInfo.data.bot.avatarUrl, this);
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
      this.logInfo('正在获取机器人ID...');

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
