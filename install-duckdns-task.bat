@echo off
schtasks /create /tn "DuckDNS-QuranByEar" /tr "C:\Users\SAA\Documents\projects\Quran-By-Ear\duckdns-update.bat" /sc minute /mo 5 /f
echo Scheduled task created successfully.
