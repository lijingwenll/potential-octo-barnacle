const http = require("http");

http.createServer((request,response) => {
  let body = [];
  request.on("error",(err) => void console.log(err));
  request.on("data",(chunk) => {
    body.push(chunk);
  });
  request.on("end", () => {
    body = Buffer.concat(body).toString();
    response.writeHead(200,{'Content-Type': 'text/html'});
    response.write(' Hello World\n');
    response.end();
  })
}).listen(9999);

console.log('server started,port 9999');

