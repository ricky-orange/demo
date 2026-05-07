@echo off
setlocal
cd /d "%~dp0"

set "NO_PAUSE="
if /I "%~1"=="/silent" set "NO_PAUSE=1"

set "GIT=git"
where git > nul 2>&1
if errorlevel 1 set "GIT=C:\Program Files\Git\cmd\git.exe"

if not exist "%GIT%" if not "%GIT%"=="git" (
  echo Git is not installed or not in PATH.
  echo Install Git for Windows first: https://git-scm.com/download/win
  if not defined NO_PAUSE pause
  exit /b 1
)

if not exist .git (
  "%GIT%" init
  "%GIT%" branch -M main
)

"%GIT%" remote get-url origin > nul 2>&1
if errorlevel 1 (
  "%GIT%" remote add origin https://github.com/ricky-orange/demo.git
)

"%GIT%" fetch origin main
if errorlevel 1 (
  echo.
  echo Could not fetch origin/main. Check your internet connection or GitHub login.
  if not defined NO_PAUSE pause
  exit /b 1
)

"%GIT%" reset --mixed origin/main

"%GIT%" config user.name > nul 2>&1
if errorlevel 1 "%GIT%" config user.name "ricky-orange"

"%GIT%" config user.email > nul 2>&1
if errorlevel 1 "%GIT%" config user.email "ricky-orange@users.noreply.github.com"

"%GIT%" add index.html styles.css app.js data/snapshots.json README.md DEPLOYMENT.md
"%GIT%" add .gitignore
"%GIT%" add 0_github_login.bat 1_update_snapshots.bat 2_publish_to_github.bat
"%GIT%" add build_static_site.bat open_dashboard.bat start_dashboard.bat task_scheduler_update_snapshots_silent.bat
"%GIT%" add scripts\*.py requirements.txt Dockerfile Procfile
"%GIT%" add data/snapshots.example.json data/raw_holdings.example.csv
"%GIT%" diff --cached --quiet
if not errorlevel 1 (
  echo.
  echo Nothing changed. No publish needed.
  if not defined NO_PAUSE pause
  exit /b 0
)

"%GIT%" commit -m "Update ETF snapshots"
if errorlevel 1 (
  echo.
  echo Commit failed.
  if not defined NO_PAUSE pause
  exit /b 1
)

"%GIT%" push -u origin main
if errorlevel 1 (
  echo.
  echo Push failed. If this is the first time on this computer, run 0_github_login.bat first.
  if not defined NO_PAUSE pause
  exit /b 1
)

if not defined NO_PAUSE pause
