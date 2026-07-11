import { Context } from 'koishi';
import { Readable } from 'node:stream';
import type { YunhuBot } from '../bot/bot';

export type MediaProxyType = 'audio' | 'image' | 'video' | 'file';

const MEDIA_PROXY_ROUTE = '/adapter/yunhu/proxy/chatfile';
const MEDIA_PROXY_REFERER = 'http://myapp.jwznb.com';
const MEDIA_PROXY_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function getServerSelfUrl(ctx: Context): string | undefined {
  const server = ctx.server as {
    config?: {
      selfUrl?: string;
    };
  };
  return server.config?.selfUrl?.trim() || undefined;
}

function getServerBaseUrl(ctx: Context): string {
  const selfUrl = getServerSelfUrl(ctx);
  if (selfUrl) return selfUrl;
  const port = ctx.server.port || 5140;
  return `http://127.0.0.1:${port}`;
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
}

function getMediaProxyPublicUrl(ctx: Context, url: string, type: MediaProxyType): string {
  const searchParams = new URLSearchParams({
    url,
    type,
  });
  const pathname = `${MEDIA_PROXY_ROUTE}?${searchParams.toString()}`;
  return new URL(pathname, normalizeBaseUrl(getServerBaseUrl(ctx))).toString();
}

export function getMediaProxyUrl(url: string, type: MediaProxyType, bot: YunhuBot): string {
  return getMediaProxyPublicUrl(bot.ctx, url, type);
}

export function registerMediaProxyRoute(ctx: Context) {
  ctx.server.get(MEDIA_PROXY_ROUTE, async (koaCtx) => {
    const rawUrl = typeof koaCtx.query.url === 'string' ? koaCtx.query.url : '';
    const type = typeof koaCtx.query.type === 'string' ? koaCtx.query.type : 'file';
    const controller = new AbortController();
    const abortRequest = () => controller.abort();

    koaCtx.req.once('aborted', abortRequest);
    koaCtx.req.once('close', abortRequest);

    if (!rawUrl || !isValidUrl(rawUrl)) {
      koaCtx.status = 400;
      koaCtx.body = 'invalid media url';
      koaCtx.req.off('aborted', abortRequest);
      koaCtx.req.off('close', abortRequest);
      return;
    }

    try {
      const response = await fetch(rawUrl, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          referer: MEDIA_PROXY_REFERER,
          'user-agent': MEDIA_PROXY_USER_AGENT,
          accept: type === 'image' ? 'image/avif,image/webp,image/*,*/*;q=0.8' : '*/*',
        },
      });

      if (!response.ok) {
        koaCtx.status = response.status;
        koaCtx.body = `failed to proxy media: HTTP ${response.status}`;
        return;
      }

      const contentType = response.headers.get('content-type');
      const contentLength = response.headers.get('content-length');
      const contentDisposition = response.headers.get('content-disposition');
      const cacheControl = response.headers.get('cache-control');
      const acceptRanges = response.headers.get('accept-ranges');

      koaCtx.status = response.status;
      if (contentType) koaCtx.type = contentType;
      if (contentLength) koaCtx.set('content-length', contentLength);
      if (contentDisposition) koaCtx.set('content-disposition', contentDisposition);
      if (cacheControl) koaCtx.set('cache-control', cacheControl);
      if (acceptRanges) koaCtx.set('accept-ranges', acceptRanges);
      koaCtx.body = response.body ? Readable.fromWeb(response.body) : undefined;
    } catch (error) {
      if ((error as { name?: string }).name === 'AbortError') {
        return;
      }

      koaCtx.status = 502;
      koaCtx.body = 'failed to proxy media';
    } finally {
      koaCtx.req.off('aborted', abortRequest);
      koaCtx.req.off('close', abortRequest);
    }
  });
}
