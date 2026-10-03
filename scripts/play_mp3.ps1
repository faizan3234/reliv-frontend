param(
    [string]$FilePath = "scripts/test_neerja.mp3"
)

Add-Type -AssemblyName presentationCore

$fullPath = [System.IO.Path]::GetFullPath($FilePath)
if (-not (Test-Path $fullPath)) {
    Write-Error "File not found: $fullPath"
    exit 1
}

$mediaPlayer = New-Object System.Windows.Media.MediaPlayer
$mediaPlayer.Open([Uri]$fullPath)

# Wait for file to open and get duration
$timeout = 0
while ($mediaPlayer.NaturalDuration.HasTimeSpan -eq $false -and $timeout -lt 50) {
    Start-Sleep -Milliseconds 100
    $timeout++
}

$duration = 10
if ($mediaPlayer.NaturalDuration.HasTimeSpan) {
    $duration = [Math]::Ceiling($mediaPlayer.NaturalDuration.TimeSpan.TotalSeconds)
}

Write-Output ">> Playing Neerja Neural voice ($duration sec): $fullPath"
$mediaPlayer.Play()

# Wait for playback
Start-Sleep -Seconds ($duration + 1)
$mediaPlayer.Close()
Write-Output ">> Playback finished."
