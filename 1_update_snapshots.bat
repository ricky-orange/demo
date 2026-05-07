@echo off
setlocal
cd /d "%~dp0"

set "NO_PAUSE="
if /I "%~1"=="/silent" set "NO_PAUSE=1"

if not exist logs mkdir logs
set LOG=logs\update_snapshots.log

echo Updating ETF snapshots...
echo [%date% %time%] Updating ETF snapshots... >> "%LOG%"

python scripts\fetch_etfinfo_holdings.py --output data\snapshots.json --limit 10 >> "%LOG%" 2>&1

if errorlevel 1 (
  echo.
  echo Update failed. See %LOG% for details.
  echo [%date% %time%] Update failed. >> "%LOG%"
  if not defined NO_PAUSE pause
  exit /b 1
)

echo [%date% %time%] Update completed. >> "%LOG%"
echo.
echo Done. data\snapshots.json has been updated.
echo Next step: run 2_publish_to_github.bat
if not defined NO_PAUSE pause
