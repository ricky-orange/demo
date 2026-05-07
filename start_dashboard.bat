@echo off
setlocal
cd /d "%~dp0"
python scripts\server.py 8765
