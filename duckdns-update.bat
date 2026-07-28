@echo off
curl -s "https://www.duckdns.org/update?domains=quranbyear&token=2ee22b49-7f6e-434e-84e1-156b50cfa2cf&ip=" >> "%~dp0duckdns.log" 2>&1
echo %date% %time% - Updated >> "%~dp0duckdns.log"
