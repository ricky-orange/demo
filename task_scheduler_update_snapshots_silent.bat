@echo off
setlocal
cd /d "%~dp0"

if not exist logs mkdir logs
set LOG=logs\scheduled_daily_update.log

echo ================================================== >> "%LOG%"
echo [%date% %time%] Scheduled daily update started. >> "%LOG%"
echo ================================================== >> "%LOG%"

echo [%date% %time%] Step 1: update snapshots. >> "%LOG%"
call "%~dp01_update_snapshots.bat" /silent >> "%LOG%" 2>&1

if errorlevel 1 (
  echo [%date% %time%] Step 1 failed. Publish was not run. >> "%LOG%"
  exit /b 1
)

echo [%date% %time%] Step 2: publish to GitHub. >> "%LOG%"
call "%~dp02_publish_to_github.bat" /silent >> "%LOG%" 2>&1

if errorlevel 1 (
  echo [%date% %time%] Step 2 failed. >> "%LOG%"
  exit /b 1
)

echo [%date% %time%] Scheduled daily update completed. >> "%LOG%"
exit /b 0
