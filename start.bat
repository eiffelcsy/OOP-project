@echo off
REM start.bat

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

REM Run docker-compose with all arguments passed to the script
docker-compose %*