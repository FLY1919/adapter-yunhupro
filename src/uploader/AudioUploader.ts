import { Context } from 'koishi';
import { } from 'koishi-plugin-ffmpeg';
import { writeFileSync, readFileSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { compressVideo, parseRgbaToHex } from '../utils/utils';
import { BaseUploader } from './BaseUploader';
import { YunhuBot } from '../bot/bot';
import { SizeLimitError } from '../utils/types';

export class AudioUploader extends BaseUploader
{
  constructor(token: string, apiendpoint: string, bot: YunhuBot)
  {
    super(token, apiendpoint, 'video', bot);
  }

  async upload(url: string): Promise<string>
  {
    return this.processUpload(url);
  }

  async uploadGetKey(url: string): Promise<{ url: string; key: string; }>
  {
    return this.processUpload(url, true);
  }

  private async processUpload(url: string, returnKey: boolean = false): Promise<any>
  {
    if (url.length < 500)
    {
      this.bot.logInfo(url);
    }

    const { data, filename, type } = await this.bot.http.file(url, { timeout: this.bot.config.uploadTimeout * 1000 });
    const audioBuffer = Buffer.from(data);
    const audioFilename = filename || 'audio.mp3';

    let tempAudioInput: string | null = null;
    let tempVideoOutput: string | null = null;
    let finalBuffer: Buffer;

    try
    {
      tempAudioInput = join(tmpdir(), `audio_${Date.now()}_${audioFilename}`);
      writeFileSync(tempAudioInput, audioBuffer);

      tempVideoOutput = join(tmpdir(), `video_from_audio_${Date.now()}.mp4`);
      const hexColor = parseRgbaToHex(this.bot.config.audioBackgroundColor || 'rgba(128, 0, 128, 1)');

      await (this.bot.ctx as Context).ffmpeg.builder()
        .outputOption('-f', 'lavfi')
        .outputOption('-i', `color=c=${hexColor}:s=640x480:r=1`)
        .input(tempAudioInput)
        .outputOption('-shortest')
        .outputOption('-c:v', 'libx264')
        .outputOption('-c:a', 'aac')
        .outputOption('-b:a', '128k')
        .outputOption('-preset', 'fast')
        .run('file', tempVideoOutput);

      const convertedVideoBuffer = readFileSync(tempVideoOutput);
      if (convertedVideoBuffer.length > this.MAX_SIZE)
      {
        finalBuffer = await compressVideo(this.bot, convertedVideoBuffer, this.MAX_SIZE);
      } else
      {
        finalBuffer = convertedVideoBuffer;
      }

      if (finalBuffer.length > this.MAX_SIZE)
      {
        const sizeMB = (finalBuffer.length / (1024 * 1024)).toFixed(2);
        throw new SizeLimitError(`音频转换后的视频大小${sizeMB}MB超过${this.MAX_SIZE / (1024 * 1024)}MB限制`);
      }

      const form = new FormData();
      const blob = new Blob([Buffer.from(finalBuffer)], { type: 'video/mp4' });
      const videoFilenameBase = audioFilename.includes('.') ? audioFilename.substring(0, audioFilename.lastIndexOf('.')) : audioFilename;
      const videoFilename = `${videoFilenameBase}.mp4`;
      form.append('video', blob, videoFilename);
      const videoKey = await this.sendFormData(form);

      const videoUrl = `${this.bot.config.resourceVideoEndpoint || this.bot.config.resourceEndpoint}${videoKey}.mp4`;
      this.bot.logInfo(`生成的音频视频URL: ${videoUrl}`);

      if (returnKey)
      {
        return {
          url: videoUrl,
          key: videoKey
        };
      }
      return videoUrl;
    } catch (error: any)
    {
      this.bot.loggerError('音频处理或上传失败', error);
      throw new Error(`音频处理失败: ${error.message}`);
    } finally
    {
      if (tempAudioInput)
      {
        try { unlinkSync(tempAudioInput); } catch { }
      }
      if (tempVideoOutput)
      {
        try { unlinkSync(tempVideoOutput); } catch { }
      }
    }
  }
}
