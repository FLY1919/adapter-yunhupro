import { createHash } from 'node:crypto';

import { BaseUploader } from './BaseUploader';
import { YunhuBot } from '../bot/bot';
import { SizeLimitError } from '../utils/types';

const imageMimeByExtension: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  bmp: 'image/bmp',
  tif: 'image/tiff',
  tiff: 'image/tiff',
  svg: 'image/svg+xml',
  ico: 'image/x-icon',
}

// 部分图床返回 application/octet-stream，需要根据扩展名和文件头推断真实 MIME
function detectImageMime(url: string, filename: string, buffer: Buffer): string {
  const pathname = url.split('?')[0].toLowerCase()
  const urlExt = pathname.match(/\.([a-z0-9]+)$/)?.[1] || ''
  const fileExt = filename.split('.').pop()?.toLowerCase() || ''
  const mapped = imageMimeByExtension[urlExt || fileExt]
  if (mapped) return mapped

  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg'
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return 'image/png'

  const header = buffer.subarray(0, 12).toString('ascii')
  if (header.startsWith('GIF87a') || header.startsWith('GIF89a')) return 'image/gif'
  if (header.startsWith('RIFF') && header.slice(8, 12) === 'WEBP') return 'image/webp'
  if (buffer[0] === 0x42 && buffer[1] === 0x4d) return 'image/bmp'
  return ''
}

// 图片上传器
export class ImageUploader extends BaseUploader
{
  constructor(token: string, apiendpoint: string, bot: YunhuBot)
  {
    super(token, apiendpoint, 'image', bot);
  }

  async upload(url: string): Promise<string>
  {
    return this.processUpload(url);
  }

  async uploadGetKey(url: string): Promise<{ url: string; key: string; }>
  {
    return this.processUpload(url, true);
  }

  // 私有方法，处理上传逻辑
  private async processUpload(url: string, returnKey: boolean = false): Promise<any>
  {
    // 从URL获取文件
    if (url.length < 500)
    {
      this.bot.logInfo(url);
    }
    const { data, filename: originalFilename, type: responseType } = await this.bot.http.file(url, { timeout: this.bot.config.uploadTimeout * 1000 });
    const buffer = Buffer.from(data);
    const rawMime = (responseType || '').split(';')[0].trim().toLowerCase();

    // 记录检测到的MIME类型
    this.bot.logInfo(`检测到的MIME类型: ${responseType}`);

    // 验证图片格式
    const validImageTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/bmp',
      'image/tiff',
      'image/svg+xml',
      'image/x-icon',
      "image/jpg"
    ];

    let mimeType = validImageTypes.includes(rawMime) ? rawMime : detectImageMime(url, originalFilename || '', buffer);

    if (mimeType !== rawMime)
    {
      this.bot.logInfo(`根据扩展名/文件内容推断MIME: ${mimeType}`);
    }

    if (!validImageTypes.includes(mimeType))
    {
      this.bot.loggerError(`不支持的图片格式: ${responseType}，推断为 ${mimeType}`);
      throw new Error(`不支持的图片格式: ${mimeType}`);
    }

    // 记录图片信息
    const originalSize = buffer.length;
    const originalMB = (originalSize / (1024 * 1024)).toFixed(2);
    this.bot.logInfo(`图片: 类型=${mimeType}, 大小=${originalMB}MB`);

    // 大小检查
    if (originalSize > this.MAX_SIZE)
    {
      const sizeMB = (originalSize / (1024 * 1024)).toFixed(2);
      this.bot.loggerError(`图片大小${sizeMB}MB，超过10MB限制，无法上传`);
      throw new SizeLimitError(`图片大小${sizeMB}MB，超过10MB限制，无法上传`);
    }

    // 创建表单并上传
    const form = new FormData();
    const blob = new Blob([buffer], { type: mimeType });
    let extension = mimeType.split('/')[1];
    if (extension === "jpeg") { extension = "jpg"; } // 云湖后缀名校验。使用.jpeg上传后，需要使用.jpg后缀名才能访问。
    const filename = originalFilename && originalFilename.includes('.') ? originalFilename : `${originalFilename || 'image'}.${extension}`;
    form.append('image', blob, filename);


    // 计算图片哈希用于生成URL
    const hash = createHash('md5');
    hash.update(buffer);
    const imageHash = hash.digest('hex');
    this.bot.logInfo(`图片哈希: ${imageHash}, 扩展名: ${extension}`);

    const imagekey = await this.sendFormData(form);
    const imageUrl = `${this.bot.config.resourceEndpoint}${imageHash}.${extension}`;
    this.bot.logInfo(`生成的图片URL: ${imageUrl}`);


    if (returnKey)
    {
      return {
        url: imageUrl,
        key: imagekey
      };
    } else
    {
      return imageUrl;
    }
  }
}
