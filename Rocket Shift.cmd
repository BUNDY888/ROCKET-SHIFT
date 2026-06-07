@echo off
set "PATH=C:\Program Files\nodejs;%PATH%"
cd /d "%~dp0"
set "EXE=%~dp0release\win-unpacked\Rocket Shift.exe"
if exist "%EXE%" (
  start "" "%EXE%"
) else (
  start "" npm run dev
)
