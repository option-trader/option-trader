@echo off
echo ========================================
echo  Next.js Build Cache Cleanup Script
echo  Platform: Windows
echo ========================================
echo.

REM Step 1: Delete .next directory
echo [1/7] Deleting .next build cache...
if exist ".next" (
    rd /s /q .next
    echo    ✓ .next directory deleted
) else (
    echo    ✓ .next directory does not exist
)

REM Step 2: Clear npm cache
echo [2/7] Clearing npm cache...
call npm cache clean --force
if %errorlevel% equ 0 (
    echo    ✓ npm cache cleared
) else (
    echo    ⚠ npm cache clear failed, continuing...
)

REM Step 3: Clear Next.js specific caches
echo [3/7] Clearing Next.js specific caches...
del /q /f "%TEMP%\next-*" 2>nul
echo    ✓ Temp caches cleared

REM Step 4: Reinstall dependencies
echo [4/7] Reinstalling dependencies...
if exist "node_modules" (
    echo    node_modules exists, running npm install...
) else (
    echo    node_modules missing, running npm install...
)
call npm install
if %errorlevel% equ 0 (
    echo    ✓ Dependencies installed
) else (
    echo    ✗ npm install failed
    echo    Try: npm install --legacy-peer-deps
)

REM Step 5: Build Next.js
echo [5/7] Building Next.js application...
call npx next build --no-lint
if %errorlevel% equ 0 (
    echo    ✓ Build completed successfully!
) else (
    echo    ⚠ Build failed, trying with turbo...
    call npx next build --turbo
    if %errorlevel% equ 0 (
        echo    ✓ Build completed with turbo!
    ) else (
        echo    ⚠ Build still failing
        echo    Options:
        echo    1. Try: npm run dev (skip build)
        echo    2. Downgrade: npm install next@14.2.24
        echo    3. Upgrade: npm install next@15 react@19
    )
)

echo.
echo ========================================
echo  CLEANUP COMPLETE!
echo ========================================
echo.
echo To start the development server:
echo   npm run dev
echo.
echo If you still see errors:
echo   1. Delete node_modules and package-lock.json, then npm install
echo   2. Downgrade: npm install next@14.2.24
echo   3. Upgrade: npm install next@15 react@19
echo.
pause
