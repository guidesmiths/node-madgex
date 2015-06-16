"use strict";

var oauth = require('oauth'),
    debug = require('debug')('node-madgex'),
    extend = require('extend'),
    qs = require('querystring'),
    Boom = require('boom'),
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
            var getResult = function (handleResponse) {
                request.get(urlFactory(path, params), null, null, function (error, data) {
                    if (error) return handleResponse(error);
                    try {
                        data = JSON.parse(data);
                    }
                    catch (err) {
                        return handleResponse(err);
                    }
                    if (data.status !== "ok") {
                        var message = JSON.stringify(data.result);
                        var statusCode = 500;
                        if (Array.isArray(data.result.errors)) {
                            var firstError = data.result.errors[0];
                            if (firstError.message) {
                                message = firstError.message;
                                if (message === 'The requested employer does not exist') {
                                  statusCode = 404;
                                }
                            }
                        }
                        return handleResponse(Boom.create(statusCode, message));
                    }
                    handleResponse(null, data.result);
                });
            };

            if (done && typeof done === 'function') {
                return getResult(done);
            }

            return when.promise(function (resolve, reject) {
                return getResult(function (err, data) {
                    return (err) ? reject(err) : resolve(data);
                });
            });

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
