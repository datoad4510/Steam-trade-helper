import React, { useState } from "react";
import ReactDOM from "react-dom";

export default function ExcelButton() {


	let searchSteamFriendsMultiPage = async (name, first, last) => {
		let users = [];
		for (let i = first; i <= last; ++i) {
			users = users.concat(await window.searchSteamFriends(name, i));
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
	const [ApiKey, setApiKey] = useState("");
	// TODO: make ErrorMessage an array of errors
	async function onSubmit(event) {
		event.preventDefault();
		// get user data in json format
		let json;
		setErrorMessage("");
		try {
			json = await searchSteamFriendsMultiPage(
				UserName,
				FirstPage,
				LastPage
			);
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

	return (
		<>
			<form action="" method="get" onSubmit={onSubmit}>
				<input
					type="search"
					name="username"
					id="username"
					onChange={myChangeHandlerUser}
				></input>
				<input
					type="search"
					name="first"
					id="first"
					onChange={myChangeHandlerFirst}
				></input>
				<input
					type="search"
					name="last"
					id="last"
					onChange={myChangeHandlerLast}
				></input>
				<input
					type="search"
					name="filename"
					id="filename"
					onChange={myChangeHandlerFile}
				></input>
				<input type="submit" value="Convert csv to excel"></input>
			</form>
			<>{errorMessage}</>
			<>{`${CurrentPage}/${LastPage - FirstPage + 1}`}</>
		</>
	);
}
