@echo off
setlocal EnableExtensions EnableDelayedExpansion
chcp 65001 >nul
cd /d "%~dp0"

title LJ Lab - Dev Server
set "PORT=4321"

echo.
echo  ========================================
echo   LJ Lab 开发服务器
echo  ========================================
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo [错误] 未找到 Node.js，请先安装并加入 PATH。
  echo        本项目需要 Node.js ^>= 22.12.0
  goto :fail
)

where npm >nul 2>&1
if errorlevel 1 (
  echo [错误] 未找到 npm。
  goto :fail
)

if not exist "package.json" (
  echo [错误] 当前目录没有 package.json。
  goto :fail
)

if not exist "node_modules\" (
  echo [信息] 未检测到 node_modules，正在安装依赖...
  call npm install
  if errorlevel 1 (
    echo [错误] npm install 失败。
    goto :fail
  )
  echo.
)

call :ensure_port_free %PORT%
if errorlevel 1 goto :fail

echo [信息] 启动开发服务器（npm run dev）...
echo [信息] 启动后浏览器访问 http://localhost:%PORT%/
echo        按 Ctrl+C 可停止。
echo.

call npm run dev
set "DEV_EXIT=%ERRORLEVEL%"
if not "%DEV_EXIT%"=="0" (
  echo.
  echo [错误] 开发服务器异常退出，退出码 %DEV_EXIT%。
  goto :fail
)

goto :eof

:ensure_port_free
set "TARGET_PORT=%~1"
set "ROUND=0"

:ensure_port_free_loop
set "OCCUPIED_PID="
for /f "tokens=5" %%P in ('netstat -ano 2^>nul ^| findstr /C:":%TARGET_PORT% " ^| findstr /C:"LISTENING"') do (
  if not "%%P"=="0" set "OCCUPIED_PID=%%P"
)

if not defined OCCUPIED_PID (
  if "%ROUND%"=="0" (
    echo [信息] 端口 %TARGET_PORT% 空闲。
  ) else (
    echo [信息] 端口 %TARGET_PORT% 已释放。
  )
  exit /b 0
)

if %ROUND% GEQ 5 (
  echo [错误] 端口 %TARGET_PORT% 仍被 PID %OCCUPIED_PID% 占用，无法释放。
  exit /b 1
)

echo [信息] 端口 %TARGET_PORT% 被 PID %OCCUPIED_PID% 占用，正在结束该进程...
taskkill /F /T /PID %OCCUPIED_PID% >nul 2>&1
if errorlevel 1 (
  echo [错误] 无法结束 PID %OCCUPIED_PID%，请手动关闭占用端口的程序。
  exit /b 1
)

set /a ROUND+=1
ping -n 2 127.0.0.1 >nul
goto :ensure_port_free_loop

:fail
echo.
pause
exit /b 1
