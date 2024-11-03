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

const rl = readline.createInterface({ input, output });

const run = async () => {
  let menuData = [];

  //   ! Save data to menu.json
  fs.writeFile("menu.json", JSON.stringify(menuData), (err) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log("Data saved to menu.json");
  });

  //   ! Close window
  rl.close();
};
run();
