const css = require("css");
const layout = require("./layout.js");
const EOF = Symbol("EOF");

let currentToken = null;
let currentAttribute = null;
let currentTextNode = null;
let stack = [{type: "document",children: []}]
let rules = [];

function addCSSRules(text){
  let ast = css.parse(text);
  rules.push(...ast.stylesheet.rules);
}

function specificity(selector) {
  let p = [0, 0, 0, 0];
  let selectorParts = selector.split(" ");
  for (let part of selectorParts) {
    if (part.charAt(0) === "#") {
      p[1] += 1;
    } else if (part.charAt(0) === ".") {
      p[2] += 1;
    } else {
      p[3] += 1;
    }
  }
  return p;
}

function compare(sp1, sp2) {
  if (sp1[0] - sp2[0]) return sp1[0] - sp2[0];
  if (sp1[1] - sp2[1]) return sp1[1] - sp2[1];
  if (sp1[2] - sp2[2]) return sp1[2] - sp2[2];
  return sp1[3] - sp2[3];
}

function computeCss(element){
  let elements = stack.slice().reverse();
  if(!element.computedStyle) element.computedStyle = {};
  for(let rule of rules){
    let selectorParts = rule.selectors[0].split(" ").reverse();

    if(!match(element,selectorParts[0])) continue;
  
    let matched = false;

    let j = 1;
    for(let i = 0, len = elements.length; i < len; i ++){
      if(match(elements[i],selectorParts[j])) j ++;
    }
    if( j >= selectorParts.length) matched = true;

    if(matched){
      let computedStyle = element.computedStyle;
      let sp = specificity(rule.selectors[0]);
      for (let declaration of rule.declarations) {
        if (!computedStyle[declaration.property]) {
          computedStyle[declaration.property] = {};
        }
        if (
          !computedStyle[declaration.property].specificity ||
          compare(computedStyle[declaration.property].specificity, sp) < 0
        ) {
          computedStyle[declaration.property].value = declaration.value;
          computedStyle[declaration.property].specificity = sp;
        }
      }
    }
  }
}

function match(element,selector) {
  if(!selector || !element.attributes){
    return false;
  }
  if(selector.charAt(0) === "#"){
    let attr = element.attributes.filter(item => item.name === "id")[0];
    if(attr && attr.value === selector.replace("#","")) return true;
  }else if(selector.charAt(0) === "."){
    let attr = element.attributes.filter(item => item.name === "class")[0];
    if (attr && attr.value.split(" ").includes(selector.replace(".", "")))
      return true;
  }else {
    if(element.tagName === selector) return true;
  }
  return false;
}

function emit(token){
  let top = stack[stack.length - 1];
  if(token.type === "startTag"){
    let element = {
      type: "element",
      children: [],
      attributes: []
    };

    element.tagName = token.tagName;

    for(let p in token){
      if(p !== "type" && p !== "tagName"){
        element.attributes.push({
          name: p,
          value: token[p]
        })
      }
    }

    computeCss(element);

    top.children.push(element);
    element.parent = top;

    if(!token.isSelfClosing){
      stack.push(element);
    }

    currentTextNode = null;
  }else if(token.type === "endTag"){
    if(top.tagName !== token.tagName){
      throw new Error("Tag start end doesn't match!");
    }else {
      if(top.tagName === "style"){
        addCSSRules(top.children[0].content);
      }
      layout(top);
      stack.pop();
    }
    currentTextNode = null;
  }else if(token.type === "text"){
    if(currentTextNode === null){
      currentTextNode = {
        type: "text",
        content: ""
      }
      top.children.push(currentTextNode);
    }
    currentTextNode.content += token.content;
  }
}

function data(c){
  if(c === "<"){
    return tagOpen;
  }else if(c === EOF){
    return emit({
      type: "EOF"
    });
  }else{
    emit({
      type: "text",
      content: c
    });
    return data;
  }
}

function tagOpen(c){
  if(c === "/"){
    return endTagOpen;
  }else if(c.match(/^[a-zA-Z]$/)){
    currentToken = {
      type: "startTag",
      tagName: ""
    }
    return tagName(c);
  }else {
    return;
  }
}

function endTagOpen(c){
  if(c.match(/^[a-zA-Z]$/)){
    currentToken = {
      type: "endTag",
      tagName: ""
    }
   return tagName(c);
  }else if(c === ">"){

  }else if(c === EOF){

  }else{}
}

