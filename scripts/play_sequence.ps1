param(
    [string[]]$Files = @(
        "public/assets/audio/reports/report1_hi_85.mp3",
        "public/assets/audio/reports/report2_hi.mp3",
        "public/assets/audio/reports/report3_hi.mp3",
        "public/assets/audio/reports/report4_hi.mp3",
        "public/assets/audio/reports/report5_hi.mp3"
    )
)

Add-Type -AssemblyName presentationCore

foreach ($file in $Files) {
    $fullPath = [System.IO.Path]::GetFullPath($file)
    if (-not (Test-Path $fullPath)) {
        Write-Warning "File not found: $fullPath"
        continue
    }

    $mediaPlayer = New-Object System.Windows.Media.MediaPlayer
    $mediaPlayer.Open([Uri]$fullPath)

    $timeout = 0
    while ($mediaPlayer.NaturalDuration.HasTimeSpan -eq $false -and $timeout -lt 50) {
        Start-Sleep -Milliseconds 100
        $timeout++
    }

    $duration = 10
    if ($mediaPlayer.NaturalDuration.HasTimeSpan) {
        $duration = [Math]::Ceiling($mediaPlayer.NaturalDuration.TimeSpan.TotalSeconds)
    }

    Write-Output ">> [NOW PLAYING] $([System.IO.Path]::GetFileName($file)) (Duration: $duration sec)..."
    $mediaPlayer.Play()
    Start-Sleep -Seconds ($duration + 1)
    $mediaPlayer.Close()
    Write-Output ">> Finished $([System.IO.Path]::GetFileName($file))"
    Start-Sleep -Milliseconds 1500
}

Write-Output ">> [ALL PLAYBACK COMPLETE] All requested Hindi report audios played successfully!"
