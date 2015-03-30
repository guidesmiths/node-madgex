var madgex = require('../index.js'),
    assert = require('assert'),
    config = require('./service-config.json')

describe('Madgex module', function () {
    var client = madgex.createClient(config.serviceName, config.credentials);
    it("should provide the REST API facede", function () {
        assert.ok(client.restApi, "restApi not found");
    });
    describe("REST API facade", function () {
        it("should have a jobInfo API part", function () {
            assert.ok(client.restApi.jobinfo, "jobInfo api branch not found");
        });
        describe("jobinfo API function", function () {
            it("shoud be invokable", function () {
                assert.equal(typeof client.restApi.jobinfo, "function", "jobinfo is not a function");
            })
            it("should return info on a job", function (done) {
                client.restApi.jobinfo({ jobid: 1257 }, function (err, data) {
                    assert.equal(null, err, "error is not null");
                    assert.equal(data.id, 1257, "jobid id does not match");
                    done();
                });
            })
            it("should have a search function", function () {
                assert.ok(client.restApi.jobinfo, "jobInfo api branch not found");
            });
            describe("search API function ", function () {
                it("should return 30 items without params", function (done) {
                    client.restApi.jobinfo.search({}, function(err, data) {
                        assert.ok(data.jobs, "search yielded not jobs");
                        assert.equal(data.jobs.length, 30, "search resulted incorred number of items");
                        done(); 
                    });
                });
            });
        });
    })
})

//describe('Madgex client', function () {
//    describe("SOAP API facade", function () {
//        var client = madgex.createClient("foobar", { key: "key", secret: "secret" });
//        it("should be present", function () {
//            assert.ok(client.restApi, "restApi not found");
//        });


//    })
//})

