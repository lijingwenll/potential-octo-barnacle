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
    response.write(`
      <html>
        <head>
          <style>
            .box{
              width: 500px;
              height: 200px;
              display: flex;
              justify-content: space-between;
              background-color: rgb(255,0,0);
            }
            #id{
              width: 200px;
              height: 100px;
              background-color: rgb(0,255,0);
            }
            .box-item{
              flex: 1;
              background-color: rgb(0,0,255);
            }
          </style>
        </head>
        <body>
          <div class="box">
            <div id="id"></div>
            <div class="box-item"></div>
          </div>
        </body>
      </html>
    `);
    response.end();
  })
}).listen(9999);

console.log('server started,port 9999');

