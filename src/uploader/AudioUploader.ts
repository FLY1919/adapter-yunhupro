import { createHash } from 'node:crypto';
import { readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { } from 'koishi-plugin-ffmpeg';
import { BaseUploader } from './BaseUploader';
import { YunhuBot } from '../bot/bot';
import { SizeLimitError } from '../utils/types';

export class AudioUploader extends BaseUploader
{
  constructor(token: string, apiendpoint: string, bot: YunhuBot)
  {
    super(token, apiendpoint, 'file', bot);
  }

  async upload(url: string): Promise<string>
  {
    const result = await this.processUpload(url, false);
    return result;
  }

  async uploadGetKey(url: string): Promise<{ url: string; key: string; }>
  {
    return this.processUpload(url, true);
  }

  private async processUpload(url: string, returnKey: true): Promise<{ url: string; key: string; }>;
  private async processUpload(url: string, returnKey: false): Promise<string>;
  private async processUpload(url: string, returnKey: boolean): Promise<string | { url: string; key: string; }>
  {
    if (url.length < 500)
    {
      this.bot.logInfo(url);
    }

    if (/^https?:\/\//i.test(url))
    {
      return returnKey ? { url, key: '' } : url;
    }

    const { data, filename, type } = await this.bot.http.file(url, { timeout: this.bot.config.uploadTimeout * 1000 });
    const audioBuffer = Buffer.from(data);
    const originalName = filename || 'audio.mp3';
    const safeName = basename(originalName).replace(/[\\/:*?"<>|]/g, '_');
    const mimeType = type || 'audio/mpeg';
    const extension = safeName.includes('.') ? safeName.substring(safeName.lastIndexOf('.') + 1) : (mimeType.split('/')[1] || 'mp3');

    if (audioBuffer.length > this.MAX_SIZE)
    {
      const sizeMB = (audioBuffer.length / (1024 * 1024)).toFixed(2);
      throw new SizeLimitError(`语音大小 ${sizeMB}MB 超出 ${this.MAX_SIZE / (1024 * 1024)}MB 限制`);
    }

    let tempAudioInput: string | null = null;

    try
    {
      tempAudioInput = join(tmpdir(), `audio_${Date.now()}_${safeName}`);
      writeFileSync(tempAudioInput, audioBuffer);

      const form = new FormData();
      const blob = new Blob([readFileSync(tempAudioInput)], { type: mimeType });
      const uploadName = safeName.includes('.') ? safeName : `${safeName}.${extension}`;
      form.append('file', blob, uploadName);

      const fileKey = await this.sendFormData(form);

      const hash = createHash('md5');
      hash.update(audioBuffer);
      const audioHash = hash.digest('hex');
      const audioBase = this.bot.config.resourceFileEndpoint || this.bot.config.resourceEndpoint;
      const audioUrl = `${audioBase}${audioHash}.${extension}`;
      this.bot.logInfo(`生成的语音URL: ${audioUrl}`);

      const result = {
        url: audioUrl,
        key: fileKey,
      };

      return returnKey ? result : result.url;
    } catch (error: any)
    {
      this.bot.loggerError('语音处理或上传失败:', error);
      throw new Error(`语音处理失败: ${error.message}`);
    } finally
    {
      if (tempAudioInput)
      {
        try { unlinkSync(tempAudioInput); } catch { }
      }
    }
  }
}
