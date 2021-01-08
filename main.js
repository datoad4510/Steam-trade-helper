const { app, BrowserWindow } = require("electron");
const path = require("path");
const convertCsvToXlsx = require("@aternus/csv-to-xlsx");
//app.commandLine.appendSwitch("disable-features", "OutOfBlinkCors");
function createWindow() {
	const win = new BrowserWindow({
		width: 1200,
		height: 800,
		backgroundColor: "white",
		webPreferences: {
			nodeIntegration: true,
			worldSafeExecuteJavaScript: true,
			contextIsolation: false,
			preload: path.join(__dirname, "preload.js"),
		},
	});

	win.loadFile("index.html");
	try {
		//require("electron-reloader")(module);
	} catch (_) {}
}
app.whenReady().then(createWindow);
