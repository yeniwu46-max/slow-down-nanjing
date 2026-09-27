[CmdletBinding()]
param(
    [switch]$ForceDownload,
    [switch]$StartServices,
    [switch]$IncludeTools
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$sourceDir = Join-Path $projectRoot "integrations/data/source"
$sharedDir = Join-Path $projectRoot "integrations/data/shared"
$valhallaDir = Join-Path $projectRoot "integrations/data/valhalla"
$graphhopperDir = Join-Path $projectRoot "integrations/data/graphhopper"
$chinaPbf = Join-Path $sourceDir "china-latest.osm.pbf"
$nanjingPbf = Join-Path $sharedDir "nanjing.osm.pbf"
$composeFile = Join-Path $projectRoot "docker-compose.competition.yml"

$chinaUrl = "https://download.geofabrik.de/asia/china-latest.osm.pbf"
$chinaMd5Url = "$chinaUrl.md5"
$nanjingBoundingBox = "118.45,31.85,119.15,32.35"

foreach ($directory in @($sourceDir, $sharedDir, $valhallaDir, $graphhopperDir)) {
    New-Item -ItemType Directory -Force -Path $directory | Out-Null
}

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw "Docker CLI is required to build the reproducible routing data."
}

$ErrorActionPreference = "Continue"
docker info 2>$null | Out-Null
$dockerInfoExitCode = $LASTEXITCODE
$ErrorActionPreference = "Stop"
if ($dockerInfoExitCode -ne 0) {
    throw "Docker Desktop is not running. Start it, then rerun npm run setup:routing."
}

if ($ForceDownload -or -not (Test-Path -LiteralPath $chinaPbf)) {
    Write-Host "Downloading the Geofabrik China OSM extract..."
    Invoke-WebRequest -UseBasicParsing -Uri $chinaUrl -OutFile $chinaPbf
}

Write-Host "Verifying the source OSM checksum..."
$checksumText = (Invoke-WebRequest -UseBasicParsing -Uri $chinaMd5Url).Content.Trim()
$expectedMd5 = ($checksumText -split "\s+")[0].ToUpperInvariant()
$actualMd5 = (Get-FileHash -Algorithm MD5 -LiteralPath $chinaPbf).Hash.ToUpperInvariant()
if ($expectedMd5 -ne $actualMd5) {
    throw "China OSM checksum mismatch. Expected $expectedMd5 but received $actualMd5."
}

Write-Host "Building the pinned osmium-tool extractor..."
docker build --tag slowdown-osmium:1.15.0 (Join-Path $projectRoot "integrations/osmium")
if ($LASTEXITCODE -ne 0) { throw "Failed to build the osmium-tool image." }

$dockerSourceDir = $sourceDir.Replace("\", "/")
$dockerSharedDir = $sharedDir.Replace("\", "/")
Write-Host "Clipping one shared Nanjing PBF with complete ways..."
docker run --rm `
    --volume "${dockerSourceDir}:/source:ro" `
    --volume "${dockerSharedDir}:/output" `
    slowdown-osmium:1.15.0 `
    extract --bbox=$nanjingBoundingBox --strategy=complete_ways --overwrite `
    --output=/output/nanjing.osm.pbf /source/china-latest.osm.pbf
if ($LASTEXITCODE -ne 0) { throw "Failed to clip the Nanjing OSM extract." }

Copy-Item -Force -LiteralPath $nanjingPbf -Destination (Join-Path $valhallaDir "nanjing.osm.pbf")
Copy-Item -Force -LiteralPath $nanjingPbf -Destination (Join-Path $graphhopperDir "nanjing.osm.pbf")

Write-Host "Nanjing OSM data is ready for Valhalla and GraphHopper."

if ($StartServices) {
    $composeArguments = @("compose", "--file", $composeFile)
    if ($IncludeTools) { $composeArguments += @("--profile", "tools") }
    $composeArguments += @("up", "--detach", "--build")
    & docker @composeArguments
    if ($LASTEXITCODE -ne 0) { throw "The optional routing services did not start." }
}
