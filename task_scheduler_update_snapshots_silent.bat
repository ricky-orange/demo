@echo off
setlocal
cd /d "%~dp0"

if not exist logs mkdir logs
set LOG=logs\daily_update.log

echo [%date% %time%] Updating ETF snapshots... >> "%LOG%"
python scripts\fetch_etfinfo_holdings.py --output data\snapshots.json --limit 10 >> "%LOG%" 2>&1

if errorlevel 1 (
  echo [%date% %time%] Update failed. >> "%LOG%"
  exit /b 1
)

echo [%date% %time%] Update completed. >> "%LOG%"
exit /b 0
