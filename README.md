# node-madgex
Friendly node.js client for the Madgex online service

### usage

```javascript
    var madgex = require('node-madgex');
    var client = madgex.createClient("yoursitename",  
            { key: "yourkey", secret: "yoursecret" }).restApi;

    client.jobinfo({ jobid: 1257 }, function (err, data) {
        console.log(data);
    });

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
