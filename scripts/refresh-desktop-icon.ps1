# Recreates shortcut and clears stale desktop icon cache (Explorer vs desktop mismatch).
$ErrorActionPreference = 'SilentlyContinue'

$projectRoot = Split-Path -Parent $PSScriptRoot
& (Join-Path $projectRoot 'scripts\create-desktop-shortcut.ps1')

Stop-Process -Name explorer -Force
Start-Sleep -Seconds 2

$explorerCache = Join-Path $env:LOCALAPPDATA 'Microsoft\Windows\Explorer'
Get-ChildItem $explorerCache -Filter 'iconcache*' | Remove-Item -Force
Get-ChildItem $explorerCache -Filter 'thumbcache*' | Remove-Item -Force

$iconDb = Join-Path $env:LOCALAPPDATA 'IconCache.db'
if (Test-Path $iconDb) { Remove-Item $iconDb -Force }

Start-Process explorer.exe
Write-Host 'Done. Desktop icon should match Explorer (purple rocket).'
