import React from "react";
import ReactDOM from "react-dom";
import ExcelButton from "./ExcelButton.js";

export default function App() {
	window.searchSteamFriends("asd",1);

	return (
		<>
			<ExcelButton></ExcelButton>
		</>
	);
}
