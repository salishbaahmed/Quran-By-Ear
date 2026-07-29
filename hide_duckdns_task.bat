@echo off
schtasks /change /tn "DuckDNS-QuranByEar" /tr "wscript.exe C:\Users\SAA\Documents\projects\Quran-By-Ear\duckdns_hidden.vbs" /ru "SYSTEM"
echo Done! DuckDNS task is now completely hidden.
pause