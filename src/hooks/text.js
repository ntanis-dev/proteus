const __originalTextEncoderEncode = TextEncoder.prototype.encode

TextEncoder.prototype.encode = function (str) {
    __proteus('TextEncoder.encode', {
        str
    }, false)

    return __originalTextEncoderEncode.apply(this, [str])
}

const __originalTextEncoderDecode = TextEncoder.prototype.decode

TextEncoder.prototype.decode = function (bytes) {
    __proteus('TextEncoder.decode', {
        bytes
    }, false)

    return __originalTextEncoderDecode.apply(this, [bytes])
}
