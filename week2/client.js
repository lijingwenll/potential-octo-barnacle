const Request = require("./request");
const parser = require("./parser.js");

void async function() {
  const request = new Request({
    method: "POST",
    host: "127.0.0.1",
    port: "9999",
    path: "/",
    headers: {
      ["X-Foo2"]: "customed"
    },
    body: {
      name: "amy"
    }
  });
  const response = await request.send();
  let dom = parser.parseHTML(response.body);
  console.log(JSON.stringify(dom, null, ""));
}();