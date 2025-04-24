const __originalImport = window.import

window.import = function (moduleName) {
    const result = __originalImport.apply(this, arguments)

    __proteus('import', {
        moduleName,
        result
    }, false)

    return result
}

const __originalRequire = window.require

window.require = function (moduleName) {
    const result = __originalRequire.apply(this, arguments)

    __proteus('require', {
        moduleName,
        result
    }, false)

    return result
}
