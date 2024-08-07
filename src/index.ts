import { Context, Schema } from 'koishi'

export const name = 'qqurl-bypass'

export interface Config {
  mode: 'unicode' | 'space' | 'fullStop' | 'remove'
}

export const usage = '更新日志：https://forum.koishi.xyz/t/topic/6300'

export const Config: Schema<Config> = Schema.object({
  mode: Schema.union([
    Schema.const('unicode').description('点号前插入unicode字符（不可见所以无痕，但复制访问不方便）'),
    Schema.const('space').description('点号前插入空格（复制访问相对来说方便些）'),
    Schema.const('fullStop').description('点号替换为中文句号（可直接复制访问）'),
    Schema.const('remove').description('移除消息中所有URL')
  ])
    .description('绕过模式')
    .required()
    .role('radio')

})

export function apply(ctx: Context, config: Config) {
  ctx.on("before-send", (session) => {
    let elements = []
    for (let element of session.elements) {
      if (element.type === 'text') {
        switch (config.mode) {
          case 'unicode':
            element.attrs.content = element.attrs.content.replaceAll(/\./g, "‎.")
            break
          case 'space':
            element.attrs.content = element.attrs.content.replaceAll(/\./g, " .")
            break
          case 'fullStop':
            element.attrs.content = element.attrs.content.replaceAll(/\./g, "。")
            break
          case 'remove':
            element.attrs.content = element.attrs.content.replaceAll(new RegExp("(https?|ftp|file)://[-A-Za-z0-9+&@#/%?=~_|!:,.;]+[-A-Za-z0-9+&@#/%=~_|]", "g"), "")
            break
        }
      }
      elements.push(element)
    }
    session.elements = elements
  })
}
