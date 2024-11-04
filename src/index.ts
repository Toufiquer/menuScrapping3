/*
|-----------------------------------------
| setting up MenuScrapping v3
| @author: Toufiquer Rahman<toufiquer.0@gmail.com>
| @copyright: menuScrapping 3.0, November, 2024
|-----------------------------------------
*/

import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

import fs = require("fs");
import puppeteer = require("puppeteer");

const rl = readline.createInterface({ input, output });

// ! Start project
const run = async () => {
  let foodHubMenuData = [];

  const foodHubURL = "https://foodhub.co.uk/hillhead-pkwy/raj-bari-indian-takeawayrestaurant/ordernow";

  //   ! Open browser
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  await page.setViewport({
    width: 1920, // Full-screen width
    height: 1080, // Full-screen height
    deviceScaleFactor: 1,
    hasTouch: false,
    isMobile: false,
  });

  await page.goto(foodHubURL, { waitUntil: "networkidle2", timeout: 60000 });
  console.log("Please wait... it takes about 5-6 minutes");

  // ! Get all Heading and clicking them one by one
  const getAllElement = await page.$$("div[id='category-section'] h2[role='heading']");
  const parentPrimeMenuData = [];
  for (const element of getAllElement) {
    element.click();
    const t = await (await element.getProperty("textContent")).jsonValue();
    console.log("element clicked ", t);

    // ! after click the element then scrap all data and then check it already exists or not if not then update it.
    const scrappingAllData = await page.evaluate(async () => {
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
        return filterElementNodes
          .filter((curr) => curr.innerText !== "")
          .filter((curr) => curr.innerText !== undefined);
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
        let result: {
          item: string;
          price?: string;
          info?: string;
          option?: any[];
          testingData?: string;
          allInnerText?: string;
        } = {
          item,
          testingData,
          allInnerText: curr.innerText,
        };
        // if (price && price !== "") {
        //   result.price = price;
        // }
        // if (info && !info.includes("£")) {
        //   result.info = info;
        // }
        return result;
      });

      console.log("");
      console.log("");
      console.log("");
      console.log("filteredData : ", filteredData);
      return filteredData;
    });

    parentPrimeMenuData.push({
      clickedItem: t,
      isInclude: scrappingAllData[0].allInnerText?.toLowerCase()?.includes(t.toLowerCase()),
      data: scrappingAllData[0],
    });

    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  console.log("");
  console.log("");
  console.log("");
  // console.log("primeMenuData : ", parentPrimeMenuData);
  //   ! Save data to menu.json
  fs.writeFile("menu.json", JSON.stringify(parentPrimeMenuData), (err) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log("Data saved to menu.json");
  });

  //   ! Close window
  await browser.close();
  rl.close();
};

run();
