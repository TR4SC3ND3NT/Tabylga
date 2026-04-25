@echo off
echo =========================================
echo  Tabylga App Setup ^& Start Script (Windows) 
echo =========================================

echo.
echo [1/3] Installing dependencies...
call npm install

echo.
echo [2/3] Clearing Metro bundler cache to prevent errors...

echo.
echo [3/3] Starting Expo development server...
echo TIP: Once it starts, press 'w' to open in browser (Laptop).
echo TIP: Scan the QR code with the Expo Go app to open on Phone.
echo =========================================
echo.

call npm run start -- -c
