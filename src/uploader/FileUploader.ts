import { createHash } from 'node:crypto';
import { extname } from 'node:path';

import { extension as getExtensionByMime, lookup } from 'mime-types';

import { BaseUploader } from './BaseUploader';
import { YunhuBot } from '../bot/bot';
import { SizeLimitError } from '../utils/types';

function hasKnownExtension(fileName: string): boolean
{
  const lastDot = fileName.lastIndexOf('.');
  if (lastDot <= 0 || lastDot === fileName.length - 1)
  {
    return false;
  }
  return lookup(fileName.slice(lastDot + 1)) !== false;
}

// 文件上传器
export class FileUploader extends BaseUploader
{
  constructor(token: string, apiendpoint: string, bot: YunhuBot)
  {
    super(token, apiendpoint, 'file', bot);
  }

  async upload(url: string, fileName?: string): Promise<string>
  {
    return this.processUpload(url, false, fileName);
  }

  async uploadGetKey(url: string, fileName?: string): Promise<{ url: string; key: string; fileName: string; }>
  {
    return this.processUpload(url, true, fileName);
  }

  private async processUpload(url: string, returnKey: boolean = false, fileName?: string): Promise<any>
  {
    // 从URL获取文件
    if (url.length < 500)
    {
      this.bot.logInfo(url);
    }
    const { data, filename, type } = await this.bot.http.file(url, { timeout: this.bot.config.uploadTimeout * 1000 });
    const buffer = Buffer.from(data);

    // 大小验证
    if (buffer.length > this.MAX_SIZE)
    {
      throw new SizeLimitError(`文件大小超过${this.MAX_SIZE / (1024 * 1024)}MB限制`);
    }

    // 创建表单并上传
    const form = new FormData();
    const blob = new Blob([data], { type: type || 'application/octet-stream' });
    const sourceExtension = extname(filename || '').slice(1);
    const extension = getExtensionByMime(type || '')
      || (sourceExtension && lookup(sourceExtension) ? sourceExtension : '')
      || 'dat';
    const requestedFilename = fileName?.trim();
    const baseFilename = requestedFilename || filename?.trim() || 'file';
    const finalFilename = hasKnownExtension(baseFilename)
      ? baseFilename
      : `${baseFilename}.${extension}`;
    form.append('file', blob, finalFilename);
    const fileKey = await this.sendFormData(form);

    const hash = createHash('md5');
    hash.update(buffer);
    const fileHash = hash.digest('hex');
    this.bot.logInfo(`文件哈希: ${fileHash}, 扩展名: ${extension}`);

    const fileBase = this.bot.config.resourceFileEndpoint || this.bot.config.resourceEndpoint;
    const fileUrl = `${fileBase}${fileHash}.${extension}`;
    this.bot.logInfo(`生成的文件URL: ${fileUrl}`);
    if (returnKey)
    {
      return {
        url: fileUrl,
        key: fileKey,
        fileName: finalFilename,
      };
    }
    return fileUrl;
  }
}
