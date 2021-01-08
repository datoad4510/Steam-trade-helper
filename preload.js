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
			let vanity = false;
			if (id[id.length - 2] === "id") vanity = true;
			id = id[id.length - 1];

			return {
				Link: link,
				Page: pagenum,
				ID: id,
				Vanity: vanity,
			};
		});
	}, pagenum);
	console.log(users);

	// get info from steam web api
	const steamWebApiKey = "AD2D6E795ECE0C5589872C157A6E750C";
	for (const element of users) {
		if (element.Vanity === true) {
			// convert to id
			const temp = await fetch(
				`https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/?key=${steamWebApiKey}&vanityurl=${element.ID}`
			)
				.then((res) => res.json())
				.catch((err) => console.error(err));
			element.ID = temp.response.steamid;
		}
		// steam level
		let level = await fetch(
			`https://api.steampowered.com/IPlayerService/GetSteamLevel/v1/?key=${steamWebApiKey}&steamid=${element.ID}`
		)
			.then((res) => res.json())
			.catch((err) => console.error(err));
		level = level.response.player_level;
		element.Level = level;

		// playtime
		let playtimes = await fetch(
			`https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${steamWebApiKey}&steamid=${element.ID}&include_played_free_games=1&format=json&appids_filter=440`
		)
			.then((res) => res.json())
			.catch((err) => console.error(err));
		// get array of all games
		// ! Filtering games not working!
		playtimes = playtimes.response.games;
		let playtime = 0;
		if (playtimes) {
			for (let i = 0; i < playtimes.length; ++i) {
				if (playtimes[i].appid === 440) {
					playtime = playtimes[i].playtime_forever;
					break;
				}
			}
		}
		// divide by 60 minutes to get hours
		element.Playtime = playtime / 60.0;
		console.log(element);
	}

	console.log("users:", users);
	const ApiKey = "5feba94f6554887de7260f51";
	for (const element of users) {
		let metal;
		try {
			console.log(
				"Going to fetch",
				`https://backpack.tf/api/IGetUsers/v3?steamid=${element.ID}&key=${ApiKey}`
			);
			metal = await fetch(
				`https://backpack.tf/api/IGetUsers/v3?steamid=${element.ID}&key=${ApiKey}`
			)
				.then((res) => res.json())
				//.then((data) => console.log("Fetched json: ", data))
				.then((data) => {
					let temp;
					try {
						temp =
							data.response.players[element.ID].backpack_value[
								"440"
							];
					} catch {
						temp = "Private profile or doesn't play TF2";
					}

					if (temp) {
						return temp;
					} else {
						return "Private profile or doesn't play TF2";
					}
				})
				.catch((rej) => console.error(rej));
		} catch (err) {
			console.error(err);
			return "Private profile or doesn't play TF2";
		}
		console.log(metal);
		element.Refined = metal;
	}

	console.log(users);
	return users;
};

window.jsonToCSV = (json) => {
	const fields = ["Link", "Page", "ID", "Refined"];
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
