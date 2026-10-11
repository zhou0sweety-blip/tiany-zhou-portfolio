@echo off
chcp 65001 >nul
cd /d "%~dp0"

set "PORT=5273"

where node >nul 2>nul
if "%errorlevel%"=="0" goto HAVE
set "NODE=C:\Users\Admin.WWP-SH-001\.workbuddy\binaries\node\versions\22.22.2-3\node.exe"
if exist "%NODE%" goto OK

echo.
echo   [X] 没找到 Node.js
echo.
echo   请先安装 Node.js LTS:  https://nodejs.org
echo   安装完成后重新双击本文件即可。
echo.
pause
exit /b 1

:HAVE
set "NODE=node"

:OK
echo.
echo   素材替换后台正在启动...
echo   后台地址  http://127.0.0.1:%PORT%/
echo   站点预览  http://127.0.0.1:%PORT%/site/index.html
echo.
echo   停止服务: 在本窗口按 Ctrl+C，或直接关闭本窗口。
echo.

start "" /B powershell -NoProfile -Command "Start-Sleep -Seconds 2; Start-Process 'http://127.0.0.1:%PORT%/'"

"%NODE%" server.js %PORT%
pause
