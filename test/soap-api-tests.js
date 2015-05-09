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

    describe('Billing API', function() {

        it('should report errors', function(done) {

            var scope = nock('http://timeshighereducation-webservice.madgexjbtest.com')
                .post('/billing.asmx')
                .replyWithError('Test Error');

            client.billingApi.getCategories(function(err, results) {
                assert.ok(err)
                assert.equal(err.message, 'POST http://timeshighereducation-webservice.madgexjbtest.com/billing.asmx failed. Original error was: Test Error')
                done()
            })
        })

        it('should report failures', function(done) {

            var scope = nock('http://timeshighereducation-webservice.madgexjbtest.com')
                .post('/billing.asmx')
                .reply(400);

            client.billingApi.getCategories(function(err, results) {
                assert.ok(err)
                assert.equal(err.message, 'POST http://timeshighereducation-webservice.madgexjbtest.com/billing.asmx failed. Status code was: 400')
                done()
            })
        })

        describe('GetCategories', function() {
            it('should get a list of categories', function(done) {

                var scope = nock('http://timeshighereducation-webservice.madgexjbtest.com')
                    .post('/billing.asmx')
                    .replyWithFile(200, __dirname + '/replies/GetCategories.many.xml');

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
                    .replyWithFile(200, __dirname + '/replies/GetCategories.single.xml');

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

            it('should survive bad responses', function(done) {

                var scope = nock('http://timeshighereducation-webservice.madgexjbtest.com')
                    .post('/billing.asmx')
                    .reply(200, 'not xml mwahahaha');

                client.billingApi.getCategories(function(err, results) {
                    assert.ok(err)
                    assert.equal(err.message, 'Non-whitespace before first tag.\nLine: 0\nColumn: 1\nChar: n')
                    done()
                })
            })
        })

        describe('GetCategoryTerms', function() {

            it('should get a list of category terms', function(done) {

                var scope = nock('http://timeshighereducation-webservice.madgexjbtest.com')
                    .post('/billing.asmx')
                    .replyWithFile(200, __dirname + '/replies/GetCategoryTerms.many.xml');

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
                    .replyWithFile(200, __dirname + '/replies/GetCategoryTerms.single.xml')

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
                        return fs.createReadStream(__dirname + '/replies/GetLocations.many.xml')
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
                    .replyWithFile(200, __dirname + '/replies/GetLocations.single.xml');

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

            it('should add a billed job', function(done) {

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
                        return fs.createReadStream(__dirname + '/replies/AddBilledJob.ok.xml')
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
                }, function(err, result) {
                    assert.ifError(err)
                    assert.equal(result, 1340)
                    done()
                })
            })

            it('should omit optional elements when not specified', function(done) {

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
                        return fs.createReadStream(__dirname + '/replies/AddBilledJob.ok.xml')
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

            it('should use xsi:nil for certain elements with minOcccurs=1 mandatory=false when not specified', function(done) {

                var scope = nock('http://timeshighereducation-webservice.madgexjbtest.com')
                    .post('/billing.asmx')
                    .reply(function(uri, requestBody) {
                        var $ = cheerio.load(requestBody, { xmlMode: true })
                        assert.equal($('job\\:liProductID').length, 1)
                        assert.equal($('job\\:liProductID').attr('xsi:nil'), 'true')
                        assert.equal($('job\\:liPriceSoldAt').length, 1)
                        assert.equal($('job\\:liPriceSoldAt').attr('xsi:nil'), 'true')
                        assert.equal($('job\\:isBackFill').length, 1)
                        assert.equal($('job\\:isBackFill').attr('xsi:nil'), 'true')
                        return fs.createReadStream(__dirname + '/replies/AddBilledJob.ok.xml')
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

            it('should update a billed job', function(done) {
                var scope = nock('http://timeshighereducation-webservice.madgexjbtest.com')
                    .post('/billing.asmx')
                    .reply(function(uri, requestBody) {
                        var $ = cheerio.load(requestBody, { xmlMode: true })
                        assert.equal($('job\\:sRecruiterBillingID').text(), 'rec-1')
                        assert.equal($('job\\:sEmployerBillingID').text(), 'emp-1')
                        assert.equal($('job\\:sJobID').text(), 'job-1')
                        return fs.createReadStream(__dirname + '/replies/UpdateBilledJob.ok.xml')
                    })

                client.billingApi.updateBilledJob({
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
                   productId: 'product-id',
                   priceSoldAt: 100,
                   isBackFill: true
                }, function(err, result) {
                    assert.ifError(err)
                    assert.equal(result, 1340)
                    done()
                })
            })
        })


        describe('AddRecruiterV2', function() {

            it('should add recruiter', function(done) {

                var scope = nock('http://timeshighereducation-webservice.madgexjbtest.com')
                    .post('/billing.asmx')
                    .reply(function(uri, requestBody) {
                        var $ = cheerio.load(requestBody, { xmlMode: true })
                        assert.equal($('job\\:RecruiterName').text(), 'recruiter-name')
                        assert.equal($('job\\:CustomerBillingID').text(), 'cust-billing-id')
                        assert.equal($('job\\:ContactFirstName').text(), 'contact-fn')
                        assert.equal($('job\\:ContactLastName').text(), 'contact-ln-1')
                        assert.equal($('job\\:ContactLastName2').text(), 'contact-ln-2')
                        assert.equal($('job\\:Address1').text(), 'address-1')
                        assert.equal($('job\\:Address2').text(), 'address-2')
                        assert.equal($('job\\:Address3').text(), 'address-3')
                        assert.equal($('job\\:TownCity').text(), 'town')
                        assert.equal($('job\\:CountyState').text(), 'county')
                        assert.equal($('job\\:ZipPostCode').text(), 'zip')
                        assert.equal($('job\\:Country').text(), 'country')
                        assert.equal($('job\\:Telephone').text(), 'phone')
                        assert.equal($('job\\:ContactEmail').text(), 'contact@example.com')
                        assert.equal($('job\\:RecruiterTypeID').text(), 1)
                        assert.equal($('job\\:Image job\\:AssetID').text(), 'image-asset-id')
                        assert.equal($('job\\:Image job\\:Base64BlobString').text(), 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP4z8BQDwAEgAF/posBPQAAAABJRU5ErkJggg==')
                        assert.equal($('job\\:EnhancedJobHtml job\\:JobTitleTextCss').text(), '#000')
                        assert.equal($('job\\:EnhancedJobHtml job\\:JobHeadingsTextCss').text(), '#111')
                        assert.equal($('job\\:EnhancedJobHtml job\\:ButtonBackgroundCss').text(), '#222')
                        assert.equal($('job\\:EnhancedJobHtml job\\:ButtonTextCss').text(), '#333')
                        assert.equal($('job\\:EnhancedJobHtml job\\:HyperLinkCss').text(), '#444')
                        assert.equal($('job\\:EnhancedJobHtml job\\:Banner job\\:AssetID').text(), 'banner-asset-id')
                        assert.equal($('job\\:EnhancedJobHtml job\\:Banner job\\:Base64BlobString').text(), 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP4z8BQDwAEgAF/posBPQAAAABJRU5ErkJggg==')
                        assert.equal($('job\\:AccountManager job\\:EmailAddress').text(), 'manager@example.com')
                        assert.equal($('job\\:AccountManager job\\:FirstName').text(), 'manager-fn')
                        assert.equal($('job\\:AccountManager job\\:LastName').text(), 'manager-ln')
                        assert.equal($('job\\:CanAccessCvDatabase').text(), 'true')

                        return fs.createReadStream(__dirname + '/replies/AddRecruiterV2.ok.xml')
                    })

                client.billingApi.addRecruiterV2({
                    recruiterName: 'recruiter-name',
                    customerBillingID: 'cust-billing-id',
                    contactFirstName: 'contact-fn',
                    contactLastName: 'contact-ln-1',
                    contactLastName2: 'contact-ln-2',
                    address1: 'address-1',
                    address2: 'address-2',
                    address3: 'address-3',
                    townCity: 'town',
                    countyState: 'county',
                    zipPostCode: 'zip',
                    country: 'country',
                    telephone: 'phone',
                    contactEmail: 'contact@example.com',
                    recruiterTypeID: 1,
                    image: {
                        assetId: 'image-asset-id',
                        base64BlobString: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP4z8BQDwAEgAF/posBPQAAAABJRU5ErkJggg=='
                    },
                    enhancedJobHtml: {
                        jobTitleTextCss: '#000',
                        jobHeadingsTextCss: '#111',
                        buttonBackgroundCss: '#222',
                        buttonTextCss: '#333',
                        hyperLinkCss: '#444',
                        banner: {
                            assetId: 'banner-asset-id',
                            base64BlobString: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP4z8BQDwAEgAF/posBPQAAAABJRU5ErkJggg=='
                        }
                    },
                    accountManager: {
                        emailAddress: 'manager@example.com',
                        firstName: 'manager-fn',
                        lastName: 'manager-ln',
                    },
                    canAccessCvDatabase: true
                }, function(err, result) {
                    assert.ifError(err)
                    assert.equal(result, 1339)
                    done()
                })
            })
        })
    })
})


