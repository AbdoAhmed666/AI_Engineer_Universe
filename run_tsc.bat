@echo off
cd /d d:\projects\ai-engineer-universe
node node_modules\typescript\bin\tsc --noEmit --skipLibCheck > tsc_result.txt 2>&1
echo EXITCODE:%ERRORLEVEL% >> tsc_result.txt
