const { app, BrowserWindow, ipcMain, Menu } = require("electron");
const path = require("node:path");
const { getSystemInformation, } = require("./services/system.service.cjs");
const { getInstalledPrograms, } = require("./services/programs.service.cjs");

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1300,
        height: 800,
        minWidth: 1000,
        minHeight: 650,

        webPreferences: {
            preload: path.join(__dirname, "preload.cjs"),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
        },
    });

    mainWindow.loadFile(
        path.join(__dirname, "renderer", "index.html")
    );
}

ipcMain.handle(
    "system:getInfo",
    async () => {
        console.log(
            "[MAIN] Recibida solicitud system:getInfo"
        );

        try {
            const information =
                await getSystemInformation();

            console.log(
                "[MAIN] Información obtenida correctamente"
            );

            return information;

        } catch (error) {
            console.error(
                "[MAIN] Error:",
                error
            );

            throw error;
        }
    }
);

ipcMain.handle(
    "programs:getInstalled",
    async () => {
        console.log(
            "[IPC] Solicitud programs:getInstalled"
        );

        try {
            const programs = await getInstalledPrograms();

            console.log(
                `[IPC] ${programs.length} programas encontrados`
            );
            return programs;
        } catch (error) {
            console.error(
                "[IPC] Error obteniendo programas:",
                error
            );
            throw error;
        }
    }
);

app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    createWindow();

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});
