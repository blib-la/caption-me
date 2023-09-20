@echo off
echo Starting development server or application...

REM Open a new command prompt and run npm start
start cmd /k "npm start"
if %errorlevel% neq 0 goto :error

REM Wait for a few seconds to allow the server to start
timeout /t 10

REM Open the web browser
start http://127.0.0.1:3000

echo Done!
exit /b 0

:error
echo An error occurred while starting the development server or application.
exit /b 1
