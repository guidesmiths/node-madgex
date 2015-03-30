# node-madgex
Friendly node.js client for the Madgex online service

### usage

```javascript
    var madgex = require('node-madgex');
    var client = madgex.createClient("yoursitename", 
        { key: "yourkey", secret: "yoursecret" });

    client.restApi.jobinfo({ jobid: 1257 }, function (err, data) {
        console.log(data);
    });

```