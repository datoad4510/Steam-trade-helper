// const { ipcRenderer, contextBridge } = require("electron");
const convertCsvToXlsx = require("@aternus/csv-to-xlsx");
const path = require("path");
const fs = require("fs");

window.csvToExcel = function (name) {
	console.log("executed");
	let source = path.join(path.join(__dirname, "in", "csv"), "report.csv");
	let destination_name = name + ".xlsx";

	// check if the file already exists
	let destination;
	if (
		!fs.existsSync(path.join(__dirname, "out", "excel", destination_name))
	) {
		destination = path.join(
			path.join(__dirname, "out", "excel", destination_name)
		);
	} else {
		throw new Error("File with this name already exists. Change the name");
	}

	//convert
	try {
		convertCsvToXlsx(source, destination);
	} catch (e) {
		throw e;
	}
};
