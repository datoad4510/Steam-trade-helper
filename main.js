const { app, BrowserWindow } = require("electron");
const path = require("path");
const os = require("os");

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

app.whenReady().then(createWindow);
