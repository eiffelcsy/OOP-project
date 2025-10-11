@echo off
REM start.bat - Enhanced script with development mode support

REM Function to show usage
if "%1"=="help" goto :show_usage
if "%1"=="--help" goto :show_usage
if "%1"=="-h" goto :show_usage

REM Load environment variables from .env.frontend
if exist .env.frontend (
    for /f "usebackq tokens=*" %%a in (".env.frontend") do (
        REM Skip empty lines and comments
        echo %%a | findstr /r "^[^#]" >nul
        if not errorlevel 1 (
            REM Set the environment variable
            set %%a
        )
    )
) else (
    echo .env.frontend file not found
    exit /b 1
)

REM Default to development mode
set MODE=dev
set COMPOSE_FILE=docker-compose.dev.yml

REM Check if first argument is a mode
if "%1"=="dev" (
    set MODE=dev
    set COMPOSE_FILE=docker-compose.dev.yml
    shift
    goto :run_command
) else if "%1"=="prod" (
    set MODE=prod
    set COMPOSE_FILE=docker-compose.yml
    shift
    goto :run_command
)

REM If no command provided, show usage
if "%1"=="" goto :show_usage

:run_command
REM If still no command after shift, show usage
if "%1"=="" goto :show_usage

echo Running in %MODE% mode...
echo Using compose file: %COMPOSE_FILE%
echo.

REM Run docker-compose with the selected file and remaining arguments
docker-compose -f %COMPOSE_FILE% %1 %2 %3 %4 %5 %6 %7 %8 %9
exit /b 0

:show_usage
echo Usage: start.bat [MODE] [COMMAND]
echo.
echo Modes:
echo   dev     - Development mode with hot-reload (default)
echo   prod    - Production mode
echo.
echo Commands:
echo   build   - Build containers
echo   up      - Start containers (add -d for detached mode)
echo   down    - Stop and remove containers
echo   logs    - View container logs (add -f to follow)
echo   restart - Restart containers
echo.
echo Examples:
echo   start.bat dev up -d        # Start development mode in background
echo   start.bat prod build       # Build production containers
echo   start.bat dev logs -f      # Follow development logs
echo.
exit /b 0
