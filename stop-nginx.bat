@echo off
echo Stopping Nginx...

REM Nginx 프로세스 종료
taskkill /F /IM nginx.exe 2>NUL
if "%ERRORLEVEL%"=="0" (
    echo Nginx stopped successfully
) else (
    echo Nginx was not running or already stopped
)

echo Nginx shutdown completed
