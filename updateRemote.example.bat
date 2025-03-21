@echo off
setlocal EnableDelayedExpansion

:: Get source and destination paths from command line or use defaults (cmd > updateRemote.bat "from" "to")
if "%~1"=="" (
    set "PACKAGE_DIR="
) else (
    set "PACKAGE_DIR=%~1"
)

if "%~2"=="" (
    set "PROJECT_DIR="
    @REM set "PROJECT_DIR="
) else (
    set "PROJECT_DIR=%~2"
)

:: Validate directories exist
if not exist "!PACKAGE_DIR!" (
    echo Error: Source directory does not exist: !PACKAGE_DIR!
    exit /b 1
)

:: Copy package files
@REM echo Copying package files...
@REM xcopy "!MAIN_DIR!\package.json" "!TEST_DIR!" /Y
@REM xcopy "!MAIN_DIR!\tsconfig.json" "!TEST_DIR!" /Y

:: Copy source files
echo Copying source files...
xcopy "!PACKAGE_DIR!\src" "!PROJECT_DIR!\src" /E /Y /I /Q /EXCLUDE:update_remote_exclude.txt

echo Update complete
exit /b 0