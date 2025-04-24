import crypto from 'crypto'

const hash = data => crypto.createHash('md5').update(data).digest('hex')
const randomIntBetween = (min, max) => Math.floor(Math.random() * (max - min + 1) + min)

const generateProxy = (proxy, session) => {
    return {
        server: proxy.server,
        username: proxy.username?.replace('{SESSION}', session) || undefined,
        password: proxy.password?.replace('{SESSION}', session) || undefined
    }
}

export default {
    hash,
    randomIntBetween,
    generateProxy
}
