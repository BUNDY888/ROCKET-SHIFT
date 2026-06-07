$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$toolsDir = Join-Path $root '.tools'
$mingitDir = Join-Path $toolsDir 'MinGit'
$gitExe = Join-Path $mingitDir 'cmd\git.exe'

if (Test-Path $gitExe) {
  Write-Output $gitExe
  exit 0
}

$zipUrl = 'https://github.com/git-for-windows/git/releases/download/v2.47.1.windows.1/MinGit-2.47.1-64-bit.zip'
$zipPath = Join-Path $toolsDir 'MinGit.zip'

New-Item -ItemType Directory -Force -Path $toolsDir | Out-Null
Write-Host "Downloading MinGit..."
Invoke-WebRequest -Uri $zipUrl -OutFile $zipPath -UseBasicParsing
Expand-Archive -Path $zipPath -DestinationPath $mingitDir -Force
Remove-Item $zipPath -Force

if (-not (Test-Path $gitExe)) {
  throw "MinGit install failed: $gitExe not found"
}

Write-Output $gitExe
