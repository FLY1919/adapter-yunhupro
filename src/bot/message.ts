import { Context, h, Dict, MessageEncoder, Fragment } from 'koishi';
import { YunhuBot } from './bot';
import { Button, SizeLimitError } from '../utils/types';

function isHtmlMixedMedia(bot: YunhuBot): boolean
{
  return (bot.config.mixedMediaFormat || 'html') !== 'markdown';
}

function isHtmlWebProxyMixedMedia(bot: YunhuBot): boolean
{
  return (bot.config.mixedMediaFormat || 'html') === 'html-webproxy';
}

function getMixedMediaImageStyle(bot: YunhuBot): string
{
  const maxWidth = bot.config.HTML_max_width ?? 30;
  return `max-width:${maxWidth}%;height:auto;`;
}

function setMixedTextMode(context: { sendType?: 'text' | 'image' | 'video' | 'file' | 'markdown' | 'html' | 'html-webproxy'; }, bot: YunhuBot)
{
  context.sendType = isHtmlMixedMedia(bot) ? 'html' : 'markdown';
}

type ForwardElement = ReturnType<typeof h.normalize>[number];

interface ForwardRenderContext
{
  bot: YunhuBot;
  text: string;
  markdown: string;
  html: string;
  render: (children: Fragment) => Promise<void>;
}

