const {
    contextBridge,
    ipcRenderer,
} = require("electron");

console.log(
    "[PRELOAD] preload.cjs cargado"
);

contextBridge.exposeInMainWorld(
    "pcAPI",
    {
        getSystemInfo: () => {
            console.log(
                "[PRELOAD] Solicitando system:getInfo"
            );

            return ipcRenderer.invoke(
                "system:getInfo"
            );
        },

        getInstalledPrograms: () => {
            console.log(
                "[PRELOAD] Solicitando programs:getInstalled"
            );

            return ipcRenderer.invoke(
                "programs:getInstalled"
            );
        },
    }
);