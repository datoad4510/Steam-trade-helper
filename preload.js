// const { ipcRenderer, contextBridge } = require("electron");
const convertCsvToXlsx = require("@aternus/csv-to-xlsx");
const path = require("path");
const fs = require("fs");
const puppeteer = require("puppeteer");

window.csvToExcel = function (name) {
	console.log("executed");
	let source = path.join(path.join(__dirname, "in", "csv"), "report.csv");
	let destination_name = name + ".xlsx";

	// check if the file already exists
	let destination;
	if (
		!fs.existsSync(path.join(__dirname, "out", "excel", destination_name))
	) {
		destination = path.join(
			path.join(__dirname, "out", "excel", destination_name)
		);
	} else {
		throw new Error("File with this name already exists. Change the name");
	}

	//convert
	try {
		convertCsvToXlsx(source, destination);
	} catch (e) {
		throw e;
	}
};

window.searchSteamFriends = async (name, numpages) => {
	// const waitFor = (delay) =>
	// 	new Promise((resolve) => setTimeout(resolve, delay));

	let url =
		"https://steamcommunity.com/search/users/#page=" +
		numpages +
		"&text=" +
		name;

	let browser = await puppeteer.launch({
		headless: "true",
	});
	let page = await browser.newPage();

	await page.goto(url);
	// await page.waitForFunction(() => {
	// 	return document.querySelector(
	// 		"#search_results div.searchPersonaInfo > a.searchPersonaName"
	// 	);
	// });
	// await page.waitForNavigation({ waitUntil: "domcontentloaded" });
	await page.waitForTimeout(10000);
	let users = await page.evaluate(() => {
		let arr = Array.from(document.querySelectorAll(
			"#search_results div.searchPersonaInfo > a.searchPersonaName"
		));
		return arr.map(element => {
			return element.href;
		})
	});
	console.log(users);
	await browser.close();

	return users;
};
