import { Context, Logger, Universal, sleep } from 'koishi';

import { } from '@koishijs/plugin-server';
import { } from '@koishijs/plugin-console';

import { promises as fs } from 'node:fs';
import * as path from 'node:path';

import { adaptSession } from './utils/utils';
import * as Yunhu from './utils/types';
import { YunhuBot } from './bot/bot';
import { YunhuWebSocket } from './bot/websocket';
import { Config } from './config';

export * from './config';
export * from './bot/bot';

export const name = 'adapter-yunhupro';
export const reusable = true;
export const filter = false;
export const inject = {
  required: ['http', 'logger', 'server'],
  optional: ['ffmpeg']
};

export const logger = new Logger('adapter-yunhupro');
export const usage = `
<hr>

<a href="https://fly1919.github.io/adapter-yunhupro/" target="_blank" rel="noopener noreferrer">点击此处查看文档！</a>

<hr>
`;

export function apply(ctx: Context, config: Config)
{
  let bot: YunhuBot;
  let wsClient: YunhuWebSocket;
  let isDisposing = false;

  ctx.on('ready', async () =>
  {
    if (process.env.NODE_ENV === 'development' && !__dirname.includes('node_modules'))
    {
      await sleep(1 * 1000);  // 神秘步骤，可以保佑dev模式
    }
    if (isDisposing) return;

    if (config.showConsole)
    {
      ctx.inject(['console'], (ctx) =>
      {
        ctx.console.addEntry({
          dev: path.resolve(__dirname, './../client/index.ts'),
          prod: path.resolve(__dirname, './../dist'),
        });
      });
    }

    // 创建机器人实例
    bot = new YunhuBot(ctx, config);

    // 根据配置类型选择连接方式
    if (config.type === 'websocket')
    {
      // WebSocket方式
      const serverPath = config.serverPath || 'wss://ws.jwzhd.com/subscribe';
      wsClient = new YunhuWebSocket(ctx, bot, serverPath, config.token);

      // 启动机器人（会自动获取ID）
      await bot.start();

      // 启动WebSocket连接
      await wsClient.start();
    }
    else
    {
      // Webhook方式
      const webhookPath = config.path || '/yunhu';

      // 启动机器人（会自动获取ID）
      await bot.start();

      // 为机器人设置Webhook监听
      ctx.server.post(webhookPath, async (koaCtx) =>
      {
        koaCtx.status = 200;
        const payload: Yunhu.YunhuEvent = (koaCtx.request as any).body;
        bot.logInfo('接收到 payload:\n', JSON.stringify(payload, null, 2));

        // 确保机器人处于在线状态
        if (bot.status !== Universal.Status.ONLINE)
        {
          bot.online();
        }

        // 转换并分发会话
        await adaptSession(bot, payload);

        // 返回成功响应
        koaCtx.body = { code: 0, message: 'success' };
      });

      // 处理GET请求，用于给用户提示
      ctx.server.get(webhookPath, async (koaCtx) =>
      {
        const templatePath = path.resolve(__dirname, '../data/webhook.html');
        const htmlContent = await fs.readFile(templatePath, 'utf-8');

        koaCtx.type = 'html';
        koaCtx.body = htmlContent;
      });

      ctx.logger.info(`[${bot.selfId}] 机器人已通过Webhook上线，监听路径：http://localhost:${ctx.server.port}${webhookPath}`);
    }
  });

  ctx.on('dispose', async () =>
  {
    isDisposing = true;

    // 停止WebSocket连接
    if (wsClient)
    {
      await wsClient.stop();
    }

    // 停止机器人
    if (bot)
    {
      await bot.stop();
    }

    ctx.logger.info('适配器已停止运行。');
  });
}
