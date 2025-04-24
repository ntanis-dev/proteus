const __originalJsonParse = JSON.parse

JSON.parse = function (str, reviver) {
    const result = __originalJsonParse(str, reviver)

    __proteus('JSON.parse', {
        str
    }, false)

    return result
}

const __originalJsonStringify = JSON.stringify

JSON.stringify = function (obj, replacer, space) {
    const result = __originalJsonStringify(obj, replacer, space)
    const stack = new Error().stack

    if (!stack.includes('globalThis.<computed> (<anonymous>:45:18)'))
        __proteus('JSON.stringify', {
            obj
        }, false)

    return result
}
