@echo off
echo === Start of batch script ===
echo.

echo Installing npm packages...
call npm install
if %errorlevel% neq 0 goto :error
echo NPM install complete.
echo.

echo Building project...
call npm run build
if %errorlevel% neq 0 goto :error
echo NPM build complete.
echo.

echo === End of batch script ===
pause
exit /b 0

:error
echo An error occurred during the process.
pause
exit /b 1
