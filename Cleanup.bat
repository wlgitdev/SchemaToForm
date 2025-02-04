@echo off
SETLOCAL EnableDelayedExpansion

echo cleaning project...
:: Clean packages/schema-to-form
rmdir /s /q packages\schema-to-form\node_modules 2>nul
rmdir /s /q packages\schema-to-form\dist 2>nul
del /f /q packages\schema-to-form\tsconfig.tsbuildinfo 2>nul
del /f /q packages\schema-to-form\package-lock.json 2>nul
rmdir /s /q packages\schema-to-form\.turbo 2>nul

:: Clean apps/web
rmdir /s /q apps\web\node_modules 2>nul
rmdir /s /q apps\web\dist 2>nul
del /f /q apps\web\tsconfig.tsbuildinfo 2>nul
del /f /q apps\web\package-lock.json 2>nul
rmdir /s /q apps\web\.turbo 2>nul

echo cleaned!
pause