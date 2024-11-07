const div = document.querySelectorAll("div[data-test-id='virtuoso-item-list']");

const getNodeElements = (arrOfNodeElement) => {
  let filterElementNodes = [];
  for (const child of arrOfNodeElement) {
    if (child.nodeType !== 8) {
      // This filters out comments (nodeType 8)
      const filterChild = {
        childElementCount: "",
        children: "",
        innerText: "",
        tagName: "",
        textContent: "",
        classList: "",
      };
      for (const c in child) {
        if (child[c] !== null) {
          filterChild[c] = child[c];
        }
      }
      const newChild = {
        childElementCount: filterChild.childElementCount,
        children: filterChild.children,
        innerText: filterChild.innerText,
        tagName: filterChild?.tagName,
        textContent: filterChild.textContent,
        // selfNode: filterChild,
        classList: filterChild.classList,
      };
      filterElementNodes.push({ ...newChild });
    }
  }
  //   clear child nodes by self invoked
  filterElementNodes = filterElementNodes.map((curr) => {
    if (curr.childElementCount > 0) {
      const filterChildren = getNodeElements(curr.children);
      return {
        ...curr,
        children: filterChildren,
      };
    } else {
      return curr;
    }
  });
  return filterElementNodes.filter((curr) => curr.innerText !== "").filter((curr) => curr.innerText !== undefined);
};

const nodeElementFromDiv = getNodeElements(div);
console.log(nodeElementFromDiv);

const getDataByTagName = (data, tagName = "") => {
  let arrData = Array.isArray(data) ? data : [data];
  if (tagName === "") {
    return arrData;
  }
  const result = [];
  arrData.forEach((curr) => {
    if (curr?.tagName.toLowerCase() === tagName.toLowerCase()) {
      result.push(curr);
    } else {
      if (curr?.children?.length > 0) {
        const findInnerData = getDataByTagName([...curr.children], tagName);
        result.push(...findInnerData);
      }
    }
  });
  const filterData = (data) => {
    const filteredData = data.filter((item, index, self) => {
      // Check if item is unique
      return (
        index ===
        self.findIndex(
          (t) =>
            t?.tagName === item?.tagName &&
            t.children?.length === item.children?.length &&
            t.innerText === item.innerText
        )
      );
    });
    return filteredData;
  };

  const filterResult = filterData(result);
  return filterResult;
};

const getInnerText = (obj = { innerText: "", children: [] }, nthChild = 0) => {
  if (obj.innerText?.includes("\n")) {
    if (obj.children?.length > 0) {
      return getInnerText(obj.children[nthChild]);
    } else {
      return obj.innerText;
    }
  }
  return obj.innerText;
};

let filteredData = nodeElementFromDiv.map((curr) => {
  // ! it is confirm that all data has been exist inside curr.
  // ! now you have to filter it out.
  const testingData = getInnerText(
    curr?.children[0]?.children[0]?.children[0]?.children[0]?.children[0]?.children[0]?.children[0]
  );
  const item = getInnerText(curr, 0);
  // const info = getInnerText(curr?.children[0]?.children[1]);
  // const price = getInnerText(getDataByTagName(curr, "h4")[0])?.split("£")[1];
  let result = {
    item,
    testingData,
    allInnerText: curr.innerText,
  };
  console.log("result : ", result);
});
