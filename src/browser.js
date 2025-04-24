import {
    chromium
} from 'playwright'

import {
    Ray,
    ray
} from 'node-ray'

import {
    v4
} from 'uuid'

import fs from 'fs'
import path from 'path'
import url from 'url'

import {
    RequestError,
    BrowserClosedError
} from './errors.js'

import helpers from './helpers.js'
import logger from './logger.js'
import config from './config.js'
import env from './env.js'

Ray.useDefaultSettings({
    sending_payload_callback: (rayInstance, payloads) => {
        const data = payloads[0].content ? JSON.parse(payloads[0].content) : null

        if (data?.__custom) {
            payloads[0].data.origin = data.__custom.origin
            payloads[0].data.content = data.__custom.content
            payloads[0].content = data.__custom.content.content
            payloads[0].label = data.__custom.content.label
        }
    }
})

ray().macro('custom', function(data) {
    this.sendCustom(JSON.stringify({
        __custom: data 
    }), 'custom').color(data.color)
})

ray().clearAll()

class Browser {
    #proxy = null
    #session = null
    #browserCtx = null
    #page = null
    #destroyed = false
    #restarting = false
    #closed = false
    #restartAttempts = 0

    constructor() {
        this.#log('The browser has been constructed.'.magenta)
        this.#session = env.forceSession ?? helpers.hash(v4())
        this.#log(`The browser session has been set to "${this.#session.yellow.bright}".`.yellow)
        this.start().catch(error => this.#log('Failed to start the browser.'.red, error))
    }

    async start(restart = false) {
        if (restart)
            this.#restarting = false

        if (restart)
            fs.rmSync(`./../storage/browser/${this.#session}`, {
                recursive: true
            })

        if (!fs.existsSync(`./../storage/browser/${this.#session}`))
            fs.mkdirSync(`./../storage/browser/${this.#session}`)

        this.#proxy = env.proxy?.enabled ? helpers.generateProxy(env.proxy, this.#session) : null

        this.#browserCtx = await chromium.launchPersistentContext(url.fileURLToPath(new URL(`./../storage/browser/${this.#session}`, import.meta.url)), {
            args: ['-disable-blink-features=AutomationControlled'],
            colorScheme: 'dark',
            devtools: env.devtools,
            channel: 'chrome',
            viewport: env.viewport,
            headless: false,
            bypassCSP: true,
            ignoreHTTPSErrors: true,

            proxy: this.#proxy ? {
                server: this.#proxy.server,
                username: this.#proxy.username,
                password: this.#proxy.password
            } : undefined
        })

        this.#closed = false

        this.#page = this.#browserCtx.pages()[0]

        const initScripts = []

        await this.#browserCtx.route('**', async (route, request) => {
            const url = request.url()

            for (let index = 0; index < env.overrides.length; index++) {
                const override = env.overrides[index]

                if (!override.enabled)
                    continue

                if ((new RegExp(override.regex)).test(url)) {
                    const response = await route.fetch()

                    await route.fulfill({
                        headers: response.headers(),
                        body: fs.readFileSync(`./overrides/${override.file}`, 'utf8')
                    })

                    return
                }
            }

            for (let index = 0; index < env.blocks.length; index++) {
                const block = env.blocks[index]

                if (!block.enabled)
                    continue

                if ((new RegExp(block.regex)).test(url)) {
                    await route.abort('blocked')
                    return
                }
            }

            route.continue()
        })

        initScripts.push(`
            const __proteus = async (title, args, force = true) => {
                let stack = new Error().stack

                if (args.stack) {
                    stack = args.stack
                    delete args.stack
                }

                // console.trace(\`[proteus] \${title}\`, args)

                __ray({
                    stack,
                    title,
                    args,
                    force,
                    hostname: window.location.hostname
                })
            }
        `)

        await this.#browserCtx.exposeFunction('__ray', async data => {
            try {
                const parsed = this.#parseRay(data)

                if (parsed)
                    ray().custom(parsed)
            } catch (e) {
                this.#log(e)
            }
        })

        await this.#browserCtx.exposeFunction('__error', async error => this.#log(error))

        const files = fs.readdirSync('./hooks').filter(file => file.endsWith('.js'))

        for (const file of files) {
            const filePath = path.join('./hooks', file)
            const fileContent = fs.readFileSync(filePath, 'utf8')

            initScripts.push(fileContent)
        }

        initScripts.push('delete __pwInitScripts')

        await this.#browserCtx.addInitScript(`
            try {
                ${initScripts.join('\n')}
            } catch (e) {
                __error(e)
            }
        `)

        await this.#navigate(env.startUrl)

        this.#browserCtx.on('close', () => {
            this.#closed = true
            this.#log('The browser has been closed.'.yellow)
            this.#kill()
        })
    }

    async #navigate(url) {
        if (this.#page.url() === url)
            return

        if (this.#closed)
            throw new BrowserClosedError()

        try {
            await this.#page.goto(url, {
                waitUntil: 'domcontentloaded',
                timeout: config.timings.loadTimeoutMs
            })

            await new Promise(resolve => setTimeout(resolve, config.timings.afterNavigationDelayMs))
        } catch (e) {
            if (e.message?.includes('browser has been closed'))
                throw new BrowserClosedError()
            else
                throw new RequestError(`The URL "${url.red.bright}" could not be loaded.`)
        }

        await new Promise(resolve => setTimeout(resolve, helpers.randomIntBetween(config.timings.timeBetweenActionsMs.min, config.timings.timeBetweenActionsMs.max)))
    }

    async #kill() {
        if (this.#restarting) {
            this.#browserCtx.close().catch(error => { })
            return
        }

        this.#restarting = true

        await this.#browserCtx.close().catch(error => { })

        this.#log('The browser has been killed.'.yellow)

        if (this.#destroyed)
            return
        else if (this.#restartAttempts >= config.limits.restartAttempts) {
            await this.#destroy('The maximum number of restart attempts has been reached.')
            return
        }

        this.#restartAttempts += 1

        setTimeout(() => this.start(true).catch(error => this.#log('Failed to re-start the browser.'.red)), config.timings.browserRestartDelayMs)
    }

    async #destroy(reason) {
        this.#destroyed = true

        this.#log(reason.red)

        await this.#kill()

        this.#log('The browser has been destroyed.'.red.bright)

        process.exit(1)
    }

    #argToHtml(value, key, indentLevel = 0) {
        const padding = indentLevel * 20

        let type = typeof(value)
        let title = `<span style="padding-left: ${padding}px;"><strong>${key} ({TYPE_PLACEHOLDER})</strong>{CARET_PLACEHOLDER}</span>`
        let contents = ''

        const wrapText = text => `<span style="display: inline-block; max-width: 512px; white-space: pre-wrap; word-wrap: break-word;">${text}</span>`
    
        switch (type) {
            case 'undefined':
                break

            case 'boolean':
                contents = `<div style="padding-left: ${padding + 20}px; color: cyan;">${value}</div>`
                break

            case 'number':
                contents = `<div style="padding-left: ${padding + 20}px; color: red;">${value}</div>`
                break

            case 'string':
                if (value.startsWith('data:image')) {
                    contents = `<div style="padding-left: ${padding + 20}px;"><img src="${value}" alt="${key}" style="max-width: 100%;"></div>`
                    type = 'base64_image'
                } else
                    contents = `<div style="padding-left: ${padding + 20}px; color: green;"><span style="display: inline-block;">"${wrapText(value)}"</span></div>`
                    
                break

            case 'bigint':
                contents = `<div style="padding-left: ${padding + 20}px; color: purple;">${value}n</div>`
                break

            case 'symbol':
                contents = `<div style="padding-left: ${padding + 20}px; color: orange;">Symbol()</div>`
                break

            case 'object':
                if (value === null)
                    break
                else if (value instanceof Date) {
                    contents = `<div style="padding-left: ${padding + 20}px; color: darkcyan;">${value.toString()}</div>`
                    type = 'date'
                } else if (Array.isArray(value)) {
                    contents = `<div style="padding-left: ${padding + 20}px;">[<br>${value.map((v, index) => this.#argToHtml(v, index.toString(), indentLevel + 1)).join('')}${' '.repeat(padding)}]</div>`
                    type = 'array'
                } else
                    contents = `<div style="padding-left: ${padding + 20}px;">{<br>${Object.entries(value).map(([k, v]) => this.#argToHtml(v, k, indentLevel + 1)).join('')}${' '.repeat(padding)}}</div>`

                break

            default:
                contents = `<div style="padding-left: ${padding + 20}px;"><span style="white-space: nowrap; display: inline-block;">${wrapText(String(value))}</span></div>`
                break
        }

        if (contents === '')
            return `<span style="cursor: not-allowed;">${title.replace('{TYPE_PLACEHOLDER}', type).replace('{CARET_PLACEHOLDER}', '')}</span>`
        else if (indentLevel === 0) {
            const groupId = `arg-${v4()}`
            return `<span onclick="document.getElementById('${groupId}').style.display === 'block' ? (document.getElementById('${groupId}').style.display = 'none', this.querySelector('span').querySelector('span').innerHTML = '&#9660;') : (document.getElementById('${groupId}').style.display = 'block', this.querySelector('span').querySelector('span').innerHTML = '&#9650;');" style="cursor: pointer;">${title.replace('{TYPE_PLACEHOLDER}', type).replace('{CARET_PLACEHOLDER}', ' <span style="user-select: none;">&#9660;</span>')}</span><div id="${groupId}" style="display: none;">${contents}</div>`
        } else
            return `<span>${title.replace('{TYPE_PLACEHOLDER}', type).replace('{CARET_PLACEHOLDER}', '')}</span><div>${contents}</div>`
    }

    #stackToHtml(lines) {
        const wrapText = text => `<span style="display: inline-block; max-width: 1024px; white-space: pre-wrap; word-wrap: break-word;">${text}</span>`

        let contents = ``

        for (let i = 0; i < lines.length; i++)
            contents = `${contents}<div style="padding-left: 20px; color: gray;">${wrapText(lines[i].trim())}</div>`

        if (contents === '')
            return `<span style="cursor: not-allowed;color: gray;display: inline-block; margin-top: 5px;">no trace</span>`
        else {
            const groupId = `stack-${v4()}`
            return `<span onclick="document.getElementById('${groupId}').style.display === 'block' ? (document.getElementById('${groupId}').style.display = 'none', this.querySelector('span').innerHTML = '&#9660;') : (document.getElementById('${groupId}').style.display = 'block', this.querySelector('span').innerHTML = '&#9650;');" style="cursor: pointer;color: gray;display: inline-block; margin-top: 5px;">trace <span style="user-select: none;">&#9660;</span></span><div id="${groupId}" style="display: none;">${contents}</div>`
        }
    }

    #parseRay(data) {
        const args = []

        for (const key in data.args)
            args.push(this.#argToHtml(data.args[key], key))

        
        let splitStack = data.stack.split('\n')

        splitStack = splitStack[1].trim().startsWith('at __proteus ') ? splitStack.slice(3) : splitStack.slice(2)

        let hasFnName = true
        let match = splitStack[0]?.match(/at (.*?)\s\((.*?):(\d+):(\d+)\)/)

        if (!match) {
            match = splitStack[0]?.match(/at (.*?):(\d+):(\d+)/)
            hasFnName = false
        }

        const parsed = {
            origin: {
                function_name: hasFnName ? match?.[1] ?? 'anonymous' : 'anonymous',
                file: match?.[hasFnName ? 2 : 1] ?? 'unknown',
                line_number: match?.[hasFnName ? 3 : 2] && match?.[hasFnName ? 4 : 3] ? `${match[hasFnName ? 3 : 2]}:${match[hasFnName ? 4 : 3]}` : 'unknown',
                hostname: data.hostname
            },

            content: {
                content: args.join('<br />'),
                label: 'Unknown'
            }
        }

        const lowerCaseContent = parsed.content.content.toLowerCase()

        if (data.title.startsWith('Crypto.') || data.title.startsWith('SubtleCrypto.') || data.title.startsWith('TextEncoder.') || data.title === 'btoa' || data.title === 'atob') {
            parsed.color = 'green'
            parsed.content.label = 'Cryptography'
        } else if (data.title.startsWith('WebAssembly.') || data.title === 'require' || data.title === 'import' || data.title === 'eval' || data.title === 'Function.prototype') {
            parsed.color = 'gray'
            parsed.content.label = 'Miscellaneous'
        } else if (lowerCaseContent.includes('times new roman') || lowerCaseContent.includes('oes_element_index_uint') || lowerCaseContent.includes('vorbis') || lowerCaseContent.includes('mp3')) {
            parsed.color = 'red'
            parsed.content.label = 'Fingerprinting'
        } else if (lowerCaseContent.includes('gecko')) {
            parsed.color = 'orange'
            parsed.content.label = 'Tracking'
        } else if (lowerCaseContent.includes('<img src')) {
            parsed.color = 'purple'
            parsed.content.label = 'Image'
        } else if (!data.force)
            return

        if (parsed.color)
            parsed.content.content = `${parsed.content.content}<br />${this.#stackToHtml(splitStack)}`
        else {
            parsed.color = 'blue'
            parsed.content.label = 'Custom'
        }

        parsed.content.content = `${parsed.content.content}<div style="position: absolute; right: 20px; top: 20px;color: white;cursor: pointer;" data-string="${JSON.stringify({
            args: data.args,
            stack: splitStack,
            hostname: data.hostname
        }).replace(/["'&<>]/g, match => ({'"': '&quot;', "'": '&#39;', '&': '&amp;', '<': '&lt;', '>': '&gt;'}[match]))}" onclick="navigator.clipboard.writeText(this.getAttribute('data-string'));">&#x2398;</div>`;

        parsed.content.content = `<i>${data.title}</i><br /><br />${parsed.content.content}`

        return parsed
    }

    #log(...args) {
        logger('Browser', ...args)
    }
}

export default Browser