function escapeHtml(text: string): string
{
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getForwardName(attrs: Dict): string
{
  return String(attrs.name || attrs.nickname || attrs.username || attrs.userName || attrs.id || attrs.userId || '匿名');
}

function getBotForwardName(bot: YunhuBot): string
{
  return String(bot.user?.name || '机器人');
}

function extractForwardAuthor(node: ForwardElement): Dict | null
{
  if (typeof node === 'string') return null;
  if (node.type !== 'author') return null;
  return node.attrs ?? {};
}

function getForwardDisplayName(bot: YunhuBot, attrs: Dict | null): string
{
  const name = String(attrs?.name || attrs?.nickname || attrs?.username || attrs?.userName || '');
  return name || getBotForwardName(bot);
}

function formatForwardTime(time?: string | number): string
{
  if (time == null) return '';
  const value = Number(time);
  if (!Number.isFinite(value)) return '';
  const timestamp = value < 1e12 ? value * 1000 : value;
  const date = new Date(timestamp);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

async function renderForwardContent(bot: YunhuBot, fragment: Fragment): Promise<string>
{
  const context: ForwardRenderContext = {
    bot,
    text: '',
    markdown: '',
    html: '',
    render: async (children) =>
    {
      for (const child of h.normalize(children))
      {
        await renderForwardElement(context, child);
      }
    },
  };

  await context.render(fragment);

  if (context.html.trim())
  {
    return context.html.trim();
  }
  if (context.markdown.trim())
  {
    return escapeHtml(context.markdown.trim()).replace(/\n/g, '<br>');
  }
  return escapeHtml(context.text.trim()).replace(/\n/g, '<br>');
}

async function renderForwardMessage(bot: YunhuBot, attrs: Dict, children: Fragment): Promise<string>
{
  const nodes = h.normalize(children);
  let authorAttrs: Dict | null = null;
  const content: ForwardElement[] = [];

  for (const node of nodes)
  {
    const extracted = extractForwardAuthor(node);
    if (extracted)
    {
      authorAttrs = extracted;
      continue;
    }
    content.push(node);
  }

  const body = await renderForwardContent(bot, content);
  if (!body) return '';
  const name = escapeHtml(getForwardDisplayName(bot, authorAttrs || attrs));
  const time = formatForwardTime(attrs.time);
  const timeText = time ? ` <span style="color:#999;font-size:12px;">${time}</span>` : '';
  return `<div style="margin:8px 0;padding:10px 12px;border:1px solid #e6e8ec;border-radius:8px;background:#fff;"><div style="font-size:12px;line-height:1.4;margin-bottom:6px;color:#666;"><strong>${name}</strong>${timeText}</div><div style="font-size:14px;line-height:1.6;word-break:break-word;">${body}</div></div>`;
}

async function renderForwardCard(bot: YunhuBot, fragment: Fragment): Promise<string>
{
  const nodes = h.normalize(fragment);
  const cards: string[] = [];

  for (const node of nodes)
  {
    if (typeof node === 'string')
    {
      const card = await renderForwardMessage(bot, { name: getBotForwardName(bot) }, [node]);
      if (card) cards.push(card);
      continue;
    }

    if (node.type === 'message' && node.attrs.forward)
    {
      const nested = await renderForwardCard(bot, node.children ?? []);
      if (nested) cards.push(nested);
      continue;
    }

    if (node.type === 'figure')
    {
      const nested = await renderForwardCard(bot, node.children ?? []);
      if (nested) cards.push(nested);
      continue;
    }

    if (node.type === 'message')
    {
      const card = await renderForwardMessage(bot, node.attrs, node.children ?? []);
      if (card) cards.push(card);
      continue;
    }

    const card = await renderForwardMessage(bot, { name: getBotForwardName(bot) }, [node]);
    if (card) cards.push(card);
  }

  if (!cards.length) return '';

  return `<details style="width:100%;box-sizing:border-box;border:1px solid #dfe3e8;border-radius:10px;background:#f7f8fa;overflow:hidden;"><summary style="list-style:none;cursor:pointer;padding:10px 12px;background:#fff;border-bottom:1px solid #e6e8ec;font-size:14px;font-weight:600;color:#333;">合并聊天记录</summary><div style="padding:8px 10px;">${cards.join('')}</div></details>`;
}

async function renderForwardElement(context: ForwardRenderContext, element: ForwardElement)
{
  if (typeof element === 'string')
  {
    context.text += element;
    context.markdown += element;
    context.html += escapeHtml(element);
    return;
  }

  const { type, attrs, children = [] } = element;

  switch (type)
  {
    case 'text':
      {
        const content = String(attrs.content || '').replace(/<br>/g, '\n');
        context.text += content;
        context.markdown += content;
        context.html += escapeHtml(content).replace(/\n/g, '<br>');
        break;
      }
    case 'br':
      context.text += '\n';
      context.markdown += '\n';
      context.html += '<br>';
      break;
    case 'p':
      context.text += '\n';
      context.markdown += '\n';
      context.html += '<p>';
      await context.render(children);
      context.html += '</p>';
      break;
    case 'a':
      context.html += `<a href="${escapeHtml(String(attrs.href || ''))}">`;
      await context.render(children);
      context.html += '</a>';
      break;
    case 'img':
    case 'image':
      {
        const src = String(attrs.src || attrs.url || '');
        if (src)
        {
          const uploadImage = await context.bot.internal.uploadImageKey(src);
          const imageStyle = getMixedMediaImageStyle(context.bot);
          if (isHtmlWebProxyMixedMedia(context.bot))
          {
            const previewUrl = context.bot.buildExternalMediaUrl(uploadImage.url, 'image');
            context.html += `<a href="${escapeHtml(previewUrl)}"><img src="${escapeHtml(uploadImage.url)}" alt="picture" style="${imageStyle}"></a>`;
          } else
          {
            context.html += `<img src="${escapeHtml(uploadImage.url)}" alt="picture" style="${imageStyle}">`;
          }
        }
        break;
      }
    case 'video':
      {
        const src = String(attrs.src || '');
        if (src)
        {
          const uploadVideo = await context.bot.internal.uploadVideoKey(src);
          const previewUrl = context.bot.buildExternalMediaUrl(uploadVideo.url, 'video');
          context.html += `<a href="${escapeHtml(previewUrl)}" target="_blank" rel="noopener noreferrer">[视频]</a>`;
        }
        break;
      }
    case 'audio':
      {
        const src = String(attrs.src || '');
        if (src)
        {
          const uploadAudio = await context.bot.internal.uploadAudioKey(src);
          context.html += `<a href="${escapeHtml(uploadAudio.url)}" target="_blank" rel="noopener noreferrer">[音频]</a>`;
        }
        break;
      }
    case 'file':
      {
        const src = String(attrs.src || '');
        if (src)
        {
          const uploadFile = await context.bot.internal.uploadFileKey(src);
          const label = escapeHtml(String(attrs.title || '[文件]'));
          context.html += `<a href="${escapeHtml(uploadFile.url)}" target="_blank" rel="noopener noreferrer">${label}</a>`;
        }
        break;
      }
    case 'message':
      await context.render(children);
      break;
    default:
      await context.render(children);
      break;
  }
}

export async function fragmentToPayload(bot: YunhuBot, fragment: Fragment): Promise<{ contentType: string; content: any; }>
{
  const elements = h.normalize(fragment);
  if (!elements.length) return null;

  // 创建一个模拟的上下文，用于收集状态
  const context = {
    bot,
    sendType: undefined,
    text: '',
    markdown: '',
    html: '',
    atPayload: [],
    buttons: [],
    imageKey: undefined,
    fileKey: undefined,
    videoKey: undefined,
    // editMessage不支持分段发送，所以flush是空操作
    flush: async () => { },
    // render需要递归调用_visit
    render: async (children) =>
    {
      for (const child of children)
      {
        await _visit(context, child);
      }
    },
  };

  await context.render(elements);

  const { sendType, text, markdown, html, atPayload, imageKey, fileKey, videoKey, buttons } = context;

  if (!imageKey && !fileKey && !videoKey && !text.trim() && !markdown.trim() && !html.trim() && !buttons.length)
  {
    return null;
  }

  const finalContentType = sendType === 'html-webproxy' ? 'html' : (sendType || 'text');
  const finalContent: any = {};

  if (finalContentType === 'text')
  {
    finalContent.text = text;
  } else if (finalContentType === 'markdown')
  {
    finalContent.text = markdown;
  } else if (finalContentType === 'html')
  {
    finalContent.text = html;
  }

  if (imageKey) finalContent.imageKey = imageKey;
  if (fileKey) finalContent.fileKey = fileKey;
  if (videoKey) finalContent.videoKey = videoKey;
  if (atPayload.length > 0) finalContent.at = atPayload;
  if (buttons.length > 0) finalContent.buttons = [buttons];

  if (!finalContent.text)
  {
    finalContent.text = '';
  }

  return { contentType: finalContentType, content: finalContent };
}

export class YunhuMessageEncoder extends MessageEncoder<Context, YunhuBot>
{
  // 使用 payload 存储待发送的消息
  private payload: Dict;
  private sendType: 'text' | 'image' | 'video' | 'file' | 'markdown' | 'html' | 'html-webproxy' | undefined = undefined;
  private html = "";
  private text = "";
  private markdown = "";
  private atPayload: string[] = [];
  private buttons: Button[] = [];
  private message: Dict = [];
  private switch_message: boolean = true;
  private messageId: string;

  getMessageId(): string
  {
    return this.messageId;
  }

  async prepare()
  {
    let [type, id] = this.channelId.split(':');
    const recvId = id;
    const recvType = type === 'private' ? 'user' : type;

    // 初始化 payload
    this.payload = {
      recvId,
      recvType,
      contentType: 'text',
      content: {
        imageKey: undefined,
        fileKey: undefined,
        videoKey: undefined,
        text: ''
      },
      parentId: this.session.quote ? this.session.quote.id : undefined
    };
  }

  // 将发送好的消息添加到 results 中
  async addResult(data: any)
  {
    const message = data;
    //this.message.push(message)
    const session = this.bot.session();
    session.channelId = this.channelId;
    //session.event.message.id = message.msgId
    session.event.message = {
      id: message.msgId,
      elements: message,
      //等主播放假再改
    };
    //session.quote.id = message.parentId? message.parentId : undefined
    if (message.parentId)
    {
      session.event.message.quote.id = message.parentId;
    }
    session.app.emit(session, 'send', session);
  }

  // 发送缓冲区内的消息
  async flush()
  {
    async function reset()
    {
      this.payload.content.text = '';
      this.sendType = undefined;
      this.payload.content.imageKey = undefined;
      this.payload.content.fileKey = undefined;
      this.payload.content.videoKey = undefined;
      this.payload.contentType = 'text';
      this.html = "";
      this.text = "";
      this.markdown = "";
      this.message = [];
      this.atPayload = [];
      this.buttons = [];
      delete this.payload.content.at;
      delete this.payload.content.buttons;
    }

    if (!this.payload.content.imageKey && !this.payload.content.fileKey && !this.payload.content.videoKey && !this.text && !this.markdown && !this.html && !this.buttons.length)
    {
      return; // Nothing to send.
    }

    if (!this.sendType)
    {
      this.sendType = 'text';
    }
    this.payload.contentType = this.sendType === 'html-webproxy' ? 'html' : this.sendType;

    if (this.sendType === 'text')
    {
      this.payload.content.text = this.text;
    } else if (this.sendType === 'markdown')
    {
      this.payload.content.text = this.markdown;
    } else if (this.sendType === 'html')
    {
      this.payload.content.text = this.html;
    }

    if (this.atPayload.length > 0)
    {
      this.payload.content.at = this.atPayload;
    }

    if (this.buttons.length > 0)
    {
      this.payload.content.buttons = [this.buttons];
    }

    this.bot.logInfo('将发送 payload：\n', JSON.stringify(this.payload, null, 2));
    const useStream = this.bot.config.enableStream && (this.payload.contentType === 'text' || this.payload.contentType === 'markdown');

    const response = useStream
      ? await this.bot.internal.sendStreamMessage(this.payload)
      : await this.bot.internal.sendMessage(this.payload);

    if (response.code === 1 && response.data?.messageInfo?.msgId)
    {
      this.messageId = response.data.messageInfo.msgId;
    }

    await reset.call(this);
  }

  async visit(element: h)
  {
    await _visit(this, element);
  }
}

async function _visit(context: any, element: h)
{
  const { type, attrs, children } = element;
  if (context.message)
  {
    context.message.push(element);
  }

  try
  {
    switch (type)
    {
      case 'text':
        if (context.sendType == undefined)
        {
          context.sendType = 'text';
        } else if (context.sendType === 'image')
        {
          setMixedTextMode(context, context.bot);
        }
        // 将 <br> 替换为换行符
        const content = element.attrs.content.replace(/<br>/g, '\n');
        context.text += context.sendType === "text" ? content : '';
        context.markdown += context.sendType === 'markdown' ? content : '';
        context.html += content;
        break;

      case 'img':
      case 'image':
        if (context.sendType == undefined)
        {
          context.sendType = 'image';
        } else if (context.sendType === 'text' || context.sendType === 'image')
        {
          setMixedTextMode(context, context.bot);
        }
        try
        {
          const uploadImage = await context.bot.internal.uploadImageKey(element.attrs.src ? element.attrs.src : element.attrs.url);
          const useHtmlMixedMedia = isHtmlMixedMedia(context.bot);
          const useHtmlWebProxyMixedMedia = isHtmlWebProxyMixedMedia(context.bot);
          const imageStyle = getMixedMediaImageStyle(context.bot);
          if (useHtmlWebProxyMixedMedia)
          {
            const previewUrl = context.bot.buildExternalMediaUrl(uploadImage.url, 'image');
            context.markdown += context.sendType === 'markdown' ? `\n![picture](${previewUrl})\n` : '';
            context.html += `<a href="${previewUrl}"><img src="${uploadImage.url}" alt="picture" style="${imageStyle}"></a>`;
          } else if (useHtmlMixedMedia)
          {
            context.markdown += context.sendType === 'markdown' ? `\n![picture](${uploadImage.url})\n` : '';
            context.html += `<img src="${uploadImage.url}" alt="picture" style="${imageStyle}">`;
          } else
          {
            context.markdown += context.sendType === 'markdown' ? `\n![picture](${uploadImage.url})\n` : '';
            context.html += `<img src="${uploadImage.url}" alt="picture" style="${imageStyle}">`;
          }
          if (context.sendType === 'image')
          {
            // 区分YunhuMessageEncoder和fragmentToPayload的上下文
            if (context.payload?.content)
            {
              context.payload.content.imageKey = uploadImage.key;
              context.payload.contentType = 'image';
            } else
            {
              context.imageKey = uploadImage.key;
            }
          }
        } catch (error)
        {
          const isSizeLimitError = error instanceof SizeLimitError;
          const errorMsg = isSizeLimitError ? '[图片大小超限]' : '[图片上传失败]';
          context.bot.loggerError(`${errorMsg}: ${error}`);
          context.markdown += context.sendType === 'markdown' ? `~~${errorMsg}~~ ` : '';
          context.html += `<span style ="color: red;">${errorMsg}</span>`;
          if (context.sendType === 'image')
          {
            context.sendType = 'text';
            context.text += errorMsg;
          }
        }
        break;

      case 'video':
        await context.flush();
        context.sendType = 'video';
        try
        {
          const uploadVideo = await context.bot.internal.uploadVideoKey(element.attrs.src);
          const videokey = uploadVideo.key;

          if (context.payload?.content)
          {
            context.payload.content.videoKey = videokey;
          } else
          {
            context.videoKey = videokey;
          }
          await context.flush();
        } catch (error)
        {
          const isSizeLimitError = error instanceof SizeLimitError;
          const errorMsg = isSizeLimitError ? '[视频大小超限]' : '[视频上传失败]';
          context.bot.loggerError(`${errorMsg}: ${error}`);
          context.sendType = 'text';
          context.text += errorMsg;
          await context.flush();
        }
        break;

      case 'audio':
        await context.flush();
        context.sendType = 'video'; // 最终发送的是视频
        try
        {
          const uploadAudio = await context.bot.internal.uploadAudioKey(element.attrs.src);
          const audiokey = uploadAudio.key;
          if (context.payload?.content)
          {
            context.payload.content.videoKey = audiokey;
          } else
          {
            context.videoKey = audiokey;
          }
          await context.flush();
        } catch (error)
        {
          const isSizeLimitError = error instanceof SizeLimitError;
          const errorMsg = isSizeLimitError ? '[音频大小超限]' : '[音频上传失败]';
          context.bot.loggerError(`${errorMsg}: ${error}`);
          context.sendType = 'text';
          context.text += errorMsg;
          await context.flush();
        }
        break;

      case 'at':
        if (context.sendType === 'image')
        {
          await context.flush();
        }
        if (context.sendType === undefined)
        {
          context.sendType = 'text';
        }
        const userId = attrs.id;
        if (!userId)
        {
          await context.render(children);
          return;
        }
        context.atPayload.push(userId);
        let userName = attrs.name;
        if (!userName)
        {
          try
          {
            const user = await context.bot.getUser(userId);
            userName = user.name;
          } catch (error)
          {
            context.bot.logger.warn(`获取用户ID ${userId} 的信息失败，将回退到ID`, error);
            userName = userId;
          }
        }
        const atText = `@${userName}​ `;
        context.text += atText;
        context.markdown += atText;
        context.html += `<span>${atText}</span>`;
        break;

      case 'p':
        if (context.sendType == undefined)
        {
          context.sendType = 'text';
        } else if (context.sendType === 'image')
        {
          setMixedTextMode(context, context.bot);
        }
        context.html += '<p>';
        await context.render(children);
        context.html += '</p>';
        context.text += context.sendType === "text" ? "\n" : '';
        context.markdown += context.sendType === 'markdown' ? "\n" : '';
        break;

      case 'a':
        if (context.sendType == undefined)
        {
          context.sendType = 'text';
        } else if (context.sendType === 'image')
        {
          setMixedTextMode(context, context.bot);
        }
        context.text += context.sendType === "markdown" ? element.attrs.href + " " : '';
        context.markdown += context.sendType === 'markdown' ? `**[链接](${element.attrs.href})** ` : '';
        context.html += `<a href="${element.attrs.href}">`;
        await context.render(children);
        context.html += '</a>';
        break;

      case 'file':
        await context.flush();
        context.sendType = 'file';
        try
        {
          const uploadFile = await context.bot.internal.uploadFileKey(element.attrs.src);
          const filekey = uploadFile.key;
          if (context.payload?.content)
          {
            context.payload.content.fileKey = filekey;
          } else
          {
            context.fileKey = filekey;
          }
        } catch (error)
        {
          const isSizeLimitError = error instanceof SizeLimitError;
          const errorMsg = isSizeLimitError ? '[文件大小超限]' : '[文件上传失败]';
          context.bot.loggerError(`${errorMsg}: ${error}`);
          context.sendType = 'text';
          context.text += errorMsg;
        }
        await context.flush();
        break;

      case 'button': {
        let buttonLabel = '';
        const queue: h[] = [...children];
        while (queue.length > 0)
        {
          const element = queue.shift();
          if (element.type === 'text')
          {
            buttonLabel += element.attrs.content;
          } else if (element.children)
          {
            queue.unshift(...element.children);
          }
        }
        buttonLabel = buttonLabel.trim();

        if (!buttonLabel && typeof attrs.text === 'string')
        {
          buttonLabel = attrs.text;
        }

        const yunhuButton: Partial<Button> = {};
        switch (attrs.type)
        {

          case 'action':
            yunhuButton.actionType = 3; // 3: 点击汇报
            yunhuButton.value = attrs.text;
            if (!buttonLabel) buttonLabel = '确认点击';
            break;

          case 'link':
            yunhuButton.actionType = 1; // 1: 跳转URL
            yunhuButton.url = attrs.href;
            if (!buttonLabel) buttonLabel = '跳转链接';
            break;

          case 'input':
            yunhuButton.actionType = 2; // 2: 复制
            yunhuButton.value = attrs.text;
            if (!buttonLabel) buttonLabel = '复制';
            break;
          default:
            // Ignore unknown types
            break;
        }

        if (yunhuButton.actionType)
        {
          yunhuButton.text = buttonLabel;
          if (!context.buttons)
          {
            context.buttons = [];
          }
          context.buttons.push(yunhuButton as Button);
        }
        break;
      }

      case 'markdown':

      case 'yunhu:markdown':
        await context.flush();
        context.sendType = 'markdown';
        await context.render(children);
        await context.flush();
        break;

      case 'html':

      case 'yunhu:html':
        await context.flush();
        context.sendType = 'html';
        await context.render(children);
        await context.flush();
        break;

      case 'message':
        if (attrs.forward)
        {
          const forwardHtml = await renderForwardCard(context.bot, children);
          if (!forwardHtml)
          {
            break;
          }
          await context.flush();
          context.sendType = 'html';
          context.html += forwardHtml;
          await context.flush();
          break;
        } else if (!context.switch_message)
        {
          await context.render(children);
        }
        else
        {
          await context.flush();
          await context.render(children);
          await context.flush();
        }
        break;

      case 'figure': {
        const forwardHtml = await renderForwardCard(context.bot, children);
        if (!forwardHtml)
        {
          break;
        }
        await context.flush();
        context.sendType = 'html';
        context.html += forwardHtml;
        await context.flush();
        break;
      }

      case 'quote':
        if (context.payload)
        {
          context.payload.parentId = attrs.id;
        }
        await context.render(children);
        break;

      case 'author':
        if (context.sendType == undefined || context.sendType === 'image' || context.sendType === 'text')
        {
          setMixedTextMode(context, context.bot);
        }
        context.markdown += context.sendType === 'markdown' ? `\n**${attrs.name}(${attrs.id})**\n` : '';
        context.html += `\n<strong>${attrs.name}</strong><sub>${attrs.id}</sub><br>`;
        await context.render(children);
        break;

      case 'h1':

      case 'h2':

      case 'h3':

      case 'h4':

      case 'h5':

      case 'h6':
        if (context.sendType == undefined || context.sendType === 'image' || context.sendType === 'text')
        {
          setMixedTextMode(context, context.bot);
        }
        const level = parseInt(type.substring(1));
        context.markdown += context.sendType === 'markdown' ? `${'#'.repeat(level)} ` : '';
        context.html += `<${type}>`;
        await context.render(children);
        context.html += `</${type}>`;
        break;

      case 'pre':

      case 'i18n':
        await context.render(children);
        break;

      case 'strong':

      case 'b':
        if (context.sendType == undefined || context.sendType === 'image' || context.sendType === 'text')
        {
          setMixedTextMode(context, context.bot);
        }
        context.markdown += context.sendType === 'markdown' ? '**' : '';
        context.html += '<b>';
        await context.render(children);
        context.markdown += context.sendType === 'markdown' ? '**' : '';
        context.html += '</b>';
        break;

      case 'i':

      case 'em':
        if (context.sendType == undefined || context.sendType === 'image' || context.sendType === 'text')
        {
          setMixedTextMode(context, context.bot);
        }
        context.markdown += context.sendType === 'markdown' ? '*' : '';
        context.html += '<em>';
        await context.render(children);
        context.markdown += context.sendType === 'markdown' ? '*' : '';
        context.html += '</em>';
        break;

      case 'u':

      case 'ins':
        if (context.sendType == undefined || context.sendType === 'image' || context.sendType === 'text')
        {
          setMixedTextMode(context, context.bot);
        }
        context.html += '<u>';
        await context.render(children);
        context.html += '</u>';
        break;

      case 's':

      case 'del':
        if (context.sendType == undefined || context.sendType === 'image' || context.sendType === 'text')
        {
          setMixedTextMode(context, context.bot);
        }
        context.markdown += context.sendType === 'markdown' ? '~~' : '';
        context.html += '<del>';
        await context.render(children);
        context.markdown += context.sendType === 'markdown' ? '~~' : '';
        context.html += '</del>';
        break;

      case 'spl':
        if (context.sendType == undefined || context.sendType === 'image' || context.sendType === 'text')
        {
          setMixedTextMode(context, context.bot);
        }
        context.html += '<details><summary>点击展开查看</summary>';
        await context.render(children);
        context.html += '</details>';
        break;

      case 'code':
        if (context.sendType == undefined || context.sendType === 'image' || context.sendType === 'text')
        {
          setMixedTextMode(context, context.bot);
        }
        context.markdown += context.sendType === 'markdown' ? '`' : '';
        context.html += '<code>';
        await context.render(children);
        context.markdown += context.sendType === 'markdown' ? '`' : '';
        context.html += '</code>';
        break;

      case 'sup':
        if (context.sendType == undefined || context.sendType === 'image' || context.sendType === 'text')
        {
          setMixedTextMode(context, context.bot);
        }
        context.html += '<sup>';
        await context.render(children);
        context.html += '</sup>';
        break;

      case 'sub':
        if (context.sendType == undefined || context.sendType === 'image' || context.sendType === 'text')
        {
          setMixedTextMode(context, context.bot);
        }
        context.html += '<sub>';
        await context.render(children);
        context.html += '</sub>';
        break;
      default:
        context.bot.loggerError(`未知消息元素类型: ${type}`, element);
        await context.render(children);
        break;
    }
  } catch (error)
  {
    context.bot.loggerError(error);
  }
}
