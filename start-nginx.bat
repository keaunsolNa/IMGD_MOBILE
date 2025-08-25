@echo off
echo Starting Nginx...

REM 기존 Nginx 프로세스 모두 종료
taskkill /F /IM nginx.exe 2>NUL
if "%ERRORLEVEL%"=="0" (
    echo Existing Nginx processes stopped
    timeout /t 2 /nobreak >nul
)

REM Nginx 시작 (절대 경로 사용)
cd /d "C:\nginx-1.26.3\nginx-1.26.3"
if not exist "nginx.exe" (
    echo Error: nginx.exe not found at C:\nginx-1.26.3\nginx-1.26.3\nginx.exe
    exit /b 1
)

start /B nginx.exe
if "%ERRORLEVEL%"=="0" (
    echo Nginx started successfully
) else (
    echo Failed to start Nginx
    exit /b 1
)

REM 잠시 대기
timeout /t 2 /nobreak >nul

echo Nginx startup completed
