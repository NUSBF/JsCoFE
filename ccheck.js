var fs = require('fs'); 
var https = require('https'); 
//var ca = 'ca-crt.pem';
var ca = 'certificates/rootCA.pem';
var options = { 
    hostname: 'ccp4cloud.rc-harwell.ac.uk', 
    port: 443, 
    path: '/whoareyou', 
    method: 'GET',
    ca: fs.readFileSync(ca) 
}; 
var req = https.request(options, function(res) { 
    res.on('data', function(data) { 
        process.stdout.write(data + '\n'); 
    }); 
}); 
req.end();

