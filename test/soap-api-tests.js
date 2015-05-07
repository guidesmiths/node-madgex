'use strict'

var madgex = require('../index.js')
var assert = require('assert')
var config = require('./service-config.json')
var fs = require('fs')
var path = require('path')
var nock = require('nock')

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

        it('should get a list of categories', function(done) {

            var scope = nock('http://timeshighereducation-webservice.madgexjbtest.com')
                .post('/billing.asmx')
                .replyWithFile(200, __dirname + '/nock/GetCategoriesMany.xml');

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
                .replyWithFile(200, __dirname + '/nock/GetCategoriesSingle.xml');

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

        it('should get a list of category terms', function(done) {

            var scope = nock('http://timeshighereducation-webservice.madgexjbtest.com')
                .post('/billing.asmx')
                .replyWithFile(200, __dirname + '/nock/GetCategoryTermsMany.xml');

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
                .replyWithFile(200, __dirname + '/nock/GetCategoryTermsSingle.xml');

            client.billingApi.getCategoryTerms({categoryId: 100}, function(err, results) {
                assert.ifError(err)
                assert.equal(results.length, 1)
                assert.equal(results[0].id, 21)
                assert.equal(results[0].name, 'Sport and Leisure')
                done()
            })
        })

    })
})


