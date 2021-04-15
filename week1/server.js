const http = require("http");

http.createServer((request,response) => {
  let body = [];
  request
  .on('error',err => void console.error(err))
  .on('data',chunk => void (body.push(chunk.toString())))
  .on('end',() => {
    body = Buffer.concat(body).toString();
    response.writeHead(200,{'Content-Type': 'text/html'});
    response.end('Hello World');
  })
}).listen(9999);

console.log('server started,port 9999');

