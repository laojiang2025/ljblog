@echo off
setlocal EnableExtensions
chcp 65001 >nul
cd /d "%~dp0"

title LJ Lab - Dev Server

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

echo [信息] 启动开发服务器（npm run dev）...
echo [信息] 启动后浏览器访问 http://localhost:4321/
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

:fail
echo.
pause
exit /b 1
