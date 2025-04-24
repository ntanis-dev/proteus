const __originalEval = window.eval

window.eval = function (code) {
    const stack = new Error().stack

    if (!stack.includes('<anonymous>:94:19'))
        __proteus('eval', {
            stack,
            code
        }, false)

    return __originalEval(code)
}

const __originalFunctionPrototype = Function.prototype

Function.prototype = function (code) {
    const stack = new Error().stack

    __proteus('Function.prototype', {
        stack,
        code
    }, false)

    return __originalFunctionPrototype(code)
}
