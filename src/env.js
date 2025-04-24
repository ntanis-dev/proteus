import fs from 'fs'

const env = JSON.parse(fs.readFileSync('./../env.json', 'utf8'))

export default env
