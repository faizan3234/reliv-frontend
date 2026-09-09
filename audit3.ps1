cd "C:\Users\khanf\Downloads\reliv-frontend-main (1)\reliv-frontend-main"

Write-Host "===== FRONTEND HEAD ====="
git status -sb
git log -1 --oneline

Write-Host "`n===== EXCLUSIVE CONTROLLER ====="
Get-ChildItem .\src\* -Recurse -Include *.js,*.jsx |
Select-String -Pattern 'navigator\.locks|reliv-kiosk-voice-controller|CLIENT_HELLO|CONTROLLER_ACTIVE|relivVoiceClientId' -Context 3,8

Write-Host "`n===== CORRECTION + CONFIRMATION ====="
Get-ChildItem .\src\* -Recurse -Include *.js,*.jsx |
Select-String -Pattern 'galat|wrong|nahi|nahin|correct|haan|sahi|confirm_name|confirm_age|confirm_gender' -Context 3,8

Write-Host "`n===== LANGUAGE AUTO ====="
Get-ChildItem .\src\* -Recurse -Include *.js,*.jsx |
Select-String -Pattern "SET_LANGUAGE|language.*auto|expecting.*language" -Context 3,8

Write-Host "`n===== SPEAKER CONTROL ====="
Get-ChildItem .\src\* -Recurse -Include *.js,*.jsx |
Select-String -Pattern 'SET_RELIV_SPEAKING|reliv_speaking|350|800|audio\.onended|audio\.play' -Context 3,8

Write-Host "`n===== BUILD ====="
npm run build
