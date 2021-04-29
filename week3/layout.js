function getStyle(element) {
  if (!element.style) element.style = {};

  for (let prop in element.computedStyle) {
    element.style[prop] = element.computedStyle[prop].value;
    if (element.style[prop].toString().match(/px$/)) {
      element.style[prop] = parseInt(element.style[prop], 10);
    }

    if (element.style[prop].toString().match(/^[0-9\.]+$/)) {
      element.style[prop] = parseInt(element.style[prop]);
    }
  }

  return element.style;
}

function layout(element) {
  if (!element.computedStyle) return;
  let style = getStyle(element);

  if (style.display !== "flex") return;

  let items = element.children.filter((i) => i.type === "element");

  items.sort((a, b) => a.order ?? 0 - b.order ?? 0);

  ["width", "height"].forEach((size) => {
    if (style[size] === "auto" || style[size] === "") {
      style[size] = null;
    }
  });

  if (!style.flexDirection || style.flexDirection === "auto")
    style.flexDirection = "row";
  if (!style.alignItems || style.alignItems === "auto")
    style.alignItems = "stretch";
  if (!style.justifyContent || style.justifyContent === "auto")
    style.justifyContent = "flex-start";
  if (!style.flexWrap || style.flexWrap === "auto") style.flexWrap = "nowrap";
  if (!style.alignContent || style.alignContent === "auto")
    style.alignContent = "stretch";

  let mainSize,
    mainStart,
    mainEnd,
    mainSign,
    mainBase,
    crossSize,
    crossStart,
    crossEnd,
    crossSign,
    crossBase;
  if (style.flexDirection === "row") {
    mainSize = "width";
    mainStart = "left";
    mainEnd = "right";
    mainSign = +1;
    mainBase = 0;

    crossSize = "height";
    crossStart = "top";
    crossEnd = "bottom";
  }
  if (style.flexDirection === "row-reverse") {
    mainSize = "width";
    mainStart = "right";
    mainEnd = "left";
    mainSign = -1;
    mainBase = style.width;

    crossSize = "height";
    crossStart = "top";
    crossEnd = "bottom";
  }

  if (style.flexDirection === "column") {
    mainSize = "height";
    mainStart = "top";
    mainEnd = "bottom";
    mainSign = +1;
    mainBase = 0;

    crossSize = "width";
    crossStart = "left";
    crossEnd = "right";
  }
  if (style.flexDirection === "column-reverse") {
    mainSize = "height";
    mainStart = "bottom";
    mainEnd = "top";
    mainSign = -1;
    mainBase = style.height;

    crossSize = "width";
    crossStart = "left";
    crossEnd = "right";
  }
  if (style.flexDirection === "wrap-reverse") {
    [crossStart, crossEnd] = [crossEnd, crossStart];
    crossSign = -1;
  } else {
    crossBase = 0;
    crossSign = 1;
  }

  let isAutoMainSize = false;
  if (!style[mainSize]) {
    style[mainSize] = 0;
    for (let i = 0, len = items.length; i < len; i++) {
      let item = items[i];
      let itemStyle = getStyle(item);
      if (itemStyle[mainSize] !== null || itemStyle[mainSize] !== void 0) {
        style[mainSize] += itemStyle[mainSize];
      }
    }
    isAutoMainSize = true;
  }

  let flexLine = [];
  let flexLines = [flexLine];

  let mainSpace = style[mainSize];
  let crossSpace = 0;

  for (let i = 0, len = items.length; i < len; i++) {
    let item = items[i];
    let itemStyle = getStyle(item);

    if (itemStyle[mainSize] === null) itemStyle[mainSize] = 0;

    if (itemStyle.flex) {
      flexLine.push(item);
    } else if (style.flexWrap === "nowrap" && isAutoMainSize) {
      mainSpace -= itemStyle[mainSize];
      if (itemStyle[crossSize] !== null && itemStyle[crossSize] !== void 0) {
        crossSpace = Math.max(crossSpace, itemStyle[crossSize]);
      }
      flexLine.push(item);
    } else {
      if (itemStyle[mainSize] > style[mainSize]) {
        itemStyle[mainSize] = style[mainSize];
      }
      if (mainSpace < itemStyle[mainSize]) {
        flexLine.mainSpace = mainSpace;
        flexLine.crossSpace = crossSpace;
        flexLines.push(flexLine);
        flexLine = [item];
        mainSpace = style[mainSize];
        crossSpace = 0;
      } else {
        flexLine.push(item);
      }
      mainSpace -= itemStyle[mainSize];
      if (itemStyle[crossSize] !== null && itemStyle[crossSize] !== void 0) {
        crossSpace = Math.max(crossSpace, itemStyle[crossSize]);
      }
    }
  }

  flexLine.mainSpace = mainSpace;

  if (style.flexWrap === "nowrap" || isAutoMainSize) {
    flexLine.crossSpace = style[crossSize] ?? crossSpace;
  } else {
    flexLine.crossSpace = crossSpace;
  }

  if (mainSpace < 0) {
    let scale = style[mainSize] / (style[mainSize] - mainSpace);
    let currentMain = mainBase;

    for (let i = 0, len = items.length; i < len; i++) {
      let item = items[i];
      let itemStyle = getStyle(item);

      if (itemStyle.flex) itemStyle[mainSize] = 0;

      itemStyle[mainSize] = itemStyle[mainSize] * scale;

      itemStyle[mainStart] = currentMain;
      itemStyle[mainEnd] =
        itemStyle[mainStart] + mainSign * itemStyle[mainSize];
      currentMain = itemStyle[mainEnd];
    }
  } else {
    flexLines.forEach(function (_items) {
      let _mainSpace = _items.mainSpace;
      let flexTotal = 0;
      for (let i = 0, len = _items.length; i < len; i++) {
        let item = _items[i];
        let itemStyle = getStyle(item);

        if (itemStyle.flex !== null && itemStyle.flex !== undefined) {
          flexTotal += itemStyle.flex;
          continue;
        }
      }

      if (flexTotal > 0) {
        let currentMain = mainBase;
        for (let i = 0, len = _items.length; i < len; i++) {
          let item = _items[i];
          let itemStyle = getStyle(item);

          if (itemStyle.flex) {
            itemStyle[mainSize] = (_mainSpace / flexTotal) * itemStyle.flex;
          }
          itemStyle[mainStart] = currentMain;
          itemStyle[mainEnd] =
            itemStyle[mainStart] + mainSign * itemStyle[mainSize];
          currentMain = itemStyle[mainEnd];
        }
      } else {
        let [currentMain, step] = getCurrentMainAndStep(
          style.justifyContent,
          mainBase,
          mainSign,
          _mainSpace,
          items.length
        );

        for (let i = 0, len = items.length; i < len; i++) {
          let item = _items[i];
          let itemStyle = getStyle(item);
          itemStyle[mainStart] = currentMain;
          itemStyle[mainEnd] =
            itemStyle[mainStart] + mainSign * itemStyle[mainSize];
          currentMain = itemStyle[mainEnd] + step;
        }
      }
    });
  }

  let conCrossSpace;
  if (!style[crossSize]) {
    conCrossSpace = 0;
    style[crossSize] = 0;
    for (let i = 0, len = flexLines.length; i < len; i++) {
      style[crossSize] = style[crossSize] + flexLines[i].crossSpace;
    }
  } else {
    conCrossSpace = style[crossSize];
    for (let i = 0, len = flexLines.length; i < len; i++) {
      conCrossSpace -= flexLines[i].crossSpace;
    }
  }

  if (style.flexWrap === "wrap-reverse") {
    crossBase = style[crossSize];
  } else {
    crossBase = 0;
  }

  let step;

  if (style.alignContent === "flex-start") {
    crossBase += 0;
    step = 0;
  }
  if (style.alignContent === "flex-end") {
    crossBase += crossSign * conCrossSpace;
    step = 0;
  }
  if (style.alignContent === "center") {
    crossBase += (crossSign * conCrossSpace) / 2;
    step = 0;
  }
  if (style.alignContent === "space-between") {
    crossBase += 0;
    step = conCrossSpace / (flexLines.length - 1);
  }
  if (style.alignContent === "space-around") {
    crossBase += (crossSign * step) / 2;
    step = conCrossSpace / flexLines.length;
  }
  if (style.alignContent === "stretch") {
    crossBase += 0;
    step = 0;
  }

  flexLines.forEach(function (items) {
    let lineCrossSize =
      style.alignContent === "stretch"
        ? items.crossSpace + conCrossSpace / flexLines.length
        : items.crossSpace;
    for (let i = 0, len = items.length; i < len; i++) {
      let item = items[i];
      let itemStyle = getStyle(item);
      let align = itemStyle.alignSelf || itemStyle.alignItems;

      if (itemStyle.flex) {
        itemStyle[crossSize] = lineCrossSize;
      }

      if (item === null)
        itemStyle[crossSize] = align === "stretch" ? lineCrossSize : 0;

      if (align === "flex-start") {
        itemStyle[crossStart] = crossBase;
        itemStyle[crossEnd] =
          itemStyle[crossStart] + crossSign * itemStyle[crossSize];
      }

      if (align === "flex-end") {
        itemStyle[crossStart] =
          itemStyle[crossEnd] - crossSign * itemStyle[crossSize];
        itemStyle[crossEnd] = crossBase + crossSign * lineCrossSize;
      }

      if (align === "center") {
        itemStyle[crossStart] =
          crossBase + (crossSign * (lineCrossSize - itemStyle[crossSize])) / 2;
        itemStyle[crossEnd] =
          itemStyle[crossStart] + crossSign * itemStyle[crossSize];
      }

      if (align === "stretch") {
        itemStyle[crossStart] = crossBase;
        itemStyle[crossEnd] =
          crossBase +
          crossSign *
            (itemStyle[crossSize] !== null && itemStyle[crossSize] !== void 0
              ? itemStyle[crossSize]
              : lineCrossSize);
        itemStyle[crossSize] =
          crossSign * (itemStyle[crossEnd] - itemStyle[crossStart]);
      }
    }
    crossBase += crossSign * (lineCrossSize + step);
  });
}

function getCurrentMainAndStep(
  justifyContent,
  mainBase,
  mainSign,
  mainSpace,
  itemsLength
) {
  if (justifyContent === "flex-start") return [mainBase, 0];
  if (justifyContent === "flex-end")
    return [mainSpace * mainSign + mainBase, 0];
  if (justifyContent === "center")
    return [mainSpace / 2 + mainSign + mainBase, 0];
  if (justifyContent === "space-between")
    return [mainBase, (mainSpace / (itemsLength - 1)) * mainSign];
  if (justifyContent === "space-around")
    return [
      ((mainSpace / itemsLength) * mainSign) / 2 + mainBase,
      (mainSpace / itemsLength) * mainSign,
    ];
}
module.exports = layout;
