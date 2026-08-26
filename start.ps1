# 一键启动《宁可慢一点》竞赛演示环境
# 主站 :3005 | AR :3006 | Journiv 默认跳过
param(
    [switch]$SkipDocker,
    [switch]$SkipAr
)

$ErrorActionPreference = "Stop"
$WebRoot = $PSScriptRoot

# 竞赛包默认不启日记后端，避免干扰 5 分钟演示
if (-not $PSBoundParameters.ContainsKey("SkipDocker")) {
    $SkipDocker = $true
}

function Test-Command($Name) {
    return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

function Start-DevWindow([string]$Title, [string]$Command) {
    Start-Process powershell -ArgumentList @(
        "-NoExit",
        "-Command",
        "`$Host.UI.RawUI.WindowTitle = '$Title'; $Command"
    ) | Out-Null
}

Write-Host "宁可慢一点 · 讲好中国故事 演示启动" -ForegroundColor Cyan
Write-Host "  Web root: $WebRoot"
Write-Host ""

if (-not (Test-Path (Join-Path $WebRoot "node_modules"))) {
    Write-Host "Installing web dependencies..." -ForegroundColor Yellow
    Push-Location $WebRoot
    try {
        npm install
    }
    finally {
        Pop-Location
    }
}

if (-not $SkipAr -and -not (Test-Path (Join-Path $WebRoot "AR\node_modules"))) {
    Write-Host "Installing AR dependencies..." -ForegroundColor Yellow
    Push-Location (Join-Path $WebRoot "AR")
    try {
        npm install --ignore-scripts
    }
    finally {
        Pop-Location
    }
}

if (-not $SkipDocker) {
    if (Test-Command "docker") {
        $ComposeFile = Join-Path $WebRoot "docker-compose.journiv.yml"
        Write-Host "Starting Journiv (Docker) on http://localhost:8000 ..." -ForegroundColor Green
        Start-DevWindow "Slow Down - Journiv" "Set-Location '$WebRoot'; docker compose -f '$ComposeFile' up"
    }
    else {
        Write-Host "Docker not found — skipping Journiv. Use -SkipDocker to hide this message." -ForegroundColor Yellow
    }
}

if (-not $SkipAr) {
    Write-Host "Starting AR dev server on http://localhost:3006 ..." -ForegroundColor Green
    Start-DevWindow "Slow Down - AR" "Set-Location '$WebRoot\AR'; npm run dev"
}

Write-Host "Starting Next.js on http://localhost:3005 ..." -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C in this window to stop the main site." -ForegroundColor DarkGray

Push-Location $WebRoot
try {
    npm run dev
}
finally {
    Pop-Location
}
