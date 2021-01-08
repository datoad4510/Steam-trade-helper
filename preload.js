// const { ipcRenderer, contextBridge } = require("electron");
const convertCsvToXlsx = require("@aternus/csv-to-xlsx");
const path = require("path");
const fs = require("fs");
const puppeteer = require("puppeteer");
const { parse } = require("json2csv");
const { get } = require("http");

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
	// can't log inside evaluate without next line
	page.on("console", (consoleObj) => console.log(consoleObj.text()));
	page.on("console", async (msg) => {
		const args = await msg.args();
		args.forEach(async (arg) => {
			const val = await arg.jsonValue();
			// value is serializable
			if (JSON.stringify(val) !== JSON.stringify({})) console.log(val);
			// value is unserializable (or an empty oject)
			else {
				const { type, subtype, description } = arg._remoteObject;
				console.log(
					`type: ${type}, subtype: ${subtype}, description:\n ${description}`
				);
			}
		});
	});
	await page.goto(url);
	// await page.waitForFunction(() => {
	// 	return document.querySelector(
	// 		"#search_results div.searchPersonaInfo > a.searchPersonaName"
	// 	);
	// });
	// await page.waitForNavigation({ waitUntil: "domcontentloaded" });
	await page.waitForTimeout(10000);
	let users = await page.evaluate(async (pagenum) => {
		let arr = Array.from(
			document.querySelectorAll(
				"#search_results div.searchPersonaInfo > a.searchPersonaName"
			)
		);

		// why does for not work? map works

		// for (let i = 0; i < arr.length; ++i) {
		// 	const link = arr[i].href;
		// 	let id = link.split("/");
		// 	id = id[id.length - 1];
		// 	console.log(link, id);
		// 	console.log(arr[i]);
		// 	arr[i] = {
		// 		Link: link,
		// 		Page: pagenum,
		// 		ID: id,
		// 	};
		// 	console.log(arr[i]);
		// }
		console.log(arr);
		return arr.map((element) => {
			const link = element.href;
			let id = link.split("/");
			id = id[id.length - 1];
			return {
				Link: link,
				Page: pagenum,
				ID: id,
			};
		});
	}, pagenum);
	console.log(users);

	// the following works in the console:
	//  fetch(
	// 	`https://backpack.tf/api/IGetUsers/v3?steamid=76561198038307626&key=5feba94f6554887de7260f51`
	// )
	// 	.then((res) => res.json()).then((data) => {return {
	// 			Metal: data.response.players["76561198038307626"].backpack_value["440"],
	// 		};}).then(res => console.log(res))

	// go to backpack.tf so you can fetch locally... doesn't work
	// from localhost or steam (different errors)

	url = "https://backpack.tf/developer";
	await page.goto(url);
	let metal_users = await page.evaluate(async (users) => {
		console.log("users:", users);
		const ApiKey = "5feba94f6554887de7260f51";
		// return users.map(async (element) => {
		// 	let metal;
		// 	try {
		// 		console.log(
		// 			`https://backpack.tf/api/IGetUsers/v3?steamid=${element.ID}&key=${ApiKey}`
		// 		);
		// 		metal = await fetch(
		// 			`https://backpack.tf/api/IGetUsers/v3?steamid=${element.ID}&key=${ApiKey}`
		// 		)
		// 			.then((res) => res.json())
		// 			.then((data) => console.log(data))
		// 			.then((data) => {
		// 				const res = data.response;
		// 				if (res === undefined) {
		// 					return "-1";
		// 				} else {
		// 					return data.response.players[element.ID]
		// 						.backpack_value["440"];
		// 				}
		// 			})
		// 			.catch((rej) => console.error(rej));
		// 	} catch (err) {
		// 		console.error(err);
		// 	}
		// 	console.log(metal);

		// 	return {
		// 		Link: element.Link,
		// 		Page: element.Page,
		// 		ID: element.ID,
		// 		Metal: metal,
		// 	};
		// });
		metal_users = [];
		for (const element of users) {
			let metal;
			try {
				console.log(
					`https://backpack.tf/api/IGetUsers/v3?steamid=${element.ID}&key=${ApiKey}`
				);
				metal = await fetch(
					`https://backpack.tf/api/IGetUsers/v3?steamid=${element.ID}&key=${ApiKey}`
				)
					.then((res) => res.json())
					.then((data) => console.log("Fetched json: ", data))
					.then((data) => {
						const res = data.response;
						if (res === undefined) {
							return "-1";
						} else {
							return data.response.players[element.ID]
								.backpack_value["440"];
						}
					})
					.catch((rej) => console.error(rej));
			} catch (err) {
				console.error(err);
			}
			console.log(metal);

			metal_users.push({
				Link: element.Link,
				Page: element.Page,
				ID: element.ID,
				Metal: metal,
			});
		}
		console.log(metal_users);
		// 	const getMetal = async (element) => {
		// 		return await fetch(
		// 			`https://backpack.tf/api/IGetUsers/v3?steamid=${element.ID}&key=${ApiKey}`
		// 		)
		// 			.then((res) => res.json())
		// 			.then((data) => console.log(data))
		// 			.then((data) => {
		// 				const res = data.response;
		// 				if (res === undefined) {
		// 					return "-1";
		// 				} else {
		// 					return data.response.players[element.ID].backpack_value[
		// 						"440"
		// 					];
		// 				}
		// 			})
		// 			.catch((rej) => console.error(rej));
		// 	};
		// 	let getData;
		// 	try {
		// 		getData = async () => {
		// 			return Promise.all(
		// 				users.map((element) => {
		// 					return {
		// 						Link: element.Link,
		// 						Page: element.Page,
		// 						ID: element.ID,
		// 						Metal: getMetal(element),
		// 					};
		// 				})
		// 			);
		// 		};
		// 	} catch (err) {
		// 		console.error(err);
		// 	}

		// 	await getData()
		// 		.then((data) => {
		// 			metal_users = data;
		// 			console.log(data);
		// 		})
		// 		.catch((err) => console.error(err));
		// }, users);

		await browser.close();
		return metal_users;
	}, users);
};

window.jsonToCSV = (json) => {
	const fields = ["Link", "Page", "ID", "Metal"];
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
			console.error(err);
		}
	});
};
