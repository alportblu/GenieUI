@echo off

:: Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Node.js is not installed. Please install Node.js first.
    exit /b 1
)

:: Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo npm is not installed. Please install npm first.
    exit /b 1
)

:: Install dependencies if node_modules doesn't exist
if not exist "node_modules\" (
    echo Installing dependencies...
    npm install
)

:: Build the project
echo Building the project...
npm run build

:: Start the server
echo Starting the server...
npm run start 