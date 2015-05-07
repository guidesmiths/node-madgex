var debug = require('debug')('node-madgex')
var utils = require('./lib/util.js')
var restClient = require('./lib/rest-api-client.js')
var soapClient = require('./lib/soap-api-client.js')

module.exports = {
    utils: utils,
    createClient: function(baseUrl, credentials) {
        return {
            restApi: restClient(baseUrl, credentials),
            soapApi: soapClient(baseUrl)
        }
    }
}