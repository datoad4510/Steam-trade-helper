import React, { useState } from "react";
import ReactDOM from "react-dom";
import fetch from "node-fetch";

export default function ExcelButton() {
	let searchSteamFriendsMultiPage = async (
		name,
		first,
		last,
		timeout,
		backpackapi,
		steamapi
	) => {
		let users = [];
		for (let i = first; i <= last; ++i) {
			users = users.concat(
				await window.searchSteamFriends(
					name,
					i,
					timeout,
					backpackapi,
					steamapi
				)
			);
			setCurrentPage(i);
		}
		setFirstPage(0);
		setLastPage(0);
		setCurrentPage(0);
		return users;
	};

	const [FileName, setFileName] = useState("");
	const [errorMessage, setErrorMessage] = useState("");
	const [UserName, setUserName] = useState("");
	const [FirstPage, setFirstPage] = useState(0);
	const [LastPage, setLastPage] = useState(0);
	const [CurrentPage, setCurrentPage] = useState(0);
	const [Timeout, setTimeout] = useState(10);
	const [backpackTfApiKey, setBackpackTfApiKey] = useState("");
	const [steamApiKey, setSteamApiKey] = useState("");
	// TODO: make ErrorMessage an array of errors
	async function onSubmit(event) {
		event.preventDefault();
		// get user data in json format
		let json;
		setErrorMessage("");
		try {
			console.log(backpackTfApiKey, steamApiKey);
			json = await searchSteamFriendsMultiPage(
				UserName,
				FirstPage,
				LastPage,
				Timeout * 1000,
				backpackTfApiKey,
				steamApiKey
			);
			// fixes incorrect loading bug
			document.getElementById("first").value = "";
			document.getElementById("last").value = "";
			console.log("Logging JSON");
			console.log(json);
		} catch (e) {
			console.log(e);
			setErrorMessage(e.message);
		}
		// convert user data to csv
		let csv;
		setErrorMessage("");
		try {
			csv = await window.jsonToCSV(json);
		} catch (e) {
			console.log(e);
			setErrorMessage(e.message);
		}
		// save user data as csv
		setErrorMessage("");
		try {
			// turn saveCSV into an async function so it waits until the csv is created
			await window.saveCSV(csv);
		} catch (e) {
			console.log(e);
			setErrorMessage(e.message);
		}
		// save the csv file as an excel file
		setErrorMessage("");
		try {
			await window.csvToExcel(FileName);
		} catch (e) {
			console.log(e);
			setErrorMessage(e.message);
		}
	}

	const myChangeHandlerFile = (event) => {
		setFileName(event.target.value);
	};
	const myChangeHandlerUser = (event) => {
		setUserName(event.target.value);
	};
	const myChangeHandlerFirst = (event) => {
		setFirstPage(event.target.value);
	};
	const myChangeHandlerLast = (event) => {
		setLastPage(event.target.value);
	};
	const myChangeHandlerTimeout = (event) => {
		setTimeout(event.target.value);
	};
	const myChangeHandlerBackpackTfApiKey = (event) => {
		setBackpackTfApiKey(event.target.value);
	};
	const myChangeHandlerSteamApiKey = (event) => {
		setSteamApiKey(event.target.value);
	};

	return (
		<>
			<form id="excel-form" action="" method="get" onSubmit={onSubmit}>
				<label htmlFor="username">Search term: </label>
				<input
					type="search"
					name="username"
					id="username"
					onChange={myChangeHandlerUser}
				></input>
				<br></br>
				<label htmlFor="first">First page: </label>
				<input
					type="search"
					name="first"
					id="first"
					onChange={myChangeHandlerFirst}
				></input>
				<br></br>
				<label htmlFor="last">Last page: </label>
				<input
					type="search"
					name="last"
					id="last"
					onChange={myChangeHandlerLast}
				></input>
				<br></br>
				<label htmlFor="timeout">
					Time to wait for a steam page to load in seconds, lower is
					faster but more error prone:{" "}
				</label>
				<input
					type="search"
					name="timeout"
					id="timeout"
					defaultValue={Timeout}
					onChange={myChangeHandlerTimeout}
				></input>
				<br></br>
				<label htmlFor="filename">Excel file name: </label>
				<input
					type="search"
					name="filename"
					id="filename"
					onChange={myChangeHandlerFile}
				></input>
				<br></br>
				<label htmlFor="backpackapi">Backpack.tf api key: </label>
				<input
					type="search"
					name="backpackapi"
					id="backpackapi"
					onChange={myChangeHandlerBackpackTfApiKey}
				></input>
				<br></br>
				<label htmlFor="steamapi">Steam api key: </label>
				<input
					type="search"
					name="steamapi"
					id="steamapi"
					onChange={myChangeHandlerSteamApiKey}
				></input>
				<br></br>
				<label htmlFor="submit"></label>
				<br></br>
				<input id="submit" type="submit" value="Gather data"></input>
				<p id="loading">{`${CurrentPage}/${
					LastPage - FirstPage + 1
				}`}</p>
				<>{errorMessage}</>
			</form>
		</>
	);
}
