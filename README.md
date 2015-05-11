# node-madgex
A node.js client for [Madgex](http://madgex.com) web services.

## About
Madgex's web services are split between RESTful and SOAP APIs. This module currently supports only a subset of the APIs, but we would be delighted to receive pull requests for the methods that are missing.

The current set of supported web services is

### REST API

1. getinfo
1. employer
1. myjobs

### Billing API

1. AddBilledJob
1. AddRecruiterV2
1. GetCategories
1. GetCategoryTerms
1. GetLocations
1. UpdateBilledJob
1. UpdateRecruiterWithBillingID


## The REST API

### Usage

```javascript
var madgex = require('node-madgex')
var client = madgex.createClient('http://yoursite-webservice.madgexjbtest.com',  { key: 'yourkey', secret: 'yoursecret' })

client.restApi.jobinfo({ jobid: 1257 }, function(err, data) {
    console.log(data);
})
```

API methods usually accept a params hash and a completion callback with (err, data, result) signature;

### Promises
As an alternative to the completion callback you can use promises as well. Api methods return with a promise
that resolves after the completion callback (if one is present).

```javascript
client.jobinfo({ jobid: 1257 })
      .then(function(data) {
          //handle data
      })
      .fail(function(err) {
          //dome something with the error
      });
```

#### Chain'em

Promised values are easy to compose:
```javascript
client.jobinfo
      .search({})
      .then(function(jobs) { return client.jobinfo({jobid: jobs[0].id }) })
      .then(function(jobdetails) { /*handle data*/ })
      .fail(function(err) { /*dome something with the error */ });
```

### Service Description
The RESTful client API is dynamically built by code from the service description config file.
Extend this to add new functions to the API. (/lib/rest-api-service-description.json)

### Service Methods

#### jobinfo(params, done)
Displays information about a job

##### params
a hash with the following fields

field | type,info
--- | ---
jobid | integer, required

#### jobinfo.search(params, done)
Searches in the job database

##### params
field | type,info
--- | ---
keywords | free text with boolean expressions allowed, optional
dateFrom | ISO format date
dateTo | ISO format date

...and much more. refer to the Madgex REST documentation for full set of params.


#### jobinfo.search.full(params, done)
Same as search but returns full dataset

#### jobinfo.search.facets(params, done)
Return search refiners for a search result. Params are same as in search()

#### employer(params, done)
Displays information about am employer

##### params
a hash with the following fields

field | type,info
--- | ---
id | integer, required

#### employer.search(params, done)
Searches in the employer database

#### myjobs.add(params, done)

#### myjobs.delete(params, done)

## The SOAP API

### Usage
```javascript
var madgex = require('node-madgex')
var client = madgex.createClient('http://yoursite-webservice.madgexjbtest.com',  { key: 'yourkey', secret: 'yoursecret' })

client.soapApi.billingApi.getCategoryTerms({ categoryId: 105 }, function(err, data) {
    console.log(data);
})
```
Each billingApi method takes an optional parameters object and typical callback. You can determine the available parameters names by inspecting the equivalent methods handlebars template (see ./lib/soap-templates/*.hbs). Working out the parameters to pass still requires a degree of experience however.

On the plus side responses stripped of their SOAPiness and converted to camelCased json. Integers, floats and booleans are parsed, so instead of

```xml
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
    <soap:Body>
        <GetCategoriesResponse xmlns="http://jobboard.webservice.madgex.co.uk">
            <GetCategoriesResult>
                <WSCategory>
                    <Mandatory>false</Mandatory>
                    <MultiSelect>true</MultiSelect>
                    <ID>105</ID>
                    <Name>Hours</Name>
                </WSCategory>
            </GetCategoriesResult>
        </GetCategoriesResponse>
    </soap:Body>
</soap:Envelope>
```

you'll receive
```json
[
    {
        "mandatory": false,
        "multiSelect": true,
        "id": 105,
        "name": "hours"
    }
]
```

#### Error handling
In the event of an HTTP error, the err object passed to your callback will be blessed with a 'statusCode' property. In the event ofa  SOAP Fault, the err object will additionally be blessed with 'faultCode' and 'faultString' properties.

#### Adding more SOAP API methods
Adding more API methods is easy

1. Fork and clone node-madgex
2. Generate a real request and response using your tool of choice ([SoapUI](http://www.soapui.org/), curl, etc)
3. Convert the request to a handlbars template and save it in lib/soap-templates/MethodName.hbs, 
4. Save the response in test/replies/soap/MethodName.ok.xml
5. Update lib/soap-api-service-description.json
6. Add one or more test cases
7. Submit a PR

