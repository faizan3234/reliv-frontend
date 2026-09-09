cd "C:\Users\khanf\Downloads\reliv-frontend-main (1)\reliv-frontend-main"

Write-Host "===== FRONTEND GIT ====="
git status --short
git log -1 --oneline

Write-Host "`n===== VOICE PROVIDER COUNT ====="
$providers = Get-ChildItem .\src\* -Recurse -Include *.js,*.jsx |
Select-String -Pattern '<VoiceAssistantProvider'
$providers
Write-Host "COUNT =" $providers.Count

Write-Host "`n===== WEBSOCKET CREATOR COUNT ====="
$sockets = Get-ChildItem .\src\* -Recurse -Include *.js,*.jsx |
Select-String -Pattern 'new WebSocket'
$sockets
Write-Host "COUNT =" $sockets.Count

Write-Host "`n===== CONNECTION GUARDS ====="
Get-ChildItem .\src\* -Recurse -Include *.js,*.jsx |
Select-String -Pattern 'WebSocket.OPEN|WebSocket.CONNECTING|reconnectTimeout|500|manualClose|reconnectGeneration|clientId|CLIENT_HELLO' -Context 2,5

Write-Host "`n===== SPEAKER STATE ====="
Get-ChildItem .\src\* -Recurse -Include *.js,*.jsx |
Select-String -Pattern 'SET_RELIV_SPEAKING|reliv_speaking|setRelivSpeaking|setIsSpeaking|350|800' -Context 3,7

Write-Host "`n===== AUDIO START / END ====="
Get-ChildItem .\src\* -Recurse -Include *.js,*.jsx |
Select-String -Pattern 'audio\.play|audio\.onended|audio\.onerror|speechSynthesis|onend|playbackRequestRef' -Context 4,8

Write-Host "`n===== PAUSE USAGE ====="
Get-ChildItem .\src\* -Recurse -Include *.js,*.jsx |
Select-String -Pattern 'PAUSE_LISTENING|pauseListening|RESUME_LISTENING' -Context 2,5

Write-Host "`n===== BUILD ====="
npm run build
