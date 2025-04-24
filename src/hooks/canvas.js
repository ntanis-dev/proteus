const __originalToDataURL = HTMLCanvasElement.prototype.toDataURL

window.HTMLCanvasElement.prototype.toDataURL = function() {
    const result = __originalToDataURL.apply(this, arguments)

    __proteus('HTMLCanvasElement.toDataURL', {
        result
    }, false)

    return result
}

const __originalGetImageData = CanvasRenderingContext2D.prototype.getImageData

window.CanvasRenderingContext2D.prototype.getImageData = function() {
    const result = __originalGetImageData.apply(this, arguments)

    __proteus('CanvasRenderingContext2D.getImageData', {
        result
    }, false)

    return result
}

const __originalToBlob = HTMLCanvasElement.prototype.toBlob

window.HTMLCanvasElement.prototype.toBlob = function() {
    const result = __originalToBlob.apply(this, arguments)

    __proteus('HTMLCanvasElement.toBlob', {
        result
    }, false)

    return result
}
