# node-madgex
Friendly node.js client for the Madgex online service

### usage

```javascript
    var madgex = require('node-madgex');
    var client = madgex.createClient("yoursitename",  { key: "yourkey", secret: "yoursecret" }).restApi;

    client.jobinfo({ jobid: 1257 }, function (err, data) {
        console.log(data);
    });

```
API methods usually accept a params hash and a completion callback with (err, data, result) signature;

###promises
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

####chain'em

```javascript
promised values are easy to compose:

    client.jobinfo
          .search({})
          .then(function(jobs) { return client.jobinfo({jobid: jobs[0].id }) })
          .then(function(jobdetails) { /*handle data*/ })
          .fail(function(err) { /*dome something with the error */ });
```

####or not!
Callbacks can also be chained ...
```javascript
    client.jobinfo.search({}, function(err, data) {
        if (err) { /* signal error*/ return; }
        client.jobinfo({}, function(err, data) {
            if (err) { /* signal error*/ return; }
            //do something with the data
        });
    })
```



###beware
the structure of the API tree will probably change

###service description
The client API is dynamically built by code from the service description config file.
Extend this to add new functions to the API. (/lib/rest-api-service-description.json)

# API documentation

##jobinfo(params, done)
Displays information about a job 

####params
a hash with the following fields

field | type,info
--- | ---
jobid | integer, required

####done
completion callback with (err, data, result) signature

##jobinfo.search(params, done)
Searches in the job database

####params
field | type,info
--- | ---
keywords | free text with boolean expressions allowed, optional
dataFrom | ISO format date
dateTi | ISO format date

...and much more. refer to the Magic REST documentation for full set of params.


##jobinfo.search.full(params, done)
Same as search but returns full dataset

##jobinfo.search.facets(params, done)
Return search refiners for a search result. Params are same as in search()



##employer(params, done)
Displays information about am employer

####params
a hash with the following fields

field | type,info
--- | ---
id | integer, required

##employer.search(params, done)
Searches in the employer database


##myjobs.add(params, done)

##myjobs.delete(params, done)


#To runt tests
just

mocha

Make sure you have updated the service-config.json with your specific key, secret and sitename.