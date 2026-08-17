@echo off
title Seher Agent
cd /d "%~dp0"
echo Starting Seher Agent...
npx next dev -p 3000
pause
