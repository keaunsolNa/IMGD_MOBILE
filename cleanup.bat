@echo off
echo Cleaning up processes...

REM Nginx 프로세스 종료
taskkill /F /IM nginx.exe 2>NUL
if "%ERRORLEVEL%"=="0" (
    echo Nginx processes stopped
) else (
    echo No Nginx processes found
)

REM Node.js/Expo 프로세스 종료 (포트 8081 사용하는 프로세스)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8081') do (
    taskkill /F /PID %%a 2>NUL
)

echo Cleanup completed
