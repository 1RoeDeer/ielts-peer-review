@echo off
set GIT=C:\Program Files\Git\bin\git.exe

"%GIT%" config --global user.email "1RoeDeer@users.noreply.github.com"
"%GIT%" config --global user.name "1RoeDeer"
echo Email fixed!

"%GIT%" commit --amend --reset-author --no-edit 2>&1
echo Commit updated!

"%GIT%" push origin main --force 2>&1
echo.
echo === Pushed! Vercel should deploy now ===
