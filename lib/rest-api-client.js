var oauth = require('oauth'),
    utils = require('./util.js'),
    debug = require('debug')('node-madgex'),
    extend = require('extend'),
    qs = require('querystring'),
    debug = require('debug')('node-madgex'),
    getUrlFactory = function (sitename, requestOptions) {
        return function (operation, params) {
            debug("params received", params);
            params = extend({}, params, requestOptions || { deviceId: 'node-device' });
            debug("param finally is", params);
            return "http://" + sitename + utils.serviceUrlSuffix.getCurrent() + "/restapi" + operation + "?" + qs.stringify(params);
        }
    }

function getDefaulOptions() {
    //deviceId is a mandatory request parameter for the Madgex REST api
    //its value can be anything
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
        debug("buildFacade", arguments);
        var result = buildFacadeItem(sd, parentPath);
        parentPath = (parentPath + "/" + sd.uriTemplate).replace("//","/");
        sd.sub && Object.keys(sd.sub).forEach(function (key) {
            result[key] = buildFacade(sd.sub[key], parentPath);
        });
        return result;
    }
    
    function buildFacadeItem(sd, parentPath) {
        debug("buildFacadeItem", arguments);
        if (!sd.invokable) return {};

        var path = (parentPath + "/" + sd.uriTemplate).replace("//", "/");
        var result = function (params, done) {
            var url = urlFactory(path, params);
            request.get(url, null, null, function (error, data, result) {
                if (error) return done(error);
                var data = JSON.parse(data);
                if (data.status !== "ok") return data(data);
                done(null, data.result);
            });
        }
        result.path = path;
        return result;
    }

    var restApi = buildFacade(serviceDefinition, "");
    restApi.urlFactory = urlFactory;
    return restApi;
    //return {
    //    urlFactory: urlFactory,
    //    //jobinfo: {
    //    //    search: function (params, done) {
    //    //        request.get(urlFactory('jobinfo/search/', params), null, null, function (error, data, result) {
    //    //            if (error) return done(error);
    //    //            done(null, JSON.parse(data));
    //    //        });
    //    //    }
    //    //}
    //}
}