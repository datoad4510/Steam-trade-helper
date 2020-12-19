const { app, BrowserWindow } = require("electron");
const path = require("path");
const convertCsvToXlsx = require("@aternus/csv-to-xlsx");

function createWindow() {
	const win = new BrowserWindow({
		width: 1200,
		height: 800,
		backgroundColor: "white",
		webPreferences: {
			nodeIntegration: false,
			worldSafeExecuteJavaScript: true,
			contextIsolation: true,
		},
	});

	win.loadFile("index.html");
	try {
		require("electron-reloader")(module);
	} catch (_) {}
}

app.whenReady()
	.then(createWindow)
	.then(() => {});

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
