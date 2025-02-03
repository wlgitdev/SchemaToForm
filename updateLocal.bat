@echo off
set MAIN_DIR=""
set TEST_DIR=""

robocopy %MAIN_DIR% %TEST_DIR% *.ts *.tsx *.json /njh /njs /e
if errorlevel 8 (
    echo Error occurred during copy
    exit /b 1
) else (
    echo Files copied successfully
    exit /b 0
)