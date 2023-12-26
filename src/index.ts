import { Context, Schema } from 'koishi'
import { before } from 'node:test'

export const name = 'qqurl-bypass'

export interface Config {}

export const Config: Schema<Config> = Schema.object({})

export function apply(ctx: Context) {
  ctx.on("before-send", (session) => {
    session.content = session.content.replace(/\./g, "‎.")
  })
}
