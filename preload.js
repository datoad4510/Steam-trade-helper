// const { ipcRenderer, contextBridge } = require("electron");
const convertCsvToXlsx = require("@aternus/csv-to-xlsx");
const path = require("path");
const fs = require("fs");
const puppeteer = require("puppeteer");
const { parse } = require("json2csv");
const fetch = require("node-fetch");

window.csvToExcel = async function (name) {
	// console.log("executed");
	let source = path.join(__dirname, "in", "csv", "users.csv");
	let destination_name = name + ".xlsx";

	// check if the file already exists
	let destination;
	if (
		!fs.existsSync(path.join(__dirname, "out", "excel", destination_name))
	) {
		destination = path.join(__dirname, "out", "excel", destination_name);
	} else {
		throw new Error("File with this name already exists. Change the name");
	}

	//convert
	try {
		// wait for a bit. can't make it work any other way,
		// async awaits not working in ExcelButton,js...
		await new Promise((r) => setTimeout(r, 2000));
		convertCsvToXlsx(source, destination);
		console.log("aaa");
	} catch (e) {
		throw e;
	}
};

window.searchSteamFriends = async (name, pagenum) => {
	// const waitFor = (delay) =>
	// 	new Promise((resolve) => setTimeout(resolve, delay));

	let url =
		"https://steamcommunity.com/search/users/#page=" +
		pagenum +
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
	let users = await page.evaluate((pagenum) => {
		const ApiKey = "5feba94f6554887de7260f51";
		let arr = Array.from(
			document.querySelectorAll(
				"#search_results div.searchPersonaInfo > a.searchPersonaName"
			)
		);
		return arr.map((element) => {
			const link = element.href;
			const id = link.split("/");
			id = id[id.length() - 1];
			return fetch(
				`https://backpack.tf/api/IGetUsers/v3?steamid=76561198038307626&key=${ApiKey}`
			)
				.then((res) => res.json())
				.then((data) => {
					return {
						Link: link,
						Page: pagenum,
						Metal: data.response.players[id].backpack_value["440"],
					};
				});
			// return { Link: element.href, Page: pagenum}
		});
	}, pagenum);
	//console.log(users);
	await browser.close();

	return users;
};

window.jsonToCSV = (json) => {
	const fields = ["Link", "Page", "Metal"];
	const opts = { fields };

	try {
		const csv = parse(json, opts);
		console.log(csv);
		return csv;
	} catch (err) {
		console.error(err);
	}
};

window.saveCSV = async (csv) => {
	const destination_name = "users.csv";
	// if exists delete

	// else delete success, handle that if you need to
	fs.writeFile(path.join("in", "csv", destination_name), csv, function (err) {
		if (err) {
			console.log(err);
		}
	});
};
