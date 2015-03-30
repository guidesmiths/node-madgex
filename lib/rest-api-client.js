"use strict";

var oauth = require('oauth'),
    utils = require('./util.js'),
    debug = require('debug')('node-madgex'),
    extend = require('extend'),
    qs = require('querystring'),
    debug = require('debug')('node-madgex'),
    when = require('when'),
    getUrlFactory = function (sitename, requestOptions) {
        return function (operation, params) {
            params = extend({}, params, requestOptions || { deviceId: 'node-device' });
            return "http://" + utils.getHostName(sitename) + operation + "?" + qs.stringify(params);
        }
    }

function getDefaulOptions() {
    //deviceId is a mandatory request parameter for the Madgex REST api
    //user can set this during the createClient call
    return {
        requestOptions: { deviceId: 'node-device' }
    };
}

var serviceDefinition = require('./rest-api-service-description.json');

module.exports = function (sitename, credentials, options) {
    var request = new oauth.OAuth(null, null, credentials.key, credentials.secret, '1.0', null, 'HMAC-SHA1'),
        options = options || getDefaulOptions(),
        urlFactory = getUrlFactory(sitename, options.requestOptions);
    
    function buildFacade(sd, parentPath) {
        var result = buildFacadeItem(sd, parentPath);
        sd.sub && Object.keys(sd.sub).forEach(function (key) {
            result[key] = buildFacade(sd.sub[key], parentPath + "/" + sd.uriTemplate);
        });
        return result;
    }
    
    function buildFacadeItem(sd, parentPath) {
        if (!sd.invokable) return {};

        var path = (parentPath + "/" + sd.uriTemplate).replace("//", "/");
        var result = function (params, done) {
            done = done || function () { };

            return when.promise(function (resolve, reject) {
                var wrapDone = function (err, data) {
                    done.apply(undefined, arguments);
                    if (err) return reject(err);
                    resolve(data);
                }
                request.get(urlFactory(path, params), null, null, function (error, data, result) {
                    if (error) return wrapDone(error);
                    var data = JSON.parse(data);
                    if (data.status !== "ok") return wrapDone(data);
                    wrapDone(null, data.result);
                });

            })
        }
        result.path = path;
        result.getPathAndQuery = function (params) {
            return urlFactory(result.path, params);
        }
        return result;
    }

    var restApi = buildFacade(serviceDefinition, "");
    restApi.urlFactory = urlFactory;
    return restApi;
}