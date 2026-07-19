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
  resourceFileEndpoint?: string;
  resourceAudioEndpoint?: string;
  resourceVideoEndpoint?: string;
  externalMediaProxyBaseUrl?: string;
  mixedMediaFormat?: 'html' | 'markdown' | 'html-webproxy';
  HTML_max_width?: number;
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
        .default("rgba(139, 92, 246, 1)")
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
      mixedMediaFormat: Schema.union([
        Schema.const('html-webproxy').description('HTML-webproxy格式（HTML格式预览图，可点击跳转到网页查看/下载）'),
        Schema.const('html').description('HTML格式（预览图不占屏幕，但不能点击、APP内打开）'),
        Schema.const('markdown').description('Markdown格式（预览图占屏幕，可点击、APP内打开）'),
      ]).default('html-webproxy').description('图文混合内容的发送方式').role('radio'),
    }).description('进阶设置'),
    Schema.union([
      Schema.object({
        mixedMediaFormat: Schema.const('html-webproxy'),
        externalMediaProxyBaseUrl: Schema.string().default('https://fly1919.github.io/adapter-yunhupro/').description('外部富媒体跳转代理地址').role('link'),
        HTML_max_width: Schema.number().role('slider').min(0).max(100).step(1).default(30).description('预览图的最大宽度百分比'),
      }),
      Schema.object({
        mixedMediaFormat: Schema.const('html').required(),
        HTML_max_width: Schema.number().role('slider').min(0).max(100).step(1).default(30).description('预览图的最大宽度百分比'),
      }),
      Schema.object({
        mixedMediaFormat: Schema.const('markdown').required(),
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
        .description('接口 API 请求地址')
        .role('link'),
      endpointweb: Schema.string()
        .default('https://chat-web-go.jwzhd.com/v1')
        .description('网页 API 请求地址')
        .role('link'),
      resourceEndpoint: Schema.string()
        .default('https://chat-img.jwznb.com/')
        .description('图片资源服务器地址')
        .role('link'),
      resourceFileEndpoint: Schema.string()
        .default('https://chat-file.jwznb.com/')
        .description('文件资源服务器地址')
        .role('link'),
      resourceAudioEndpoint: Schema.string()
        .default('https://chat-audio1.jwznb.com/')
        .description('音频资源服务器地址')
        .role('link'),
      resourceVideoEndpoint: Schema.string()
        .default('https://chat-video1.jwznb.com/')
        .description('视频资源服务器地址')
        .role('link'),
    }).description('服务器地址配置'),

    Schema.object({
      loggerinfo: Schema.boolean()
        .default(false)
        .description("日志调试模式")
        .experimental(),
    }).description('调试设置'),
  ]);
