import { Schema } from 'koishi';

export interface Config
{
  token: string;
  type: 'websocket' | 'webhook';
  serverPath?: string;
  path?: string;
  endpoint?: string;
  endpointweb?: string;
  resourceEndpoint?: string;
  loggerinfo: boolean;
  audioBackgroundColor?: string;
  showConsole?: boolean;
  uploadTimeout: number;
  enableStream: boolean;
  streamDuration?: number;
  maxRetries: number;
}

export const Config: Schema<Config> =
  Schema.intersect([
    Schema.object({
      token: Schema.string()
        .description('机器人的Token')
        .required()
        .role('secret'),
      type: Schema.union(['websocket', 'webhook'])
        .default("websocket")
        .description('订阅方式'),
    }).description('订阅配置'),
    Schema.union([
      Schema.object({
        type: Schema.const('websocket'),
        serverPath: Schema.string()
          .default('wss://ws.jwzhd.com/subscribe')
          .role("link")
          .description('云湖websocket地址'),
      }),
      Schema.object({
        type: Schema.const('webhook').required(),
        path: Schema.string()
          .default('/yunhu')
          .role("link")
          .description('本机监听路径<br>**注意**：使用webhook方式时，不同机器人实例需要设置不同的路径，否则会导致消息混乱'),
      }),
    ]),

    Schema.object({
      uploadTimeout: Schema.number()
        .default(120)
        .min(30)
        .max(3600)
        .step(1)
        .description('下载/上传文件的超时时间（秒）'),
      audioBackgroundColor: Schema.string()
        .role('color')
        .default("rgba(0, 0, 0, 1)")
        .description('音频转为视频时使用的背景颜色。<br>仅RGB通道生效，A通道（透明度）不生效'),
    }).description('进阶设置'),

    Schema.object({
      maxRetries: Schema.number()
        .role('slider')
        .min(1)
        .max(10)
        .step(1)
        .default(3)
        .description('网络请求失败时的最大重试次数'),
    }).description('网络请求设置'),

    Schema.object({
      enableStream: Schema.boolean()
        .default(false)
        .experimental()
        .description('是否开启流式消息。<br>开启后，文本、Markdown消息 将以流式消息方式发送<br>注：实验性功能，不推荐开启'),
    }).description('流式消息设置'),
    Schema.union([
      Schema.object({
        enableStream: Schema.const(false),
      }),
      Schema.object({
        enableStream: Schema.const(true)
          .required(),
        streamDuration: Schema.number()
          .role('slider')
          .min(1)
          .max(10)
          .step(1)
          .default(2)
          .description("流式消息总时长（秒）。数值越小 发消息越快。<br>流式消息将被标记为`本内容为AI生成，仅供参考`"),
      }),
    ]),

    Schema.object({
      showConsole: Schema.boolean()
        .default(false)
        .description('是否在侧边栏显示云湖控制台入口')
    }).description('界面设置'),

    Schema.object({
      endpoint: Schema.string()
        .default('https://chat-go.jwzhd.com/open-apis/v1')
        .description('云湖 API 地址')
        .role('link'),
      endpointweb: Schema.string()
        .default('https://chat-web-go.jwzhd.com/v1')
        .description('云湖 web API 地址')
        .role('link'),
      resourceEndpoint: Schema.string()
        .default('https://chat-img.jwznb.com/')
        .description('资源服务器地址')
        .role('link'),
    }).description('连接设置'),

    Schema.object({
      loggerinfo: Schema.boolean()
        .default(false)
        .description("日志调试模式")
        .experimental(),
    }).description('调试设置'),
  ]);
