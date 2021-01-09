// const { ipcRenderer, contextBridge } = require("electron");
const convertCsvToXlsx = require("@aternus/csv-to-xlsx");
const path = require("path");
const fs = require("fs");
const puppeteer = require("puppeteer");
const { parse } = require("json2csv");
const { get } = require("http");

function timeConverter(UNIX_timestamp) {
	var a = new Date(UNIX_timestamp * 1000);
	var months = [
		"Jan",
		"Feb",
		"Mar",
		"Apr",
		"May",
		"Jun",
		"Jul",
		"Aug",
		"Sep",
		"Oct",
		"Nov",
		"Dec",
	];
	var year = a.getFullYear();
	var month = months[a.getMonth()];
	var date = a.getDate();
	var hour = a.getHours();
	var min = a.getMinutes();
	var sec = a.getSeconds();
	var time =
		date + " " + month + " " + year + " " + hour + ":" + min + ":" + sec;
	return time;
}

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

window.searchSteamFriends = async (
	name,
	pagenum,
	timeout,
	ApiKey,
	steamWebApiKey
) => {
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
	await page.waitForTimeout(timeout);
	let users = await page.evaluate(
		async (name, pagenum) => {
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
			return arr.map((element) => {
				const link = element.href;
				let id = link.split("/");
				let vanity = false;
				if (id[id.length - 2] === "id") vanity = true;
				id = id[id.length - 1];

				return {
					SearchTerm: name,
					Link: link,
					Page: pagenum,
					ID: id,
					Vanity: vanity,
				};
			});
		},
		name,
		pagenum
	);
	console.log(users);

	// get info from steam web api
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
		let playtime = "Unknown";
		if (playtimes) {
			for (let i = playtimes.length - 1; i >= 0; --i) {
				if (playtimes[i].appid === 440) {
					playtime = playtimes[i].playtime_forever;
					break;
				}
			}
		}
		// divide by 60 minutes to get hours
		if (playtime !== "Unknown") {
			element.PlaytimeHours = playtime / 60.0;
		} else {
			element.PlaytimeHours = playtime;
		}
		console.log(element);

		// ! Can be optimised to use less requests! request 100 users at a time (but order might be jumbled in array)
		// https://steamapi.xpaw.me/#ISteamUser/GetPlayerSummaries
		let playerSummary = await fetch(
			`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${steamWebApiKey}&steamids=${element.ID}`
		).then((res) => res.json());
		let communityvisibilitystate;
		let timecreated;
		let lastlogoff;
		let loccountrycode;
		if (
			typeof playerSummary.response === undefined ||
			playerSummary.response.players.length === 0
		) {
			// error, no such players or no response
			communityvisibilitystate = "Unknown";
			timecreated = "Unknown";
			lastlogoff = "Unknown";
			loccountrycode = "Unknown";
		} else {
			communityvisibilitystate =
				playerSummary.response.players[0].communityvisibilitystate;
			if (typeof communityvisibilitystate === "undefined")
				communityvisibilitystate = "Unknown";

			timecreated = playerSummary.response.players[0].timecreated;
			if (typeof timecreated === "undefined") timecreated = "Unknown";

			lastlogoff = playerSummary.response.players[0].lastlogoff;
			if (typeof lastlogoff === "undefined") lastlogoff = "Unknown";

			loccountrycode = playerSummary.response.players[0].loccountrycode;
			if (typeof loccountrycode === "undefined")
				loccountrycode = "Unknown";
		}
		// ? https://wiki.teamfortress.com/wiki/WebAPI/GetPlayerSummaries
		switch (communityvisibilitystate) {
			case 1:
				element.Visibility = "Private";
				break;
			case 2:
				element.Visibility = "Friends only";
				break;
			case 3:
				element.Visibility = "Friends of Friends";
				break;
			case 4:
				element.Visibility = "Users Only";
				break;
			case 5:
				element.Visibility = "Public";
				break;
			default:
				break;
		}

		if (timecreated !== "Unknown") {
			element.TimeCreated = timeConverter(timecreated);
		} else {
			element.TimeCreated = timecreated;
		}

		if (lastlogoff !== "Unknown") {
			element.LastLogoff = timeConverter(lastlogoff);
		} else {
			element.LastLogoff = lastlogoff;
		}

		element.CountryCode = loccountrycode;
	}

	console.log("users:", users);
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
	const fields = [
		"Refined",
		"PlaytimeHours",
		"Level",
		"TimeCreated",
		"SearchTerm",
		"Page",
		"Link",
		"ID",
		"Visibility",
		"LastLogoff",
		"Vanity",
		"CountryCode",
	];
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
