class RequestError extends Error {
    constructor(message) {
        super(message)
        this.name = 'RequestError'
    }
}

class BrowserClosedError extends Error {
    constructor() {
        super('The browser has been closed.')
        this.name = 'BrowserClosedError'
    }
}

export {
    RequestError,
    BrowserClosedError
}
