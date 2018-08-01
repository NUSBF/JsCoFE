@echo off

REM ===================================================

CALL "%~dp0\..\ccp4.setup.bat"

SET PDB_DIR=Y:\pdb\pdb
SET GESAMT_ARCHIVE=Y:\pdb\gesamt_archive_s
SET JSPISA_CFG=%CCP4%\share\pisa\jspisa.cfg

node ./desktop.js ./config/conf.windows.json -localuser %USERNAME%

REM node ./desktop.js ./config/conf.windows.json
