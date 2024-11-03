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

    const div2 = document.querySelectorAll("div[id='menu-list-section']");
    console.log("div2 : ", div2);
    const innerText2 = [];
    for (const child2 of div2) {
      innerText.push(child2.textContent.trim());
      console.log(child2.textContent.trim());
    }

    return innerText;
  });
  foodHubMenuData.push(...primeMenuData);

  //   ! Save data to menu.json
  fs.writeFile("menu.json", JSON.stringify(foodHubMenuData), (err) => {
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
