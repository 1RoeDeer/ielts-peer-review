@echo off
set GIT="C:\Program Files\Git\bin\git.exe"

echo.
echo === Pushing to GitHub ===
echo.

REM Добавляем все файлы
%GIT% add -A

REM Коммит с датой/временем
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /format:list') do set dt=%%I
set MSG=update %dt:~0,4%-%dt:~4,2%-%dt:~6,2% %dt:~8,2%:%dt:~10,2%

%GIT% commit -m "%MSG%" 2>&1

REM Пуш
%GIT% push origin main --force 2>&1

echo.
echo === Done! Vercel will auto-deploy in ~1 minute ===
echo.
