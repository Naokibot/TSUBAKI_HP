@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo TSUBAKI Tech Portfolio を起動します。
echo.
node --version
if errorlevel 1 (
  echo Node.js が見つかりません。
  pause
  exit /b 1
)
echo.
echo ブラウザで http://localhost:4173 を開いてください。
echo 終了するときは Ctrl+C を押します。
echo.
npm run dev
pause
