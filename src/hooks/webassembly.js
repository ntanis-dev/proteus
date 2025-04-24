const __originalWasmInstantiate = WebAssembly.instantiate

WebAssembly.instantiate = function (bufferSource, importObject) {
    const result = __originalWasmInstantiate.apply(this, arguments)

    __proteus('WebAssembly.instantiate', {
        bufferSource,
        importObject,
        result
    }, false)

    return result
}
