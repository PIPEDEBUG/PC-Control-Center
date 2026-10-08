document.addEventListener("DOMContentLoaded", () => {
    const loading = document.getElementById("loading");
    const dashboard = document.getElementById("dashboard");
    const errorMessage = document.getElementById("errorMessage");
    const refreshButton = document.getElementById("refreshButton");


    function getElement(id) {
        const element = document.getElementById(id);

        if (!element) {
            throw new Error(
                `No se encontró el elemento HTML con id="${id}"`
            );
        }

        return element;
    }

    function bytesToGB(bytes) {
        const value = Number(bytes);

        if (!Number.isFinite(value) || value <= 0) {
            return "0.00";
        }

        return (
            value /
            1024 /
            1024 /
            1024
        ).toFixed(2);
    }

    function calculatePercentage(used, total) {
        const usedValue = Number(used);
        const totalValue = Number(total);

        if (
            !Number.isFinite(usedValue) ||
            !Number.isFinite(totalValue) ||
            totalValue <= 0
        ) {
            return 0;
        }

        return Math.round(
            (usedValue / totalValue) * 100
        );
    }



    function displayCPU(cpu) {
        const manufacturer =
            cpu?.manufacturer || "";

        const brand =
            cpu?.brand || "No disponible";

        getElement("cpuName").textContent =
            `${manufacturer} ${brand}`.trim();

        getElement("cpuCores").textContent =
            `${cpu?.physicalCores ?? 0} núcleos / ${cpu?.logicalCores ?? 0} hilos`;

        getElement("cpuSpeed").textContent =
            cpu?.speed
                ? `${cpu.speed} GHz`
                : "Frecuencia no disponible";
    }


    function displayMemory(memory) {
        const total =
            Number(memory?.total) || 0;

        const used =
            Number(memory?.used) || 0;

        const percentage =
            calculatePercentage(
                used,
                total
            );

        getElement("ramTotal").textContent =
            `${bytesToGB(total)} GB`;

        getElement("ramUsed").textContent =
            `${bytesToGB(used)} GB utilizados`;

        getElement("ramPercentage").textContent =
            `${percentage}%`;

        getElement("ramProgress").style.width =
            `${Math.min(percentage, 100)}%`;
    }


    function displayGPU(gpu) {
        getElement("gpuName").textContent =
            gpu?.model ||
            "No disponible";

        getElement("gpuVendor").textContent =
            gpu?.vendor ||
            "No disponible";

        const vram =
            Number(gpu?.vram) || 0;

        if (vram > 0) {
            getElement("gpuVram").textContent =
                `${(vram / 1024).toFixed(1)} GB VRAM`;
        } else {
            getElement("gpuVram").textContent =
                "VRAM no disponible";
        }
    }



    function displayOperatingSystem(os) {
        getElement("osName").textContent =
            os?.name ||
            "Windows";

        getElement("osBuild").textContent =
            os?.build
                ? `Build ${os.build}`
                : "Build no disponible";

        getElement("osArch").textContent =
            os?.architecture ||
            "No disponible";
    }



    function displayComputer(
        computer,
        motherboard
    ) {
        getElement(
            "pcManufacturer"
        ).textContent =
            computer?.manufacturer ||
            "No disponible";

        getElement(
            "pcModel"
        ).textContent =
            computer?.model ||
            "No disponible";

        const boardManufacturer =
            motherboard?.manufacturer || "";

        const boardModel =
            motherboard?.model || "";

        getElement(
            "motherboard"
        ).textContent =
            `${boardManufacturer} ${boardModel}`.trim() ||
            "No disponible";
    }



    function displayDisks(disks) {
        const container =
            getElement("diskList");

        container.innerHTML = "";

        if (
            !Array.isArray(disks) ||
            disks.length === 0
        ) {
            container.textContent =
                "No se encontraron unidades.";

            return;
        }

        disks.forEach((disk) => {
            const diskContainer =
                document.createElement("div");

            diskContainer.className =
                "disk";

            // Encabezado

            const header =
                document.createElement("div");

            header.className =
                "disk-header";

            const name =
                document.createElement("span");

            name.className =
                "disk-name";

            name.textContent =
                `Unidad ${disk.mount || "?"}`;

            const space =
                document.createElement("span");

            space.className =
                "disk-space";

            space.textContent =
                `${bytesToGB(disk.used)} GB de ${bytesToGB(disk.size)} GB`;

            header.appendChild(name);
            header.appendChild(space);

            // Barra

            const progress =
                document.createElement("div");

            progress.className =
                "progress";

            const progressBar =
                document.createElement("div");

            progressBar.className =
                "progress-bar";

            const usage =
                Math.min(
                    Math.max(
                        Number(disk.usage) || 0,
                        0
                    ),
                    100
                );

            progressBar.style.width =
                `${usage}%`;

            progress.appendChild(
                progressBar
            );

            diskContainer.appendChild(
                header
            );

            diskContainer.appendChild(
                progress
            );

            container.appendChild(
                diskContainer
            );
        });
    }



    async function loadSystemInformation() {
        console.log(
            "[DASHBOARD] Actualizando información..."
        );

        try {
            loading.textContent =
                "Obteniendo información del computador...";

            loading.classList.remove(
                "hidden"
            );

            dashboard.classList.add(
                "hidden"
            );

            errorMessage.classList.add(
                "hidden"
            );

            refreshButton.disabled =
                true;

            if (!window.pcAPI) {
                throw new Error(
                    "pcAPI no está disponible."
                );
            }

            const information =
                await window.pcAPI.getSystemInfo();

            console.log(
                "[DASHBOARD] Datos recibidos:",
                information
            );

            displayCPU(
                information.cpu
            );

            displayMemory(
                information.memory
            );

            displayGPU(
                information.gpu
            );

            displayOperatingSystem(
                information.operatingSystem
            );

            displayComputer(
                information.computer,
                information.motherboard
            );

            displayDisks(
                information.disks
            );

            loading.classList.add(
                "hidden"
            );

            dashboard.classList.remove(
                "hidden"
            );

            console.log(
                "[DASHBOARD] Información mostrada."
            );

        } catch (error) {
            console.error(
                "[DASHBOARD] ERROR:",
                error
            );

            loading.classList.add(
                "hidden"
            );

            dashboard.classList.add(
                "hidden"
            );

            errorMessage.textContent =
                `Error: ${error.message}`;

            errorMessage.classList.remove(
                "hidden"
            );

        } finally {
            refreshButton.disabled =
                false;
        }
    }


    refreshButton.addEventListener(
        "click",
        () => {
            loadSystemInformation();
        }
    );

    const navigationButtons =
    document.querySelectorAll(
        ".nav-item[data-page]"
    );

    const pages =
        document.querySelectorAll(
            ".page"
        );

    const refreshProgramsButton =
        document.getElementById(
            "refreshProgramsButton"
        );

    const programSearch =
        document.getElementById(
            "programSearch"
        );

    const programList =
        document.getElementById(
            "programList"
        );

    const programCount =
        document.getElementById(
            "programCount"
        );

    const programsLoading =
        document.getElementById(
            "programsLoading"
        );

    const programsError =
        document.getElementById(
            "programsError"
        );

    let installedPrograms = [];

    let programsLoaded = false;

    function navigateTo(pageName) {
        pages.forEach((page) => {
            page.classList.remove(
                "active-page"
            );
        });

        navigationButtons.forEach(
            (button) => {
                button.classList.remove(
                    "active"
                );
            }
        );

        const targetPage =
            document.getElementById(
                `page-${pageName}`
            );

        const targetButton =
            document.querySelector(
                `.nav-item[data-page="${pageName}"]`
            );

        if (!targetPage) {
            console.error(
                `No existe page-${pageName}`
            );

            return;
        }

        targetPage.classList.add(
            "active-page"
        );

        if (targetButton) {
            targetButton.classList.add(
                "active"
            );
        }

        if (
            pageName === "programs" &&
            !programsLoaded
        ) {
            loadInstalledPrograms();
        }
    }

    navigationButtons.forEach(
        (button) => {
            button.addEventListener(
                "click",
                () => {
                    navigateTo(
                        button.dataset.page
                    );
                }
            );
        }
    );

    function renderPrograms(programs) {
        programList.innerHTML = "";

        programCount.textContent =
            `${programs.length} ${
                programs.length === 1
                    ? "programa"
                    : "programas"
            }`;

        if (programs.length === 0) {
            const empty =
                document.createElement("div");

            empty.className =
                "empty-state";

            empty.textContent =
                "No se encontraron programas.";

            programList.appendChild(
                empty
            );

            return;
        }

        programs.forEach((program) => {
            const item =
                document.createElement("article");

            item.className =
                "program-item";


            const info =
                document.createElement("div");

            info.className =
                "program-info";


            const name =
                document.createElement("div");

            name.className =
                "program-name";

            name.textContent =
                program.name;


            const metadata =
                document.createElement("div");

            metadata.className =
                "program-metadata";


            const publisher =
                document.createElement("span");

            publisher.textContent =
                program.publisher;


            const version =
                document.createElement("span");

            version.textContent =
                `Versión: ${program.version}`;


            metadata.appendChild(
                publisher
            );

            metadata.appendChild(
                version
            );


            if (program.installDate) {
                const date =
                    document.createElement(
                        "span"
                    );

                date.textContent =
                    `Instalado: ${program.installDate}`;

                metadata.appendChild(
                    date
                );
            }


            info.appendChild(
                name
            );

            info.appendChild(
                metadata
            );


            const size =
                document.createElement("div");

            size.className =
                "program-size";

            size.textContent =
                program.estimatedSizeMB
                    ? `${program.estimatedSizeMB} MB`
                    : "Tamaño no disponible";


            item.appendChild(
                info
            );

            item.appendChild(
                size
            );

            programList.appendChild(
                item
            );
        });
    }

    async function loadInstalledPrograms() {
        programsLoading.classList.remove(
            "hidden"
        );

        programsError.classList.add(
            "hidden"
        );

        programList.innerHTML = "";

        refreshProgramsButton.disabled =
            true;

        try {
            console.log(
                "[PROGRAMS] Buscando programas..."
            );

            const programs =
                await window.pcAPI.getInstalledPrograms();

            installedPrograms =
                Array.isArray(programs)
                    ? programs
                    : [];

            programsLoaded = true;

            renderPrograms(
                installedPrograms
            );

            console.log(
                `[PROGRAMS] ${installedPrograms.length} programas cargados`
            );

        } catch (error) {
            console.error(
                "[PROGRAMS] Error:",
                error
            );

            programsError.textContent =
                `Error: ${error.message}`;

            programsError.classList.remove(
                "hidden"
            );

        } finally {
            programsLoading.classList.add(
                "hidden"
            );

            refreshProgramsButton.disabled =
                false;
        }
    }

    refreshProgramsButton.addEventListener(
        "click",
        () => {
            loadInstalledPrograms();
        }
    );

    programSearch.addEventListener(
        "input",
        () => {
            const search =
                programSearch.value
                    .trim()
                    .toLowerCase();

            if (!search) {
                renderPrograms(
                    installedPrograms
                );

                return;
            }

            const filtered =
                installedPrograms.filter(
                    (program) => {
                        return (
                            program.name
                                .toLowerCase()
                                .includes(search) ||

                            program.publisher
                                .toLowerCase()
                                .includes(search)
                        );
                    }
                );

            renderPrograms(filtered);
        }
    );

    loadSystemInformation();
});