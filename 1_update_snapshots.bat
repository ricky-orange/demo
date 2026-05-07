@echo off
setlocal
cd /d "%~dp0"

set "NO_PAUSE="
if /I "%~1"=="/silent" set "NO_PAUSE=1"

if not exist logs mkdir logs
if not exist backups mkdir backups
set LOG=logs\update_snapshots.log
for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format yyyyMMdd_HHmmss"') do set "STAMP=%%i"

echo Updating ETF snapshots...
echo [%date% %time%] Updating ETF snapshots... >> "%LOG%"

if exist data\snapshots.json (
  copy /Y data\snapshots.json "backups\snapshots.before_%STAMP%.json" > nul
  echo Backup before update: backups\snapshots.before_%STAMP%.json
  echo [%date% %time%] Backup before update: backups\snapshots.before_%STAMP%.json >> "%LOG%"
)

python scripts\fetch_etfinfo_holdings.py --output data\snapshots.json --limit 10 >> "%LOG%" 2>&1

if errorlevel 1 (
  echo.
  echo Update failed. See %LOG% for details.
  echo Existing data\snapshots.json was kept. Backup is in the backups folder.
  echo [%date% %time%] Update failed. >> "%LOG%"
  if not defined NO_PAUSE pause
  exit /b 1
)

copy /Y data\snapshots.json "backups\snapshots.after_%STAMP%.json" > nul
echo [%date% %time%] Backup after successful update: backups\snapshots.after_%STAMP%.json >> "%LOG%"
echo [%date% %time%] Update completed. >> "%LOG%"
echo.
echo Done. data\snapshots.json has been updated.
echo Backup after update: backups\snapshots.after_%STAMP%.json
echo Next step: run 2_publish_to_github.bat
if not defined NO_PAUSE pause
