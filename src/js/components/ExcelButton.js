import React from "react";
import ReactDOM from "react-dom";


export default function ExcelButton() {
	return <button onClick={window.csvToExcel}>Convert csv to excel</button>;
}
