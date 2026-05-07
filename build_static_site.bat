@echo off
setlocal
cd /d "%~dp0"

echo Updating ETF snapshots...
python scripts\fetch_etfinfo_holdings.py --output data\snapshots.json --limit 10

if errorlevel 1 (
  echo.
  echo Update failed. Static build was not created.
  pause
  exit /b 1
)

echo.
echo Building dist folder...
if not exist dist mkdir dist
if not exist dist\data mkdir dist\data

copy /Y index.html dist\index.html > nul
copy /Y styles.css dist\styles.css > nul
copy /Y app.js dist\app.js > nul
copy /Y data\snapshots.json dist\data\snapshots.json > nul

echo.
echo Done. Upload the dist folder contents to your static website.
pause
