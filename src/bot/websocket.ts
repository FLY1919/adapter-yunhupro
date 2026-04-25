import { Context, Logger, Universal } from 'koishi';
import { WebSocket } from 'ws';
import { YunhuBot } from './bot';
import * as Yunhu from '../utils/types';
import { adaptSession } from '../utils/utils';

const logger = new Logger('adapter-yunhupro');

/**
 * WebSocket客户端类
 * 负责与云湖平台建立WebSocket连接并处理消息
 */
export class YunhuWebSocket
{
  private ws: WebSocket | null = null;
  private reconnectTimer: any = null;
  private heartbeatTimer: any = null;
  private isDisposing = false;

  constructor(
    private ctx: Context,
    private bot: YunhuBot,
    private serverPath: string,
    private token: string
  ) { }

  /**
   * 启动WebSocket连接
   */
  async start()
  {
    this.isDisposing = false;
    await this.connect();
  }

  /**
   * 建立WebSocket连接
   */
  private async connect()
  {
    if (this.isDisposing) return;

    try
    {
      const url = `${this.serverPath}?token=${this.token}`;
      this.bot.logInfo(`正在连接WebSocket: ${this.serverPath}`);

      this.ws = new WebSocket(url);

      this.ws.on('open', () =>
      {
        this.bot.loggerInfo(`[${this.bot.selfId}] WebSocket连接已建立`);
        this.bot.online();
        this.startHeartbeat();
      });

      this.ws.on('message', async (data: Buffer) =>
      {
        try
        {
          const payload: Yunhu.YunhuEvent = JSON.parse(data.toString());
          this.bot.logInfo('接收到 WebSocket payload:\n', JSON.stringify(payload, null, 2));

          // 确保机器人处于在线状态
          if (this.bot.status !== Universal.Status.ONLINE)
          {
            this.bot.online();
          }

          // 转换并分发会话
          await adaptSession(this.bot, payload);
        } catch (error)
        {
          this.bot.loggerError('处理WebSocket消息失败:', error);
        }
      });

      this.ws.on('close', (code, reason) =>
      {
        this.bot.logInfo(`[${this.bot.selfId}] WebSocket连接已关闭 (code: ${code}, reason: ${reason.toString()})`);
        this.stopHeartbeat();
        this.bot.offline();

        // 如果不是主动关闭，则尝试重连
        if (!this.isDisposing)
        {
          this.scheduleReconnect();
        }
      });

      this.ws.on('error', (error) =>
      {
        this.bot.loggerError(`[${this.bot.selfId}] WebSocket错误:`, error);
      });

    } catch (error)
    {
      this.bot.loggerError('WebSocket连接失败:', error);
      if (!this.isDisposing)
      {
        this.scheduleReconnect();
      }
    }
  }

  /**
   * 启动心跳
   */
  private startHeartbeat()
  {
    this.stopHeartbeat();
    // 每30秒发送一次心跳
    this.heartbeatTimer = this.ctx.setInterval(() =>
    {
      if (this.ws && this.ws.readyState === WebSocket.OPEN)
      {
        this.ws.ping();
        this.bot.logInfo('发送WebSocket心跳');
      }
    }, 30000);
  }

  /**
   * 停止心跳
   */
  private stopHeartbeat()
  {
    if (this.heartbeatTimer)
    {
      clearTimeout(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * 安排重连
   */
  private scheduleReconnect()
  {
    if (this.reconnectTimer) return;

    this.bot.loggerInfo(`[${this.bot.selfId}] 将在5秒后尝试重连...`);
    this.reconnectTimer = this.ctx.setTimeout(() =>
    {
      this.reconnectTimer = null;
      this.connect();
    }, 5000);
  }

  /**
   * 停止WebSocket连接
   */
  async stop()
  {
    this.isDisposing = true;

    // 清理重连定时器
    if (this.reconnectTimer)
    {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    // 停止心跳
    this.stopHeartbeat();

    // 关闭WebSocket连接
    if (this.ws)
    {
      this.ws.close();
      this.ws = null;
    }

    this.bot.offline();
  }
}
