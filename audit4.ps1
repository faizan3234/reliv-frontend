cd "C:\Users\khanf\Downloads\reliv-frontend-main (1)\reliv-frontend-main"

Write-Host "===== FRONTEND HEAD ====="
git log -1 --oneline

Write-Host "`n===== BUILD ====="
npm run build

Write-Host "`n===== INTENT TESTS ====="
node .\test-intent.js

Write-Host "`n===== ALL WEBSOCKET CREATION ====="
$wsMatches = Get-ChildItem .\src -Recurse -Include *.js,*.jsx | Select-String -Pattern 'new\s+WebSocket\s*\('
$wsMatches | Format-Table Path,LineNumber,Line -AutoSize
Write-Host "WEBSOCKET CREATION COUNT =" $wsMatches.Count

Write-Host "`n===== RECONNECT LOGIC ====="
Select-String -Path .\src\context\VoiceAssistantContext.jsx -Pattern '3000|scheduleReconnect|reconnectAttempt|setTimeout|connectWebSocket' -Context 2,3

Write-Host "`n===== CONNECTION + ROUTE DEPENDENCIES ====="
Select-String -Path .\src\context\VoiceAssistantContext.jsx -Pattern 'useEffect|connectWebSocket|startVoiceController|location.pathname|navigator.locks|CLIENT_HELLO|CONTROLLER_ACTIVE' -Context 3,5

Write-Host "`n===== AUDIO BYPASSES OUTSIDE SPEECHCONTEXT ====="
Get-ChildItem .\src -Recurse -Include *.js,*.jsx | Where-Object { $_.FullName -notlike "*\src\context\SpeechContext.jsx" } | Select-String -Pattern 'new\s+Audio\s*\(|speechSynthesis\.speak\s*\(' | Format-Table Path,LineNumber,Line -AutoSize
