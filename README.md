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

