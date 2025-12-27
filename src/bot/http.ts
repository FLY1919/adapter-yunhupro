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
   * 带重试的请求包装器
   * @param requestFn 请求函数
   * @param requestName 请求名称（用于日志）
   */
  private async withRetry<T>(requestFn: () => Promise<T>, requestName: string): Promise<T>
  {
    const maxRetries = this.bot.config.maxRetries || 3;
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++)
    {
      try
      {
        return await requestFn();
      } catch (error)
      {
        lastError = error;

        if (attempt < maxRetries)
        {
          // 计算延迟时间：第1次重试延迟1秒，第2次2秒，以此类推
          const delayMs = attempt * 1000;
          this.bot.logInfo(`${requestName} 请求失败 (尝试 ${attempt}/${maxRetries})，${delayMs}ms 后重试...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        } else
        {
          this.bot.loggerError(`${requestName} 请求失败，已达到最大重试次数 (${maxRetries})`, error);
        }
      }
    }

    throw lastError;
  }

  /**
   * 发送POST请求到标准API（带重试）
   */
  async post<T = any>(url: string, data?: any, config?: HTTP.RequestConfig): Promise<T>
  {
    return this.withRetry(
      () => this.httpApi.post(url, data, config),
      `POST ${url}`
    );
  }

  /**
   * 发送GET请求到标准API（带重试）
   */
  async get<T = any>(url: string, config?: HTTP.RequestConfig): Promise<T>
  {
    return this.withRetry(
      () => this.httpApi.get(url, config),
      `GET ${url}`
    );
  }

  /**
   * 发送POST请求到Web API（带重试）
   */
  async postWeb<T = any>(url: string, data?: any, config?: HTTP.RequestConfig): Promise<T>
  {
    return this.withRetry(
      () => this.httpWeb.post(url, data, config),
      `POST(Web) ${url}`
    );
  }

  /**
   * 发送GET请求到Web API（带重试）
   */
  async getWeb<T = any>(url: string, config?: HTTP.RequestConfig): Promise<T>
  {
    return this.withRetry(
      () => this.httpWeb.get(url, config),
      `GET(Web) ${url}`
    );
  }

  /**
   * 下载文件（带重试）
   * @param url 文件URL
   * @param config 请求配置
   */
  async file(url: string, config?: HTTP.RequestConfig): Promise<{ data: ArrayBuffer; filename: string; type: string; }>
  {
    // 为文件下载添加特殊的请求头
    const fileConfig: HTTP.RequestConfig = {
      ...config,
      headers: {
        ...config?.headers,
        'referer': 'https://yhfx.jwznb.com/',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    };

    return this.withRetry(
      () => this.bot.ctx.http.file(url, fileConfig),
      `FILE ${url.length > 100 ? url.substring(0, 100) + '...' : url}`
    );
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