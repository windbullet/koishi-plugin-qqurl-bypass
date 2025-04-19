import { Context, Schema, Element } from 'koishi'
import tlds from "tlds";

export const name = 'qqurl-bypass'

export interface Config {
  mode: 'unicode' | 'space' | 'fullStop' | 'remove' | 'uppercase' | 'tldUppercase'
  whiteList: string[]
}

export const usage = '更新日志：https://forum.koishi.xyz/t/topic/6300'

export const Config: Schema<Config> = Schema.object({
  mode: Schema.union([
    Schema.const('unicode').description('点号前插入unicode字符（不可见所以无痕，但复制访问不方便）'),
    Schema.const('space').description('点号前插入空格（复制访问相对来说方便些）'),
    Schema.const('fullStop').description('点号替换为中文句号（可直接复制访问）'),
    Schema.const('remove').description('移除消息中所有URL'),
    Schema.const('uppercase').description('大写模式 1：域名纯大写'),
    Schema.const('tldUppercase').description('大写模式 2：顶级域名大写')
  ])
    .description('绕过模式')
    .required()
    .role('radio'),
  whiteList: Schema.array(Schema.string()).default([]).description("URL白名单列表（添加后不会被过滤或替换）")
})

export function apply(ctx: Context, config: Config) {
  const { mode, whiteList } = config;
  const logger = ctx.logger(name);

  let replacer = "";
  if (mode === "unicode") replacer = "‎.";
  if (mode === 'space') replacer = " .";
  if (mode === 'fullStop') replacer = "。";

  // 过滤非英文顶级域名
  const tlds_en = tlds.filter(d => d.charAt(0) >= 'a' && d.charAt(0) <= 'z')
  // 匹配文章内容中的域名 (应该完全排除可能嫌疑的 URL)
  const domainRegExp = new RegExp(
    `([A-Za-z0-9]+\\.)+(${tlds_en.join("|")})(?=[^A-Za-z0-9]|$)`,
    "g",
  )

  function sanitizeDomains(elements: Element[]) {
    for (const { attrs, type, children } of elements) {
      if (type !== "text") {
        if (children.length) sanitizeDomains(children);
        continue;
      }
      attrs.content = (attrs.content as string).replaceAll(
        domainRegExp,
        (domain: string) => {
          if (whiteList.includes(domain)) return domain;

          if (config.mode === 'uppercase') {
            return `${domain.toUpperCase()}`;
          } else if (config.mode === 'remove') {
            return '';
          } else if (config.mode === 'tldUppercase') {
            const parts = domain.split('.');
            const tld = parts.pop();
            return `${parts.join('.')}.${tld.toUpperCase()}`;
          } else {
            return domain.replaceAll(".", replacer);
          }
        }
      );
    }
  }

  ctx.on("before-send", (session) => {
    // if (session.platform !== "qq") return;
    sanitizeDomains(session.elements);
  })
}
