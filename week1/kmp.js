function matchValue(str) {
  const prefix = [];
  const suffix = [];
  const partMatch = [];
  for (let i = 0, len = str.length; i < len; i++) {
    const newStr = str.substring(0, i + 1);
    if (newStr.length === 1) {
      partMatch[i] = 0;
    } else {
      for (let j = 0; j < i; j++) {
        prefix[j] = newStr.slice(0, j + 1);
        suffix[j] = newStr.slice(-j - 1);
        if (prefix[j] === suffix[j]) {
          partMatch[i] = prefix[j].length;
        }
      }
      if (!partMatch[i]) {
        partMatch[i] = 0;
      }
    }
  }
  return partMatch;
}



function kmp(sourceStr, searchStr) {
  const part = matchValue(searchStr);
  console.log(part);
  for (let i = 0,sourceLength = sourceStr.length; i < sourceLength; i++) { 
    for (let j = 0,searchLength = searchStr.length; j < searchLength; j++) {
      if (searchStr[j] === sourceStr[i]) {
        if (j === searchLength - 1) {
          return true;
        } else {
          i++;
        }
      } else {
        if (j > 1 && part[j] > 0) {
          j = j - part[j];
        } else {
          i = (i - j);
        }
        break;
      }
    }
  }
  return false;
}
// console.log(kmp("ababababab","ababacb"));
// console.log(kmp("BBC ABCDAB ABCDABABCDABDE","ABCDABD"))