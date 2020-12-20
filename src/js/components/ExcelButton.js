import React, { useState } from "react";
import ReactDOM from "react-dom";

export default function ExcelButton() {
	const [FileName, setFileName] = useState("");
	const [errorMessage, setErrorMessage] = useState("");
	function customCsvToExcel(event) {
		setErrorMessage("");
		event.preventDefault();
		try {
			window.csvToExcel(FileName);
		} catch (e) {
			setErrorMessage(e.message);
		}
	}

	const myChangeHandler = (event) => {
		setFileName(event.target.value);
	};

	return (
		<>
			<form action="" method="get" onSubmit={customCsvToExcel}>
				<input
					type="search"
					name=""
					id=""
					onChange={myChangeHandler}
				></input>
				<input type="submit" value="Convert csv to excel"></input>
			</form>
			<>{errorMessage}</>
		</>
	);
}
