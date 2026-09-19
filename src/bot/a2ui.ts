import { h } from 'koishi';
import type { YunhuBot } from './bot';

const BASIC_CATALOG_ID = 'https://a2ui.org/specification/v0_9/basic_catalog.json';

export interface AudioA2uiOptions
{
  url: string;
  description?: string;
  surfaceId?: string;
}

function createSurfaceId(prefix: string): string
{
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function isA2uiMessage(value: unknown): value is Record<string, unknown>
{
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function formatA2uiMessage(message: Record<string, unknown>): string
{
  return `\`\`\`json\n${JSON.stringify(message)}\n\`\`\``;
}

function isPublicHttpMediaUrl(src: string): boolean
{
  try
  {
    const url = new URL(src);
    if (url.protocol !== 'http:' && url.protocol !== 'https:')
    {
      return false;
    }

    const host = url.hostname.toLowerCase();
    if (!host || host === 'localhost' || host === '::1')
    {
      return false;
    }

    if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(host))
    {
      const parts = host.split('.').map(part => Number(part));
      const [a, b] = parts;
      if (a === 10) return false;
      if (a === 127) return false;
      if (a === 169 && b === 254) return false;
      if (a === 192 && b === 168) return false;
      if (a === 172 && b >= 16 && b <= 31) return false;
    }

    return true;
  } catch
  {
    return false;
  }
}

export async function resolveAudioA2uiUrl(bot: YunhuBot, src: string): Promise<string>
{
  if (isPublicHttpMediaUrl(src))
  {
    return src;
  }

  const file = await bot.http.file(src, { timeout: bot.config.uploadTimeout * 1000 });
  const type = file.type || 'application/octet-stream';
  const base64 = Buffer.from(file.data).toString('base64');
  const dataUrl = `data:${type};base64,${base64}`;
  const uploaded = await bot.internal.uploadFileKey(dataUrl, file.filename);
  return bot.buildExternalMediaUrl(uploaded.url);
}

/**
 * 将 A2UI JSON 对象或对象数组转换为云湖要求的文本内容。
 */
export function stringifyA2uiData(data: unknown): string
{
  const messages = Array.isArray(data) ? data : [data];
  if (!messages.length)
  {
    throw new Error('A2UI 消息数组不能为空');
  }

  return messages.map((message) =>
  {
    if (!isA2uiMessage(message))
    {
      throw new Error('A2UI 消息必须是 JSON 对象或 JSON 对象数组');
    }
    return formatA2uiMessage(message);
  }).join('\n\n');
}

/**
 * 读取 a2ui 元素中的 JSON 对象或 JSON 对象数组。
 */
export function getA2uiElementContent(element: h): string
{
  if (Object.prototype.hasOwnProperty.call(element.attrs, 'content'))
  {
    return stringifyA2uiData(element.attrs.content);
  }

  if (Object.keys(element.attrs).length)
  {
    return stringifyA2uiData(element.attrs);
  }

  throw new Error('a2ui 元素必须传入 JSON 对象或 content 数组');
}

/**
 * 构造云湖客户端可直接渲染的 AudioPlayer A2UI 消息。
 */
export function buildAudioA2uiJsonl(options: AudioA2uiOptions): string
{
  const surfaceId = options.surfaceId || createSurfaceId('audio');
  const description = options.description || '';

  return stringifyA2uiData([
    {
      version: 'v0.9',
      createSurface: {
        surfaceId,
        catalogId: BASIC_CATALOG_ID,
        sendDataModel: true,
      },
    },
    {
      version: 'v0.9',
      updateComponents: {
        surfaceId,
        components: [
          {
            id: 'root',
            component: 'Column',
            children: ['player'],
          },
          {
            id: 'player',
            component: 'AudioPlayer',
            url: options.url,
            description,
          },
        ],
      },
    },
  ]);
}
