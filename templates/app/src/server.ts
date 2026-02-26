import { Application } from '@pearl/core'
import { Router, HttpKernel } from '@pearl/http'

const app = new Application()
const router = new Router()

router.get('/', async (ctx) => {
  ctx.response.json({ message: 'Welcome to Pearl.js 🦪' })
})

router.get('/health', async (ctx) => {
  ctx.response.json({ status: 'ok', timestamp: new Date().toISOString() })
})

const kernel = new HttpKernel({ router })
const port = Number(process.env.PORT ?? 3000)

await kernel.listen(port)
console.log(`\n🦪 Pearl running → http://localhost:${port}\n`)
