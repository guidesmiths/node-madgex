'use strict'

var fs = require('fs')
var handlebars = require('handlebars')
var format = require('util').format
var path = require('path')
var request = require('request')
var xml2js = require('xml2js')
var jsonPointer = require('json-pointer')
var _ = require('lodash')
var changeCase = require('change-case')
var parseBooleans = require('./parseBooleans')
var serviceDescription = require('./soap-api-service-description.json')

handlebars.registerHelper('defined', function(value, options) {
    return value !== undefined ? options.fn(this) : options.inverse(this)
});

module.exports = function (baseUrl) {

    var api = {}

    _.each(serviceDescription, function(apiConfig, apiName) {

        api[apiName] = {}

        _.each(apiConfig.services, function(serviceConfig, serviceName) {
            var source = fs.readFileSync(path.join(__dirname, 'soap-templates', serviceName + '.hbs'), { encoding: 'UTF-8'})
            var template = handlebars.compile(source)
            var url = baseUrl + apiConfig.path

            api[apiName][changeCase.camel(serviceName)] = function() {
                var args = Array.prototype.slice.call(arguments)
                var next = args.pop()
                var data = args.pop()

                request({
                    url: url,
                    method: 'POST',
                    headers: {
                        'Content-Type': 'text/xml'
                    },
                    body: template(data)
                }, function(err, response, body) {
                    if (err) return next(new Error(format('POST %s failed. Original error was: %s', url, err.message)))
                    if (!/^2/.test(response.statusCode)) return next(new Error(format('POST %s failed. Status code was: %d', url, response.statusCode)))
                    new xml2js.Parser({
                        trim: true,
                        explicitArray: false,
                        tagNameProcessors: [xml2js.processors.firstCharLowerCase, lowerCase('id')],
                        attrNameProcessors: [xml2js.processors.firstCharLowerCase],
                        valueProcessors: [xml2js.processors.parseNumbers, parseBooleans]
                    }).parseString(body, function(err, obj) {
                        if (err) return next(err)
                        _.each(serviceConfig.arrays, function(pointer) {
                            var item = jsonPointer.get(obj, pointer)
                            if (!_.isArray(item)) jsonPointer.set(obj, pointer, [item])
                        })
                        next(null, jsonPointer.get(obj, serviceConfig.result))
                    })
                })
            }
        })
    })

    function lowerCase() {
        var args = Array.prototype.slice.call(arguments)
        return function(str) {
            var x = args.indexOf(str.toLowerCase()) >= 0 ? str.toLowerCase() : str
            return x
        }
    }

    return api
}