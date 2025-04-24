import logger from './logger.js'
import Browser from './browser.js'

process.title = 'Proteus'

logger('Slave', 'The process has started.'.green.dim)

new Browser()

process.on('exit', () => logger('Slave', 'The process has exited.'.red.dim))
