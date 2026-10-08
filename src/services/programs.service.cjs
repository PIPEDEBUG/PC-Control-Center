const { execFile } = require("node:child_process");
const { promisify } = require("node:util");

const execFileAsync = promisify(execFile);

function convertEstimatedSize(size) {
    const value = Number(size);

    if (!Number.isFinite(value) || value <= 0) {
        return null;
    }

    // EstimatedSize viene expresado en KB.
    return Number((value / 1024).toFixed(2));
}

function formatInstallDate(date) {
    if (!date) {
        return null;
    }

    const value = String(date).trim();

    if (!/^\d{8}$/.test(value)) {
        return value;
    }

    const year = value.substring(0, 4);
    const month = value.substring(4, 6);
    const day = value.substring(6, 8);

    return `${day}/${month}/${year}`;
}

async function getInstalledPrograms() {
    console.log(
        "[PROGRAMS] Consultando programas instalados..."
    );

    const script = `
$ErrorActionPreference = "Stop"

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$paths = @(
    "Registry::HKEY_LOCAL_MACHINE\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*",
    "Registry::HKEY_LOCAL_MACHINE\\Software\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*",
    "Registry::HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*"
)

$programs = foreach ($path in $paths) {

    Get-ItemProperty -Path $path -ErrorAction SilentlyContinue |
        Where-Object {
            $_.DisplayName -and
            $_.SystemComponent -ne 1 -and
            -not $_.ParentKeyName
        } |
        ForEach-Object {

            [PSCustomObject]@{
                name = $_.DisplayName
                version = $_.DisplayVersion
                publisher = $_.Publisher
                installDate = $_.InstallDate
                estimatedSize = $_.EstimatedSize
            }
        }
}

$programs |
    Sort-Object -Property name -Unique |
    ConvertTo-Json -Depth 4 -Compress
`;

    try {
        const { stdout, stderr } =
            await execFileAsync(
                "powershell.exe",
                [
                    "-NoLogo",
                    "-NoProfile",
                    "-NonInteractive",
                    "-Command",
                    script,
                ],
                {
                    encoding: "utf8",
                    windowsHide: true,
                    maxBuffer:
                        10 * 1024 * 1024,
                }
            );

        if (stderr && stderr.trim()) {
            console.warn(
                "[PROGRAMS] PowerShell stderr:",
                stderr
            );
        }

        const output =
            stdout.trim();

        console.log(
            "[PROGRAMS] PowerShell respondió."
        );

        if (!output) {
            console.log(
                "[PROGRAMS] No se encontraron programas."
            );

            return [];
        }

        let parsed;

        try {
            parsed = JSON.parse(output);
        } catch (jsonError) {
            console.error(
                "[PROGRAMS] JSON recibido:",
                output
            );

            throw new Error(
                "PowerShell devolvió información que no pudo interpretarse como JSON."
            );
        }

        const programs =
            Array.isArray(parsed)
                ? parsed
                : [parsed];

        const formattedPrograms =
            programs
                .filter(
                    (program) =>
                        program &&
                        program.name
                )
                .map((program) => ({
                    name:
                        String(
                            program.name
                        ).trim(),

                    version:
                        program.version
                            ? String(
                                  program.version
                              ).trim()
                            : "No disponible",

                    publisher:
                        program.publisher
                            ? String(
                                  program.publisher
                              ).trim()
                            : "No disponible",

                    installDate:
                        formatInstallDate(
                            program.installDate
                        ),

                    estimatedSizeMB:
                        convertEstimatedSize(
                            program.estimatedSize
                        ),
                }));

        console.log(
            `[PROGRAMS] ${formattedPrograms.length} programas encontrados.`
        );

        return formattedPrograms;

    } catch (error) {
        console.error(
            "[PROGRAMS] ERROR:",
            error
        );

        if (error.stderr) {
            console.error(
                "[PROGRAMS] STDERR:",
                error.stderr
            );
        }

        if (error.stdout) {
            console.error(
                "[PROGRAMS] STDOUT:",
                error.stdout
            );
        }

        throw new Error(
            `No fue posible obtener los programas instalados: ${error.message}`
        );
    }
}

module.exports = {
    getInstalledPrograms,
};