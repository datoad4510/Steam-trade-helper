const { app, BrowserWindow } = require("electron");
const path = require("path");
const convertCsvToXlsx = require("@aternus/csv-to-xlsx");
//app.commandLine.appendSwitch("disable-features", "OutOfBlinkCors");
// Menu.setApplicationMenu(null);
let wind;
function createWindow() {
	const mainWindow = new BrowserWindow({
		width: 800,
		height: 600,
		autoHideMenuBar: true,
		backgroundColor: "white",
		webPreferences: {
			nodeIntegration: true,
			worldSafeExecuteJavaScript: true,
			contextIsolation: false,
			preload: path.join(__dirname, "preload.js"),
		},
	});
	mainWindow.loadFile("index.html");
	mainWindow.webContents.openDevTools({ mode: "detach" });
	try {
		// require("electron-reloader")(module);
	} catch (_) {}
}
app.whenReady().then(createWindow);
