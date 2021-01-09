const { app, BrowserWindow, webContents } = require("electron");
const path = require("path");
const convertCsvToXlsx = require("@aternus/csv-to-xlsx");
//app.commandLine.appendSwitch("disable-features", "OutOfBlinkCors");
// Menu.setApplicationMenu(null);

function createWindow() {
	const window = new BrowserWindow({
		width: 800,
		height: 700,
		title: "Hydra",
		icon: "icon/hydra1.png",
		autoHideMenuBar: true,
		backgroundColor: "white",
		webPreferences: {
			nodeIntegration: true,
			worldSafeExecuteJavaScript: true,
			contextIsolation: false,
			preload: path.join(__dirname, "preload.js"),
		},
	});
	window.loadFile("index.html");
	// window.webContents.openDevTools({ mode: "right" });

	let devtools = new BrowserWindow({
		autoHideMenuBar: true,
		title: "Console",
		icon: "icon/hydra1.png",
	});
	window.webContents.setDevToolsWebContents(devtools.webContents);
	window.webContents.openDevTools({ mode: "detach" });

	// Set the devtools position when the parent window has finished loading.
	window.webContents.once("did-finish-load", function () {
		var windowBounds = window.getBounds();
		devtools.setPosition(
			windowBounds.x + windowBounds.width,
			windowBounds.y
		);
	});

	// Set the devtools position when the parent window is moved.
	window.on("move", function () {
		var windowBounds = window.getBounds();
		devtools.setPosition(
			windowBounds.x + windowBounds.width,
			windowBounds.y
		);
	});
	try {
		// require("electron-reloader")(module);
	} catch (_) {}
}
app.whenReady().then(createWindow);
