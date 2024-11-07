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
  let foodHubMenuDataScrip = [];

  //   ! get url
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

  // ! 1. take a snapshot of the web
  const primeMenuData = await page.evaluate(async () => {
    // ! smoothScroll to load all data
    const smoothScrollToBottom = async () => {
      let scrollPosition = 0;
      let documentHeight = document.body.scrollHeight;
      while (documentHeight > scrollPosition) {
        const targetPosition = Math.min(documentHeight, scrollPosition + 1000);

        await new Promise((resolve) => {
          window.scrollTo({
            top: targetPosition,
            behavior: "smooth",
          });
          setTimeout(resolve, 100);
        });

        scrollPosition = targetPosition;
        documentHeight = document.body.scrollHeight;
      }
    };
    await smoothScrollToBottom();

    await new Promise((resolve) => setTimeout(resolve, 200));

    // get all header
    const div = document.querySelectorAll("h2[role='heading']");

    console.log("div : ", div);
    const innerText = [];
    for (const child of div) {
      innerText.push(child.textContent.trim());
      console.log(child.textContent.trim());
    }
    innerText.shift(); // remove heading of the webpage
    innerText.shift(); // remove subtitle of the webpage
    return innerText;
  });
  foodHubMenuData.push(...primeMenuData);

  // ! Get all Heading and clicking them one by one
  const getAllElement = await page.$$("h2[role='heading']");
  for (const element of getAllElement) {
    element.click();

    console.log("element clicked ", await (await element.getProperty("textContent")).jsonValue());

    const scripPrimeMenuData = await page.evaluate(async () => {
      // ! get content data
      const primeScrappingData = document.querySelectorAll("div[data-testid='AK_menu_screen_accordion_wrapper']");

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

      const mainElementData = getNodeElements(primeScrappingData);
      const extractMenuData = (data) => {
        let result = {};
        // get Inner text
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

        const getAllInnerItems = (data) => {
          let allInnerItems = [];

          if (Array.isArray(data)) {
            data.forEach((dataCurr) => {
              dataCurr.children[0]?.children[0]?.children[0]?.children[0]?.children[1]?.children[0]?.children[0]?.children[0]?.children[0]?.children[0]?.children[0]?.children[0]?.children[1]?.children?.forEach(
                (curr) => {
                  allInnerItems.push(...curr.children[0]?.children);
                }
              );
              dataCurr.children[0]?.children[0]?.children[0]?.children[0]?.children[1]?.children[0]?.children[0]?.children[0]?.children[0]?.children[0]?.children[0]?.children?.forEach(
                (curr) => {
                  curr.children[0]?.children.forEach((d) => {
                    allInnerItems.push(d);
                  });
                }
              );
            });
            // ! destructure data
            allInnerItems = allInnerItems.map((curr) => {
              let result = {};
              const item = getInnerText(
                curr.children[0]?.children[0]?.children[0]?.children[0]?.children[0]?.children[0]
              );
              const info =
                getInnerText(
                  curr.children[0]?.children[0]?.children[0]?.children[0]?.children[0]?.children[0]?.children[1]
                ) || getInnerText(curr.children[0]?.children[0]?.children[0]?.children[0]?.children[1]);
              const price =
                getInnerText(curr.children[0]?.children[0]?.children[0]?.children[0]?.children[0]?.children[1]) ||
                getInnerText(curr.children[0]?.children[0]?.children[0]?.children[1]);
              console.log("");
              console.log("");
              console.log("");
              // console.log(JSON.stringify({ item, data: curr, info, price }));
              console.log("");
              if (item) {
                result.item = item;
              }
              if (info) {
                result.info = info;
              }
              if (price) {
                result.price = price;
              }
              return result;
            });
          } else {
            getAllInnerItems([data]);
          }
          allInnerItems = allInnerItems.filter((curr) => curr.item);
          // filter empty items
          console.log(" 1 ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^", JSON.stringify(allInnerItems));
          return allInnerItems;
        };

        if (Array.isArray(data)) {
          // console.log("data 1.2: ", JSON.stringify(data[0]));
          data[0]?.children?.forEach((curr) => {
            console.log("");
            console.log("");
            let keyName = getInnerText(curr, 0);
            keyName = keyName.toLowerCase().replace(" ", "_");
            result[keyName] = { lst: getAllInnerItems(curr) };
          });
        } else {
          return extractMenuData([data]);
        }

        return result;
      };

      const menuData = extractMenuData(mainElementData[0]);
      console.log("mainElementData", mainElementData);
      console.log("menuData", menuData);
      return [{ menuData, mainElementData }];
    });
    await new Promise((resolve) => setTimeout(resolve, 200));
    foodHubMenuDataScrip.push(...scripPrimeMenuData);
  }

  //   ! Save data to menu.json
  fs.writeFile("menu.json", JSON.stringify(foodHubMenuData), (err) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log("Data saved to menu.json");
  });
  //   ! Save data to menu.json
  fs.writeFile("foodHubMenuDataScrip.json", JSON.stringify(foodHubMenuDataScrip), (err) => {
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
