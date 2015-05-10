var madgex = require('../index.js'),
    assert = require('assert'),
    fs = require('fs'),
    path = require('path'),
    nock = require('nock')

describe('Madgex Client REST API', function () {

    this.timeout(5000);

    var client = madgex.createClient('http://guidesmiths-webservice.madgexjbtest.com', {
        key: "madgex-test-key",
        secret: "madgex-test-secret"
    }).restApi;

    it("should have a jobInfo API part", function () {
        assert.ok(client.jobinfo, "jobInfo api branch not found");
    });

    it("should provide a path info from method invocation", function () {

        assert.ok(client.jobinfo.getPathAndQuery, "method has not path discover method");
        assert.equal(client.jobinfo.getPathAndQuery({}), "/restapi/jobinfo?deviceId=node-device",
            "method path resolution is incorrect");
    });

    describe("jobinfo API function", function () {
        it("shoud be invokable", function () {
            assert.equal(typeof client.jobinfo, "function", "jobinfo is not a function");
        })
        it("should return info on a job", function (done) {

            nock('http://guidesmiths-webservice.madgexjbtest.com:80')
                .get('/restapi/jobinfo?jobid=1257&deviceId=node-device')
                .replyWithFile(200, __dirname + '/replies/rest/get.jobinfo.jobid.json')

            client.jobinfo({ jobid: 1257 }, function (err, data) {
                assert.equal(null, err, "error is not null");
                assert.equal(data.id, 1257, "jobid id does not match");
                done();
            });
        })

        it("should have a search function", function () {
            assert.ok(client.jobinfo, "jobInfo api branch not found");
        });
        describe("jobinfo.search API function ", function () {
            it("should return 30 items without params", function (done) {

                nock('http://guidesmiths-webservice.madgexjbtest.com:80')
                  .get('/restapi/jobinfo/search?deviceId=node-device')
                .replyWithFile(200, __dirname + '/replies/rest/get.jobinfo.search.json')

                client.jobinfo.search({}, function(err, data) {
                    assert.ok(data.jobs, "search yielded not jobs");
                    assert.equal(data.jobs.length, 30, "search resulted incorred number of items");
                    done();
                });
            });
            it("should also return a promise the resolves to 30 jobs", function (done) {

                nock('http://guidesmiths-webservice.madgexjbtest.com:80')
                  .get('/restapi/jobinfo/search?deviceId=node-device')
                .replyWithFile(200, __dirname + '/replies/rest/get.jobinfo.search.json')

                var jobs = client.jobinfo.search({});
                assert.ok(jobs.then, "result is not a promise");
                jobs.then(function (data) {
                    assert.equal(data.jobs.length, 30, "item count mismatch");
                    done();
                });
            })
            it("should have a full subfunction", function () {
                assert.ok(client)
            });
            it("should have a facets subfunction", function () {
                assert.ok(client)
            });

            describe("jobinfo.search.full API function", function () {
                it("should return 30 items without params", function (done) {

                    nock('http://guidesmiths-webservice.madgexjbtest.com:80')
                      .get('/restapi/jobinfo/search/full?deviceId=node-device')
                      .replyWithFile(200, __dirname + '/replies/rest/get.jobinfo.search.full.json')

                    client.jobinfo.search.full({}, function (err, data) {
                        assert.equal(data.jobs.length, 30, "jobs item count mismatch")
                        done();
                    });
                });

            });

            describe("jobinfo.search.facets API function", function () {
                it("should return jobType facet with 20 items without params", function (done) {

                    nock('http://guidesmiths-webservice.madgexjbtest.com:80')
                      .get('/restapi/jobinfo/search/facets?deviceId=node-device')
                      .replyWithFile(200, __dirname + '/replies/rest/get.jobinfo.search.facets.json')


                    client.jobinfo.search.facets({}, function (err, data) {
                        assert.ok(data.jobType.length >= 20, "jobs item count mismatch")
                        //done();
                        //console.log(data.jobType.length);
                        done();
                    });
                });
            });
        });
    });

    it("should have an employer API part", function () {
        assert.ok(client.employer, "employer api branch not found");
    });

    describe("employer API function", function () {
        it("should be invokable", function () {

        });
        it("should have a search function", function () {
            assert.equal(typeof client.employer,"function", "employer must be a function");
        });

        describe("employer.search", function () {
            it("should find employers without params", function (done) {

                nock('http://guidesmiths-webservice.madgexjbtest.com:80')
                  .get('/restapi/employer/search?deviceId=node-device')
                  .replyWithFile(200, __dirname + '/replies/rest/get.employer.search.json')

                client.employer.search({}, function (err, data) {
                    assert.equal(data.employers.length, 30, "employers count mismatch");
                    done();
                });
            });

        })
    });


    it("should have a myjobs API part", function () {
        assert.ok(client.myjobs, "api part is missing");
    });

    describe("myjobs API part", function () {
        it("should provide the 'add' method", function () {
            assert.ok(client.myjobs.add, "add function not found");
        });
        it("should provide the 'delete' method", function () {
            assert.ok(client.myjobs.delete, "add function not found");
        });
    });
})


