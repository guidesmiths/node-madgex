var debug = require('debug')('node-madgex'),
    utils = require('./lib/util.js'),
    restClient = require('./lib/rest-api-client.js')



module.exports = {
    utils: utils,
    createClient: function (sitename, credentials, requestOptions) {
        return {
            restApi: restClient(sitename, credentials) 
        }
    }
}