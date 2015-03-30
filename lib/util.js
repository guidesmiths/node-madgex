
var defaultEnvironment = 'development',
    serviceUrlSuffix = {
        'development': '-webservice.madgexjbtest.com',
        'production': '-webservice.madgexjb.com',
        getCurrent: function () {
            return serviceUrlSuffix[process.env.NODE_ENV || defaultEnvironment ]
        }
}



module.exports = {
    serviceUrlSuffix : serviceUrlSuffix
}