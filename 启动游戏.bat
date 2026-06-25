@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 goto NODE_MISSING

title Vocabulary Galgame Local Server
node scripts\start-game.js
if errorlevel 1 goto START_FAILED
goto END

:NODE_MISSING
echo Node.js was not found.
echo Install Node.js from https://nodejs.org/ and run this file again.
pause
exit /b 1

:START_FAILED
echo.
echo The game server could not start.
echo Check the error message above.
pause
exit /b 1

:END
endlocal
