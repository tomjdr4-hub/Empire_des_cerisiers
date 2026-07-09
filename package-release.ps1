$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$sys = Join-Path $root "foundry-system"
$staging = Join-Path $env:TEMP "edc-release-staging"

if (Test-Path $staging) { Remove-Item $staging -Recurse -Force }
New-Item -ItemType Directory -Path $staging | Out-Null

$include = @("system.json", "module", "templates", "styles", "lang", "packs", "README.md")
foreach ($item in $include) {
    $src = Join-Path $sys $item
    if (Test-Path $src) {
        Copy-Item -Path $src -Destination $staging -Recurse
    }
}

$sourceDir = Join-Path $staging "packs\_source"
if (Test-Path $sourceDir) { Remove-Item $sourceDir -Recurse -Force }

$zipPath = Join-Path $root "system.zip"
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
Compress-Archive -Path (Join-Path $staging "*") -DestinationPath $zipPath -Force

Write-Output $zipPath
