// const { ipcRenderer, contextBridge } = require("electron");
const convertCsvToXlsx = require("@aternus/csv-to-xlsx");
const path = require("path")

window.csvToExcel = function () {
    console.log("executed");
	let source = path.join(path.join(__dirname, "in", "csv"), "report.csv");
	let destination = path.join(
		path.join(__dirname, "out", "excel"),
		"converted_report.xlsx"
	);
	try {
		convertCsvToXlsx(source, destination);
	} catch (e) {
		console.error(e.toString());
	}
};
