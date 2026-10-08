const si = require("systeminformation");

async function queryWithTimeout(
    name,
    query,
    fallback,
    timeout = 15000
) {
    let timer;

    try {
        const timeoutPromise =
            new Promise((resolve) => {
                timer = setTimeout(() => {
                    console.warn(
                        `[TIMEOUT] ${name} tardó más de ${timeout} ms`
                    );

                    resolve(fallback);
                }, timeout);
            });

        const queryPromise =
            query()
                .then((result) => {
                    console.log(`[OK] ${name}`);
                    return result;
                })
                .catch((error) => {
                    console.error(
                        `[ERROR] ${name}:`,
                        error
                    );

                    return fallback;
                });

        const result =
            await Promise.race([
                queryPromise,
                timeoutPromise,
            ]);

        return result;

    } finally {
        clearTimeout(timer);
    }
}

async function getSystemInformation() {
    console.log("=== Consultando información del PC ===");

    const [
        system,
        osInfo,
        cpu,
        memory,
        graphics,
        baseboard,
        disks,
    ] = await Promise.all([
        queryWithTimeout(
            "Sistema",
            () => si.system(),
            {},
            20000
        ),

        queryWithTimeout(
            "Sistema operativo",
            () => si.osInfo(),
            {}
        ),

        queryWithTimeout(
            "CPU",
            () => si.cpu(),
            {},
            20000
        ),

        queryWithTimeout(
            "RAM",
            () => si.mem(),
            {}
        ),

        queryWithTimeout(
            "GPU",
            () => si.graphics(),
            { controllers: [] },
            10000
        ),

        queryWithTimeout(
            "Placa madre",
            () => si.baseboard(),
            {}
        ),

        queryWithTimeout(
            "Discos",
            () => si.fsSize(),
            []
        ),
    ]);

    console.log("=== Consultas finalizadas ===");

    const gpu =
        graphics.controllers?.[0] || {};

    const formattedDisks = Array.isArray(disks)
        ? disks.map((disk) => ({
              mount:
                  disk.mount ||
                  disk.fs ||
                  "No disponible",

              type:
                  disk.type ||
                  "No disponible",

              size:
                  disk.size || 0,

              used:
                  disk.used || 0,

              available:
                  disk.available || 0,

              usage:
                  disk.use || 0,
          }))
        : [];

    return {
        computer: {
            manufacturer:
                system.manufacturer ||
                "No disponible",

            model:
                system.model ||
                "No disponible",
        },

        operatingSystem: {
            name:
                osInfo.distro ||
                "Windows",

            release:
                osInfo.release ||
                "No disponible",

            build:
                osInfo.build ||
                "No disponible",

            architecture:
                osInfo.arch ||
                "No disponible",
        },

        cpu: {
            manufacturer:
                cpu.manufacturer ||
                "No disponible",

            brand:
                cpu.brand ||
                "No disponible",

            physicalCores:
                cpu.physicalCores ||
                0,

            logicalCores:
                cpu.cores ||
                0,

            speed:
                cpu.speed ||
                0,
        },

        memory: {
            total:
                memory.total ||
                0,

            used:
                memory.active ||
                memory.used ||
                0,

            available:
                memory.available ||
                0,
        },

        gpu: {
            vendor:
                gpu.vendor ||
                "No disponible",

            model:
                gpu.model ||
                "No disponible",

            vram:
                gpu.vram ||
                0,
        },

        motherboard: {
            manufacturer:
                baseboard.manufacturer ||
                "No disponible",

            model:
                baseboard.model ||
                "No disponible",
        },

        disks:
            formattedDisks,
    };
}

module.exports = {
    getSystemInformation,
};