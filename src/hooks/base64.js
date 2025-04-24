const __originalBase64Decode = window.atob

window.atob = function (str) {
    const result = __originalBase64Decode(str)

    __proteus('atob', {
        str,
        result
    }, false)

    return result
}

const __originalBase64Encode = window.btoa

window.btoa = function (str) {
    const result = __originalBase64Encode(str)

    __proteus('btoa', {
        str,
        result
    }, false)

    return result
}
