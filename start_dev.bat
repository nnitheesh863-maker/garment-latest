@echo off
start "Garments-Backend" cmd /c "cd /d "%~dp0backend" && npm run dev"
start "Garments-Frontend" cmd /c "cd /d "%~dp0frontend" && npm run dev"
echo Both servers starting...
