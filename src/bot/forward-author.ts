import type { YunhuBot } from './bot';

// 合并转发作者解析结果：名称 + 身份（用户/机器人）
export interface ForwardAuthorInfo
{
  id: string;
  name: string;
  isBot: boolean;
}

// 以 bot 实例为键做缓存，避免同一份合并转发里重复请求同一个 ID
const authorCache = new WeakMap<YunhuBot, Map<string, Promise<ForwardAuthorInfo | null>>>();

function getCache(bot: YunhuBot): Map<string, Promise<ForwardAuthorInfo | null>>
{
  let cache = authorCache.get(bot);
  if (!cache)
  {
    cache = new Map();
    authorCache.set(bot, cache);
  }
  return cache;
}

// 通过 getUser 判断该 ID 是用户还是机器人，并取回名称；失败时返回 null
async function fetchForwardAuthor(bot: YunhuBot, id: string): Promise<ForwardAuthorInfo | null>
{
  try
  {
    const user = await bot.internal.getUser(id);
    if (!user?.id) return null;
    return {
      id: user.id,
      name: user.name,
      isBot: !!user.isBot,
    };
  } catch (error)
  {
    bot.logInfo(`解析合并转发作者失败 (ID: ${id}):`, error);
    return null;
  }
}

// 解析合并转发作者，同一 ID 复用同一个 Promise 结果
export function resolveForwardAuthor(bot: YunhuBot, id: string): Promise<ForwardAuthorInfo | null>
{
  const key = String(id);
  const cache = getCache(bot);
  let pending = cache.get(key);
  if (!pending)
  {
    pending = fetchForwardAuthor(bot, key).then((result) =>
    {
      // 解析失败不缓存，等待下次调用时重试
      if (!result) cache.delete(key);
      return result;
    });
    cache.set(key, pending);
  }
  return pending;
}

// 生成云湖客户端内置跳转链接，点击后展示个人卡片
export function buildForwardAuthorLink(id: string, isBot: boolean): string
{
  const type = isBot ? 'bot' : 'user';
  return `yunhu://chat-add?id=${id}&type=${type}`;
}

// bot 停止时清空缓存，避免内存泄漏
export function disposeForwardAuthorCache(bot: YunhuBot): void
{
  authorCache.delete(bot);
}
