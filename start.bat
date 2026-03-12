@echo off
title UroSense - IoT Urine Monitor

echo.
echo  =============================
echo   UROSENSE - Starting App...
echo  =============================
echo.

:: Install backend dependencies
echo [1/4] Installing backend dependencies...
cd backend
npm install --silent
cd ..

:: Install frontend dependencies
echo [2/4] Installing frontend dependencies...
cd frontend
npm install --silent
cd ..

:: Start backend in a new terminal window
echo [3/4] Starting backend server...
start "UroSense Backend" cmd /k "cd backend && node src/index.js"

:: Wait 2 seconds for backend to boot
timeout /t 2 /nobreak >nul

:: Start frontend in a new terminal window
echo [4/4] Starting frontend...
start "UroSense Frontend" cmd /k "cd frontend && npm run dev"

:: Wait for frontend to boot then open browser
timeout /t 4 /nobreak >nul

echo.
echo  =============================
echo   Opening app in browser...
echo  =============================
echo.

start http://localhost:5173

echo  App is running!
echo  Close the Backend and Frontend windows to stop the app.
echo.
pause
