$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Locate Java
$JavaCmd = "java"
if (-not (Get-Command "java" -ErrorAction SilentlyContinue)) {
    $Adoptium = "C:\Program Files\Eclipse Adoptium\jdk-21.0.11.10-hotspot\bin\java.exe"
    if (Test-Path $Adoptium) {
        $JavaCmd = $Adoptium
    }
}

Push-Location $ScriptDir
try {
    Write-Host "Uruchamianie silnika GraphHopper na porcie 8989..." -ForegroundColor Cyan
    & $JavaCmd -Xmx2g -Xms1g -jar "graphhopper-web.jar" server "config-local.yml"
} finally {
    Pop-Location
}