function tagName(c){
  if(c.match(/^[\t\n\f ]$/)){
    return beforeAttributeName;
  }else if(c === "/"){
    return selfClosingStartTag;
  }else if(c.match(/^[a-zA-Z]$/)){
    currentToken.tagName += c;
    return tagName;
  }else if(c === ">"){
    emit(currentToken);
    return data;
  }else{
    return tagName;
  }
}

function beforeAttributeName(c){
  if(c.match(/^[\t\n\f ]$/)){
    return beforeAttributeName;
  }else if(c === "/" || c === ">" || c === EOF) {
    return afterAttributeName(c);
  }else if(c === "="){
    
  }else{
    currentAttribute = {
      name: "",
      value: ""
    }
    return attributeName(c);
  }
}

function attributeName(c){
  if(c.match(/^[\t\n\f]$/) || c === "/" || c === ">" || c === EOF) {
    return afterAttributeName(c);
  }else if(c === "="){
    return beforeAttributeValue;
  }else if(c === "\u0000"){

  }else if(c === "\"" || c === "'" || c === "<"){

  }else {
    currentAttribute.name += c;
    return attributeName;
  }
}

function beforeAttributeValue(c){
  if(c.match(/^[\t\n\f ]$/) || c === "/" || c === ">" || c === EOF){
    return beforeAttributeValue;
  }else if(c === "\""){
    return doubleQuotedAttributeValue;
  }else if(c === "\'"){
    return singleQuoteAttributeValue;
  }else if(c === ">"){

  }else{
    return UnquotedAttribute;
  }
}

function doubleQuotedAttributeValue(c){
  if(c === "\""){
    currentToken[currentAttribute.name] = currentAttribute.value;
    return afterQuotedAttributeValue;
  }else if(c === "\u0000"){
    currentAttribute.value += c;
  }else if(c === EOF){

  }else{
    currentAttribute.value += c;
    return doubleQuotedAttributeValue;
  }
}

function singleQuoteAttributeValue(c){
  if(c === "\'"){
    currentToken[currentAttribute.name] = currentAttribute.value;
    return afterQuotedAttributeValue;
  }else if(c === "\u0000"){

  }else if(c === EOF){

  }else{
    currentAttribute.value += c;
    return singleQuoteAttributeValue;
  }
}

function afterQuotedAttributeValue(c){
  if(c.match(/^[\t\n\f ]$/)){
    return beforeAttributeName;
  }else if(c === "/"){
    return selfClosingStartTag;
  }else if(c === ">"){
    currentToken[currentAttribute.name] = currentAttribute.value;
    emit(currentToken);
    return data;
  }else if(c === EOF){

  }else{
    currentAttribute.value += c;
    return afterQuotedAttributeValue;
  }
}

function UnquotedAttribute(c){
  if(c.match(/^[\t\n\f ]$/)){
    currentToken[currentAttribute.name] = currentAttribute.value;
    return beforeAttributeName;
  }else if(c === "/"){
    currentToken[currentAttribute.name] = currentAttribute.value;
    return selfClosingStartTag;
  }else if(c === ">"){
    currentToken[currentAttribute.name] = currentAttribute.value;
    emit(currentToken);
    return data;
  }else if(c === "\u0000"){

  }else if(c === "\"" || c === "'" || c === "<" || c === "=" || c === "`"){
    
  }else if(c === EOF){

  }else{
    currentAttribute.value += c;
    return UnquotedAttribute;
  }
}

function afterAttributeName(c){
  if(c.match(/^[\t\n\f ]$/)){
    return afterAttributeName;
  }else if(c === "/"){
    return selfClosingStartTag;
  }else if(c === ">"){
    currentToken[currentAttribute.name] = currentAttribute.value;
    emit(currentToken);
    return data;
  }else if(c === EOF){

  }else {
    currentToken[currentAttribute.name] = currentAttribute.value;
    currentAttribute = {
      name: "",
      value: ""
    }
    return attributeName(c);
  }
}

function selfClosingStartTag(c){
  if(c === ">") {
    currentToken.isSelfClosing = true;
    return data;
  }else if(c === "EOF"){

  }else{}
}

module.exports.parseHTML = function parseHTML(html){
  let state = data;
  for(let c of html){
    state = state(c);
  }
  state = state(EOF);
  return stack[0];
}