'use strict'

var madgex = require('../index.js')
var assert = require('assert')
var config = require('./service-config.json')
var fs = require('fs')
var path = require('path')
var nock = require('nock')
var cheerio = require ('cheerio')

before(function(done) {

    fs.exists(path.join(__dirname, 'service-config.json'), function(exists) {
        if (exists) return done()
        return done(new Error('service-config.json does not exist'))
    })
})

describe('Madgex SOAP API', function() {
    this.timeout(5000)

    var client = madgex.createClient(config.baseUrl, config.credentials).soapApi

    describe('SOAP API facade', function() {

        it('should have a billing API part', function () {
            assert.ok(client.billingApi, 'billing api branch not found')
        })

        describe('GetCategories', function() {
            it('should get a list of categories', function(done) {

                var scope = nock('http://timeshighereducation-webservice.madgexjbtest.com')
                    .post('/billing.asmx')
                    .replyWithFile(200, __dirname + '/replies/GetCategoriesMany.xml');

                client.billingApi.getCategories(function(err, results) {
                    assert.ifError(err)
                    assert.equal(results.length, 6)
                    assert.equal(results[0].mandatory, false)
                    assert.equal(results[0].multiSelect, true)
                    assert.equal(results[0].id, 100)
                    assert.equal(results[0].name, 'Academic Discipline')
                    done()
                })
            })

            it('should render single categores as a list', function(done) {

                var scope = nock('http://timeshighereducation-webservice.madgexjbtest.com')
                    .post('/billing.asmx')
                    .replyWithFile(200, __dirname + '/replies/GetCategoriesSingle.xml');

                client.billingApi.getCategories(function(err, results) {
                    assert.ifError(err)
                    assert.equal(results.length, 1)
                    assert.equal(results[0].mandatory, false)
                    assert.equal(results[0].multiSelect, true)
                    assert.equal(results[0].id, 105)
                    assert.equal(results[0].name, 'Hours')
                    done()
                })
            })
        })

        describe('GetCategoryTerms', function() {

            it('should get a list of category terms', function(done) {

                var scope = nock('http://timeshighereducation-webservice.madgexjbtest.com')
                    .post('/billing.asmx')
                    .replyWithFile(200, __dirname + '/replies/GetCategoryTermsMany.xml');

                client.billingApi.getCategoryTerms({categoryId: 100}, function(err, results) {
                    assert.ifError(err)
                    assert.equal(results.length, 21)
                    assert.equal(results[0].id, 1)
                    assert.equal(results[0].name, 'Agriculture, Food and Veterinary')
                    done()
                })
            })


            it('should render single category terms as a list', function(done) {

                var scope = nock('http://timeshighereducation-webservice.madgexjbtest.com')
                    .post('/billing.asmx')
                    .replyWithFile(200, __dirname + '/replies/GetCategoryTermsSingle.xml')

                client.billingApi.getCategoryTerms({categoryId: 100}, function(err, results) {
                    assert.ifError(err)
                    assert.equal(results.length, 1)
                    assert.equal(results[0].id, 21)
                    assert.equal(results[0].name, 'Sport and Leisure')
                    done()
                })
            })
        })

        describe('GetLocations', function() {

            it('should get a list of locations', function(done) {

                var scope = nock('http://timeshighereducation-webservice.madgexjbtest.com')
                    .post('/billing.asmx')
                    .reply(function(uri, requestBody) {
                        var $ = cheerio.load(requestBody, { xmlMode: true })
                        assert.equal($('job\\:searchPrefix').text(), 'Lon')
                        return fs.createReadStream(__dirname + '/replies/GetLocationsMany.xml')
                    });

                client.billingApi.getLocations({prefix: 'Lon'}, function(err, results) {
                    assert.ifError(err)
                    assert.equal(results.length, 20)
                    assert.equal(results[0].locationId, 325)
                    assert.equal(results[0].label, 'London (Greater)')
                    done()
                })
            })

            it('should render single location as a list', function(done) {

                var scope = nock('http://timeshighereducation-webservice.madgexjbtest.com')
                    .post('/billing.asmx')
                    .replyWithFile(200, __dirname + '/replies/GetLocationsSingle.xml');

                client.billingApi.getLocations({prefix: 'Longney'}, function(err, results) {
                    assert.ifError(err)
                    assert.equal(results.length, 1)
                    assert.equal(results[0].locationId, 17116)
                    assert.equal(results[0].label, 'Longney, Gloucester')
                    done()
                })
            })
        })

        describe('AddBilledJob', function() {

            // Madgex Billing Test Site is currently broken
            xit('should add a billed job', function(done) {

                var scope = nock('http://timeshighereducation-webservice.madgexjbtest.com')
                    .post('/billing.asmx')
                    .reply(function(uri, requestBody) {
                        var $ = cheerio.load(requestBody, { xmlMode: true })
                        assert.equal($('job\\:sRecruiterBillingID').text(), 'rec-1')
                        assert.equal($('job\\:sEmployerBillingID').text(), 'emp-1')
                        assert.equal($('job\\:sJobID').text(), 'job-1')
                        assert.equal($('job\\:sStartDateTime').text(), '13/01/2015 10:35')
                        assert.equal($('job\\:sEndDateTime').text(), '14/01/2025 14:55')
                        assert.equal($('job\\:sApplicationMethod').text(), 'ExternalRedirect')
                        assert.equal($('job\\:sApplicationEmail').text(), 'foo@example.com')
                        assert.equal($('job\\:sExternalApplicationURL').text(), 'http://www.example.com/jobzRus')
                        assert.equal($('job\\:jobProperties job\\:WSJobPropertyValue').length, 2)
                        assert.equal($('job\\:jobProperties job\\:WSJobPropertyValue:nth-child(1) job\\:Name').text(), 'JobTitle')
                        assert.equal($('job\\:jobProperties job\\:WSJobPropertyValue:nth-child(1) job\\:Value').text(), 'job-title')
                        assert.equal($('job\\:jobProperties job\\:WSJobPropertyValue:nth-child(2) job\\:Name').text(), 'JobDescription')
                        assert.equal($('job\\:jobProperties job\\:WSJobPropertyValue:nth-child(2) job\\:Value').text(), 'job-description')

                        assert.equal($('job\\:jobCategorization job\\:WSSelectedTerms').length, 2)
                        assert.equal($('job\\:jobCategorization job\\:WSSelectedTerms:nth-child(1) job\\:CategoryID').text(), '100')
                        assert.equal($('job\\:jobCategorization job\\:WSSelectedTerms:nth-child(1) job\\:TermIDs job\\:int').length, 3)
                        assert.equal($('job\\:jobCategorization job\\:WSSelectedTerms:nth-child(1) job\\:TermIDs job\\:int:nth-child(1)').text(), '1')
                        assert.equal($('job\\:jobCategorization job\\:WSSelectedTerms:nth-child(1) job\\:TermIDs job\\:int:nth-child(3)').text(), '3')

                        assert.equal($('job\\:jobCategorization job\\:WSSelectedTerms:nth-child(2) job\\:CategoryID').text(), '101')
                        assert.equal($('job\\:jobCategorization job\\:WSSelectedTerms:nth-child(2) job\\:TermIDs job\\:int').length, 3)
                        assert.equal($('job\\:jobCategorization job\\:WSSelectedTerms:nth-child(2) job\\:TermIDs job\\:int:nth-child(1)').text(), '4')
                        assert.equal($('job\\:jobCategorization job\\:WSSelectedTerms:nth-child(2) job\\:TermIDs job\\:int:nth-child(3)').text(), '6')

                        assert.equal($('job\\:jobUpsells job\\:WSUpsell').length, 2)
                        assert.equal($('job\\:jobUpsells job\\:WSUpsell:nth-child(1) job\\:ID').text(), '1')
                        assert.equal($('job\\:jobUpsells job\\:WSUpsell:nth-child(1) job\\:Name').text(), 'Top Jobs')

                        assert.equal($('job\\:liProductID').text(), 'product-id')
                        assert.equal($('job\\:liPriceSoldAt').text(), '100')
                        assert.equal($('job\\:isBackFill').text(), 'true')
                        return fs.createReadStream(__dirname + '/replies/AddBilledJobOK.xml')
                    })

                client.billingApi.addBilledJob({
                   id: 'job-1',
                   recruiterBillingId: 'rec-1',
                   employerBillingId: 'emp-1',
                   startDateTime: '13/01/2015 10:35',
                   endDateTime: '14/01/2025 14:55',
                   applicationMethod: 'ExternalRedirect',
                   applicationEmail: 'foo@example.com',
                   externalApplicationUrl: 'http://www.example.com/jobzRus',
                   properties: {
                      JobTitle: 'job-title',
                      JobDescription: 'job-description'
                   },
                   categorization: {
                      terms: [
                         {
                            categoryId: 100,
                            termIds: [1, 2, 3]
                         },
                         {
                            categoryId: 101,
                            termIds: [4, 5, 6]
                         }
                      ]
                   },
                   upsells: [
                      {
                         id: '1',
                         name: 'Top Jobs'
                      },
                      {
                         id: '2'
                      }
                   ],
                   productId: 'product-id',
                   priceSoldAt: 100,
                   isBackFill: true
                }, function(err, results) {
                    assert.ifError(err)
                    done()
                })
            })

            // Madgex Billing Test Site is currently broken
            xit('should omit optional elements when not specified', function(done) {

                var scope = nock('http://timeshighereducation-webservice.madgexjbtest.com')
                    .post('/billing.asmx')
                    .reply(function(uri, requestBody) {
                        var $ = cheerio.load(requestBody, { xmlMode: true })
                        assert.equal($('job\\:sStartDateTime').length, 0)
                        assert.equal($('job\\:sEndDateTime').length, 0)
                        assert.equal($('job\\:sApplicationMethod').length, 0)
                        assert.equal($('job\\:sApplicationEmail').length, 0)
                        assert.equal($('job\\:sExternalApplicationURL').length, 0)
                        assert.equal($('job\\:jobProperties').length, 1)
                        assert.equal($('job\\:jobProperties job\\:WSJobPropertyValue').length, 0)
                        assert.equal($('job\\:jobCategorization').length, 1)
                        assert.equal($('job\\:jobCategorization job\\:WSSelectedTerms').length, 0)
                        assert.equal($('job\\:jobUpsells').length, 0)
                        return fs.createReadStream(__dirname + '/replies/AddBilledJobOK.xml')
                    })

                client.billingApi.addBilledJob({
                   id: 'job-1',
                   recruiterBillingId: 'rec-1',
                   employerBillingId: 'emp-1'
                }, function(err, results) {
                    assert.ifError(err)
                    done()
                })
            })

            // Madgex Billing Test Site is currently broken
            xit('should use xsi:nil for certain elements with minOcccurs=1 mandatory=false when not specified', function(done) {

                var scope = nock('http://timeshighereducation-webservice.madgexjbtest.com')
                    .post('/billing.asmx')
                    .reply(function(uri, requestBody) {
                        var $ = cheerio.load(requestBody, { xmlMode: true })
                        assert.equal($('job\\:liProductID').length, 1)
                        console.log(requestBody)
                        assert.equal($('job\\:liProductID').attr('xsi:nil'), 'true')
                        assert.equal($('job\\:liPriceSoldAt').length, 1)
                        assert.equal($('job\\:liPriceSoldAt').attr('xsi:nil'), 'true')
                        assert.equal($('job\\:isBackFill').length, 1)
                        assert.equal($('job\\:isBackFill').attr('xsi:nil'), 'true')
                        return fs.createReadStream(__dirname + '/replies/AddBilledJobOK.xml')
                    })

                client.billingApi.addBilledJob({
                   id: 'job-1',
                   recruiterBillingId: 'rec-1',
                   employerBillingId: 'emp-1'
                }, function(err, results) {
                    assert.ifError(err)
                    done()
                })
            })
        })

        describe('UpdateBilledJob', function() {

            // Madgex Billing Test Site is currently broken
            xit('should update a billed job', function(done) {

                var scope = nock('http://timeshighereducation-webservice.madgexjbtest.com')
                    .post('/billing.asmx')
                    .reply(function(uri, requestBody) {
                        var $ = cheerio.load(requestBody, { xmlMode: true })
                        assert.equal($('job\\:sRecruiterBillingID').text(), 'rec-1')
                        assert.equal($('job\\:sEmployerBillingID').text(), 'emp-1')
                        assert.equal($('job\\:sJobID').text(), 'job-1')
                        return fs.createReadStream(__dirname + '/replies/UpdateBilledJobOK.xml')
                    })

                client.billingApi.updateBilledJob({
                   id: 'job-1',
                   recruiterBillingId: 'rec-1',
                   employerBillingId: 'emp-1'
                }, function(err, results) {
                    assert.ifError(err)
                    done()
                })
            })
        })
    })
})


