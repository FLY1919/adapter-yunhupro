import type { YunhuBot } from '../bot/bot';

export type MediaProxyType = 'audio' | 'image' | 'video' | 'file';

export function getMediaProxyUrl(url: string, _type: MediaProxyType, bot: YunhuBot): string
{
  return bot.buildExternalMediaUrl(url);
}
