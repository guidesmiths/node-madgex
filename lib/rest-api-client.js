"use strict";

var oauth = require('oauth'),
    debug = require('debug')('node-madgex'),
    extend = require('extend'),
    qs = require('querystring'),
    when = require('when'),
    getUrlFactory = function (baseUrl, requestOptions) {
        return function (operation, params, pathOnly) {
            params = extend({}, params, requestOptions || { deviceId: 'node-device' });
            var result = operation + "?" + qs.stringify(params);
            if (!pathOnly) {
                result = baseUrl + result;
            }
            debug('url: %s', result);
            return result;
        };
    };

function getDefaulOptions() {
    //deviceId is a mandatory request parameter for the Madgex REST api user can set this during the createClient call
    return {
        requestOptions: { deviceId: 'node-device' }
    };
}

var serviceDefinition = require('./rest-api-service-description.json');

module.exports = function (baseUrl, credentials, options) {

    var request = new oauth.OAuth(null, null, credentials.key, credentials.secret, '1.0', null, 'HMAC-SHA1'),
        options = options || getDefaulOptions(),
        urlFactory = getUrlFactory(baseUrl, options.requestOptions);

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

            var wrapDone = function () {
                var args = Array.prototype.slice.call(arguments);
                done.apply(undefined, args);
            };

            return when.promise(function (resolve, reject) {
                request.get(urlFactory(path, params), null, null, function (error, data) {
                    if (error) return reject(error);
                    try {
                        data = JSON.parse(data);
                    }
                    catch (err) {
                        return reject(err);
                    }
                    if (data.status !== "ok") return reject(new Error(data.result.errors[0].message));
                    resolve(data.result);
                });
            })
            .then(function(data) { wrapDone(null, data); })
            .catch(wrapDone);
        };
        result.path = path;
        result.getPathAndQuery = function (params) {
            return urlFactory(result.path, params, true);
        };
        return result;
    }

    var restApi = buildFacade(serviceDefinition, "");
    restApi.urlFactory = urlFactory;
    return restApi;
};
