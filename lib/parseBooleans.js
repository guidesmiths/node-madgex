// https://github.com/Leonidas-from-XIV/node-xml2js/pull/200

module.exports = function(str) {
    return /^(?:true|false)$/i.test(str) ? str.toLowerCase() === 'true' : str
}