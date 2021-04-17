const http = require("http");

http.createServer((request,response) => {
  response.writeHead(200,{'Content-Type': 'text/html'});
  response.write(' Hello World\n');
  response.end();
}).listen(9999);

console.log('server started,port 9999');

