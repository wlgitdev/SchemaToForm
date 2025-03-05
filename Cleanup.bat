@echo off
SETLOCAL EnableDelayedExpansion

echo cleaning project...

:: Clean root
del /f /q package-lock.json 2>nul
rmdir /s /q node_modules 2>nul
del /f /q tsconfig.tsbuildinfo 2>nul

:: Clean packages/schema-to-ui
rmdir /s /q packages\schema-to-ui\node_modules 2>nul
rmdir /s /q packages\schema-to-ui\dist 2>nul
del /f /q packages\schema-to-ui\tsconfig.tsbuildinfo 2>nul
del /f /q packages\schema-to-ui\package-lock.json 2>nul
rmdir /s /q packages\schema-to-ui\.turbo 2>nul

:: Clean apps/web
rmdir /s /q apps\web\node_modules 2>nul
rmdir /s /q apps\web\dist 2>nul
del /f /q apps\web\tsconfig.tsbuildinfo 2>nul
del /f /q apps\web\package-lock.json 2>nul
rmdir /s /q apps\web\.turbo 2>nul

echo cleaned!
pause