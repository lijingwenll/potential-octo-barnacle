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
              width: 100px;
              height: 100px;
            }
            #wrap{
              width: 50px;
              height: 50px;
            }
            span{
              color: red;
            }
            .spec{
              background-color: green;
            }
            .multi{
              color: yellow;
            }
          </style>
        </head>
        <body>
          <div class="box">box</div>
          <selector id="wrap">wrap</selector>
          <span>span</span>
          <p class="multi spec">spec</p>
        </body>
      </html>
    `);
    response.end();
  })
}).listen(9999);

console.log('server started,port 9999');

