import { HTTP } from 'koishi';
import { YunhuBot } from './bot';

/**
 * Bot HTTP 封装类
 * 为云湖平台提供统一的网络请求接口，处理请求头和失败重试
 */
export class BotHttp
{
  // 标准API的HTTP实例
  private httpApi: HTTP;
  // Web API的HTTP实例
  private httpWeb: HTTP;

  constructor(
    private bot: YunhuBot,
    endpoint: string,
    endpointweb: string
  )
  {
    // 创建标准API的HTTP实例
    this.httpApi = this.bot.ctx.http.extend({
      endpoint: endpoint,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    // 创建Web API的HTTP实例
    this.httpWeb = this.bot.ctx.http.extend({
      endpoint: endpointweb,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
  }

  /**
   * 发送POST请求到标准API
   */
  async post<T = any>(url: string, data?: any, config?: HTTP.RequestConfig): Promise<T>
  {
    return this.httpApi.post(url, data, config);
  }

  /**
   * 发送GET请求到标准API
   */
  async get<T = any>(url: string, config?: HTTP.RequestConfig): Promise<T>
  {
    return this.httpApi.get(url, config);
  }

  /**
   * 发送POST请求到Web API
   */
  async postWeb<T = any>(url: string, data?: any, config?: HTTP.RequestConfig): Promise<T>
  {
    return this.httpWeb.post(url, data, config);
  }

  /**
   * 发送GET请求到Web API
   */
  async getWeb<T = any>(url: string, config?: HTTP.RequestConfig): Promise<T>
  {
    return this.httpWeb.get(url, config);
  }

  /**
   * 下载文件
   * @param url 文件URL
   * @param config 请求配置
   */
  async file(url: string, config?: HTTP.RequestConfig): Promise<{ data: ArrayBuffer; filename: string; type: string; }>
  {
    // 为文件下载添加特殊的请求头
    const fileConfig: HTTP.RequestConfig = {
      ...config,
      headers: {
        'Referer': 'www.yhchat.com',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        ...config?.headers
      }
    };

    return this.bot.ctx.http.file(url, fileConfig);
  }

  /**
   * 获取标准API的HTTP实例（用于特殊场景）
   */
  getApiInstance(): HTTP
  {
    return this.httpApi;
  }

  /**
   * 获取Web API的HTTP实例（用于特殊场景）
   */
  getWebInstance(): HTTP
  {
    return this.httpWeb;
  }
}