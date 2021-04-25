class ResponseParser{
  constructor(){
    /**
     * 0 waiting status line
     * 1 waiting status line end
     * 2 waiting header name
     * 3 waiting header space
     * 4 waiting header value
     * 5 waiting header line end
     * 6 waiting header block end
     * 7 waiting body
     */
    this.current = 0;
    this.statusLine = "";
    this.headers = {};
    this.headerName = "";
    this.headerValue = "";
    this.bodyParser = null;
  }
  get isFinished() {
    return this.bodyParser && this.bodyParser.isFinished;
  }
  get response() {
    this.statusLine.match(/HTTP\/1.1 ([0-9]+) ([\s\S]+)/);
    return {
      statusCode: RegExp.$1,
      statusText: RegExp.$2,
      headers: this.headers,
      body: this.bodyParser.content.join("")
    }
  }
  receive(string){
    for(let i = 0,len = string.length; i < len; i ++){
      this.receiveChar(string.charAt(i));
    }
  }
  receiveChar(char){
    if(this.current === 0){
      if(char === "\r"){
        this.current = 1;
      }else {
        this.statusLine += char;
      }
    }else if(this.current === 1 || this.current === 5){
      if(char === "\n"){
        this.current = 2;
      }
    }else if(this.current === 2){
      if(char === ":"){
        this.current = 3;
      }else if(char === "\r"){
        this.current = 6;
        if(this.headers["Transfer-Encoding"] === "chunked") this.bodyParser = new TrunkedBodyParser();
      }else{
        this.headerName += char;
      }
    }else if(this.current === 3){
      if(char === " "){
        this.current = 4;
      }
    }else if(this.current === 4){
      if(char === "\r"){
        this.current = 5;
        this.headers[this.headerName] = this.headerValue;
        this.headerName = "";
        this.headerValue = "";
      }else{
        this.headerValue += char;
      }
    }else if(this.current === 6){
      if(char === "\n"){
        this.current = 7;
      }
    }else if(this.current === 7){
      this.bodyParser.receiveChar(char);
    }
  }
}

class TrunkedBodyParser {
  constructor() {
    /**
     * 0 waiting length
     * 1 waiting length line end
     * 2 reading trunk
     * 3 waiting new line 
     * 4 waiting new line end
     */
    this.current = 0;
    this.length = 0;
    this.content = [];
    this.isFinished = false;
  }
  receiveChar(char) {
    if(this.current === 0){
      if(char === "\r"){
        if(this.length === 0) this.isFinished = true;
        this.current = 1;
      }else{
        this.length *= 16;
        this.length += parseInt(char,16);
      }
    }else if(this.current === 1){
      if(char === "\n"){
        this.current = 2;
      }
    }else if(this.current === 2){
      this.content.push(char);
      this.length --;
      if(this.length === 0) this.current = 3;
    }else if(this.current === 3){
      if(char === "\r") this.current = 4;
    }else if(this.current === 4){
      if(char === "\n") this.current = 0;
    }
  }
}

module.exports = ResponseParser;