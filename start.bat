@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo.
echo  =========================================
echo   מעבדת תיקונים - שרת פיתוח מקומי
echo  =========================================
echo.

:: Get local IP
for /f "tokens=2 delims=:" %%i in ('ipconfig ^| findstr /i "IPv4"') do (
    set "RAW=%%i"
    for /f "tokens=1" %%j in ("%%i") do set "LOCAL_IP=%%j"
    goto :got_ip
)
:got_ip

echo   מחשב זה:   http://localhost:3000
echo   רשת (WiFi): http://%LOCAL_IP%:3000
echo.
echo   לגישה מהנייד - חבר לאותה רשת WiFi ופתח:
echo   http://%LOCAL_IP%:3000
echo.
echo   לגישה מרחוק מכל מקום - הפעל את tunnel.bat בחלון נפרד
echo.
echo   לסגירה: Ctrl+C
echo  =========================================
echo.

start "" http://localhost:3000
python -m http.server 3000 --bind 0.0.0.0
