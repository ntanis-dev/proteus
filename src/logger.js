import fs from 'fs'
import moment from 'moment'
import ansicolor from 'ansicolor'

ansicolor.nice
console.clear()

const startedAt = moment().format('YYYY-MM-DD-HH-mm-ss')

const log = (prefix, ...args) => {
    const message = `[${moment().format('YYYY-MM-DD HH:mm:ss.SSSZ').black.bright}] [${prefix.magenta.bright}] ${args.map(arg => arg instanceof Error ? `${arg.name} ${arg.message} ${arg.stack}` : String(arg)).join(' ')}`

    console.log(message)

    fs.writeFileSync(`./../storage/logs/${startedAt}.txt`, ansicolor.strip(`${message}\n`), {
        flag: 'a'
    })
}

export default log
