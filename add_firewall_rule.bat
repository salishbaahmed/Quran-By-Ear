@echo off
netsh advfirewall firewall add rule name="Quran By Ear Backend" dir=in action=allow protocol=TCP localport=3005
echo Done! Port 3005 is now open.
pause