
//  load system modules
//var url  = require('url');
//var path = require('path');
var http = require('http');

//  instantiate server
server = http.createServer();

//  make request listener
server.on ( 'request',function(server_request,server_response){
  server_response.writeHead ( 200,{'Content-Type':'text/html'} );
  //server_response.write ( server_request.url );
  server_response.write ( 'Hello World!' );
  server_response.end();
});

server.on ( 'error',function(e){
  console.error ( e.stack || e );
});

server.listen({
  host      : 'localhost',
  port      : 8090,
  exclusive : true
},function(){
  console.log ( 'forwarder started' );
});
