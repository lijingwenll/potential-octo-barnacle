const Request = require("./request");
const parser = require("./parser.js");
const images = require("images");
const render = require("./render");

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
  let viewport = images(800, 600);
  render(viewport, dom.children[1].children[3]);

  viewport.save("./week3/viewport.jpg");
}();