import "server-only";

export interface SparkMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface SparkChatOptions {
  /** 星火模型版本：lite(免费) / generalv3.5 / 4.0Ultra 等 */
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

const SPARK_ENDPOINT =
  "https://spark-api-open.xf-yun.com/v1/chat/completions";

/** 兼容旧变量名，优先使用 SPARK_API_PASSWORD */
function getApiPassword(): string | undefined {
  return process.env.SPARK_API_PASSWORD ?? process.env.SPARK_API_KEY;
}

export class SparkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SparkError";
  }
}

/**
 * 调用讯飞星火 OpenAI 兼容接口，返回助手文本。
 * 鉴权使用控制台获取的 APIPassword（形如 key:secret）。
 */
export async function sparkChat(
  messages: SparkMessage[],
  options: SparkChatOptions = {},
): Promise<string> {
  const apiPassword = getApiPassword();
  if (!apiPassword) {
    throw new SparkError(
      "未配置 SPARK_API_PASSWORD，请在 .env.local 中设置星火 APIPassword。",
    );
  }

  const {
    model = process.env.SPARK_MODEL ?? "lite",
    temperature = 0.7,
    maxTokens = 2048,
  } = options;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  let response: Response;
  try {
    response = await fetch(SPARK_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiPassword}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream: false,
      }),
      signal: controller.signal,
    });
  } catch (err) {
    throw new SparkError(
      err instanceof Error && err.name === "AbortError"
        ? "星火接口请求超时。"
        : "星火接口网络请求失败。",
    );
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new SparkError(`星火接口返回 ${response.status}：${text}`);
  }

  const data = (await response.json()) as {
    code?: number;
    message?: string;
    choices?: { message?: { content?: string } }[];
  };

  if (typeof data.code === "number" && data.code !== 0) {
    throw new SparkError(`星火接口错误(${data.code})：${data.message ?? ""}`);
  }

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new SparkError("星火接口未返回内容。");
  }

  return content.trim();
}
