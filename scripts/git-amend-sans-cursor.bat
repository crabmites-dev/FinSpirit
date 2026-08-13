@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0.."

set GIT_AUTHOR_NAME=Mmor
set GIT_AUTHOR_EMAIL=mmbow6355@gmail.com
set GIT_COMMITTER_NAME=Mmor
set GIT_COMMITTER_EMAIL=mmbow6355@gmail.com

set "MSG=%*"
if "!MSG!"=="" set "MSG=Mise a jour"

for /f %%i in ('git rev-parse "HEAD^^{tree}"') do set TREE=%%i
for /f %%i in ('git rev-parse HEAD~') do set PARENT=%%i
(echo !MSG!)> "%TEMP%\git-msg.txt"
for /f %%i in ('git commit-tree !TREE! -p !PARENT! -F "%TEMP%\git-msg.txt"') do set COMMIT=%%i
del "%TEMP%\git-msg.txt"

git update-ref refs/heads/main !COMMIT!
git reset --hard main
git log -1 --format=full
