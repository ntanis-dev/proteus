const __originalExportKey = window.crypto.subtle.exportKey

window.crypto.subtle.exportKey = async function (format, key) {
    const stack = new Error().stack
    const result = await __originalExportKey.apply(this, [format, key])

    __proteus('SubtleCrypto.exportKey', {
        stack,
        format,
        key: result
    }, false)

    return result
}

const __originalEncrypt = window.crypto.subtle.encrypt

window.crypto.subtle.encrypt = async function (algorithm, key, data) {
    __proteus('SubtleCrypto.encrypt', {
        algorithm,
        stack: new Error().stack,
        key: await __originalExportKey.apply(this, ['jwk', key]),
        data
    }, false)

    return __originalEncrypt.apply(this, [algorithm, key, data])
}

const __originalDecrypt = window.crypto.subtle.decrypt

window.crypto.subtle.decrypt = async function (algorithm, key, data) {
    __proteus('SubtleCrypto.decrypt', {
        algorithm,
        stack: new Error().stack,
        key: await __originalExportKey.apply(this, ['jwk', key]),
        data
    }, false)

    return __originalDecrypt.apply(this, [algorithm, key, data])
}

const __originalGenerateKey = window.crypto.subtle.generateKey

window.crypto.subtle.generateKey = async function (algorithm, extractable, keyUsages) {
    const stack = new Error().stack
    const generatedKey = await __originalGenerateKey.apply(this, [algorithm, true, keyUsages])

    __proteus('SubtleCrypto.generateKey', {
        algorithm,
        extractable,
        keyUsages,
        stack,
        generatedKey: await __originalExportKey.apply(this, ['jwk', generatedKey])
    }, false)

    return generatedKey
}

const __originalImportKey = window.crypto.subtle.importKey

window.crypto.subtle.importKey = async function (format, keyData, algorithm, extractable, keyUsages) {
    const stack = new Error().stack
    const importedKey = await __originalImportKey.apply(this, [format, keyData, algorithm, true, keyUsages])

    __proteus('SubtleCrypto.importKey', {
        format,
        keyData,
        algorithm,
        extractable,
        keyUsages,
        stack,
        importedKey: await __originalExportKey.apply(this, ['jwk', importedKey])
    }, false)

    return importedKey
}

const __originalWrapKey = window.crypto.subtle.wrapKey

window.crypto.subtle.wrapKey = async function (format, key, wrappingKey, wrapAlgo) {
    const stack = new Error().stack
    const wrappedKey = await __originalWrapKey.apply(this, [format, key, wrappingKey, wrapAlgo])

    __proteus('SubtleCrypto.wrapKey', {
        format,
        key: await __originalExportKey.apply(this, ['jwk', key]),
        stack,
        wrappingKey: await __originalExportKey.apply(this, ['jwk', wrappingKey]),
        wrapAlgo,
        wrappedKey: new Uint8Array(wrappedKey)
    }, false)

    return wrappedKey
}

const __originalUnwrapKey = window.crypto.subtle.unwrapKey

window.crypto.subtle.unwrapKey = async function (format, wrappedKey, unwrappingKey, unwrapAlgo, unwrappedKeyAlgo, extractable, keyUsages) {
    const stack = new Error().stack
    const unwrappedKey = await __originalUnwrapKey.apply(this, [format, wrappedKey, unwrappingKey, unwrapAlgo, unwrappedKeyAlgo, true, keyUsages])

    __proteus('SubtleCrypto.unwrapKey', {
        format,
        wrappedKey,
        stack,
        unwrappingKey: await __originalExportKey.apply(this, ['jwk', unwrappingKey]),
        unwrapAlgo,
        unwrappedKeyAlgo,
        extractable,
        keyUsages,
        unwrappedKey: await __originalExportKey.apply(this, ['jwk', unwrappedKey])
    }, false)

    return unwrappedKey
}

const __originalSign = window.crypto.subtle.sign

window.crypto.subtle.sign = async function (algorithm, key, data) {
    __proteus('SubtleCrypto.sign', {
        algorithm,
        stack: new Error().stack,
        key: await __originalExportKey.apply(this, ['jwk', key]),
        data
    }, false)

    return __originalSign.apply(this, [algorithm, key, data])
}

const __originalVerify = window.crypto.subtle.verify

window.crypto.subtle.verify = async function (algorithm, key, signature, data) {
    __proteus('SubtleCrypto.verify', {
        algorithm,
        stack: new Error().stack,
        key: await __originalExportKey.apply(this, ['jwk', key]),
        signature,
        data
    }, false)

    return __originalVerify.apply(this, [algorithm, key, signature, data])
}

const __originalDigest = window.crypto.subtle.digest

window.crypto.subtle.digest = async function (algorithm, data) {
    __proteus('SubtleCrypto.digest', {
        algorithm,
        data
    }, false)

    return __originalDigest.apply(this, [algorithm, data])
}

const __originalDeriveKey = window.crypto.subtle.deriveKey

window.crypto.subtle.deriveKey = async function (algorithm, baseKey, derivedKeyType, extractable, keyUsages) {
    __proteus('SubtleCrypto.deriveKey', {
        algorithm,
        stack: new Error().stack,
        baseKey: await __originalExportKey.apply(this, ['jwk', baseKey]),
        derivedKeyType,
        extractable,
        keyUsages
    }, false)

    extractable = true

    return __originalDeriveKey.apply(this, [algorithm, baseKey, derivedKeyType, extractable, keyUsages])
}

const __originalDeriveBits = window.crypto.subtle.deriveBits

window.crypto.subtle.deriveBits = async function (algorithm, baseKey, length) {
    __proteus('SubtleCrypto.deriveBits', {
        algorithm,
        stack: new Error().stack,
        baseKey: await __originalExportKey.apply(this, ['jwk', baseKey]),
        length
    }, false)

    return __originalDeriveBits.apply(this, [algorithm, baseKey, length])
}


const __originalRandomValues = window.crypto.getRandomValues

window.crypto.getRandomValues = function (array) {
    const originalArray = JSON.parse(JSON.stringify(array))
    const result = __originalRandomValues.apply(this, [array])

    __proteus('Crypto.getRandomValues', {
        array: originalArray,
        result
    }, false)

    return result
}
