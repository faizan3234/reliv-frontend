cd "C:\Users\khanf\Downloads\reliv-frontend-main (1)\reliv-frontend-main"

Write-Host "===== GIT STATUS ====="
git status --short
git log -1 --oneline

Write-Host "`n===== WEBSOCKET ====="
Get-ChildItem .\src\* -Recurse -Include *.js,*.jsx |
Select-String -Pattern 'new WebSocket|ws\.onopen|ws\.onclose|reconnectTimeout'

Write-Host "`n===== SPEAKER / MIC SUPPRESSION ====="
Get-ChildItem .\src\* -Recurse -Include *.js,*.jsx |
Select-String -Pattern 'SET_RELIV_SPEAKING|reliv_speaking|assistant_speaking|setIsSpeaking|350|800' -Context 3,6

Write-Host "`n===== PAUSE / RESUME ====="
Get-ChildItem .\src\* -Recurse -Include *.js,*.jsx |
Select-String -Pattern 'PAUSE_LISTENING|RESUME_LISTENING|pauseListening|resumeListening' -Context 3,6

Write-Host "`n===== SPEECH END EVENTS ====="
Get-ChildItem .\src\* -Recurse -Include *.js,*.jsx |
Select-String -Pattern 'onended|onend|speechSynthesis|Audio\(' -Context 3,8

Write-Host "`n===== TRANSCRIPT HANDLING ====="
Get-ChildItem .\src\* -Recurse -Include *.js,*.jsx |
Select-String -Pattern 'lastTranscript|onTranscript|msg\.type.*transcript|type.*transcript' -Context 3,10
