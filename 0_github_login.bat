@echo off
setlocal
cd /d "%~dp0"

set "GIT=git"
where git > nul 2>&1
if errorlevel 1 set "GIT=C:\Program Files\Git\cmd\git.exe"

if not exist "%GIT%" if not "%GIT%"=="git" (
  echo Git is not installed or not in PATH.
  echo Install Git for Windows first: https://git-scm.com/download/win
  pause
  exit /b 1
)

echo This opens the GitHub login flow for Git Credential Manager.
echo Finish the browser login, then run 2_publish_to_github.bat again.
echo.

"%GIT%" credential-manager github login

echo.
echo Current GitHub accounts known to Git Credential Manager:
"%GIT%" credential-manager github list

pause
