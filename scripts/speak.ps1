param(
    [string]$text = "Faizan... Your health score is 85 out of 100. That is a very good result. A higher score means more of today's checked values are closer to the preferred ranges. Most of your readings are looking good, with a few areas that can still improve. The reference score for people around your age is about 72. Your score is 85, which is above that reference. This score is a summary, not a diagnosis. You do not need to read the screen. I will explain each part of your report to you."
)

Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer

# Find installed female voice
$femaleVoice = $synth.GetInstalledVoices() | Where-Object { 
    $_.Enabled -and ($_.VoiceInfo.Gender -eq [System.Speech.Synthesis.VoiceGender]::Female -or $_.VoiceInfo.Name -like "*Zira*" -or $_.VoiceInfo.Name -like "*Heera*")
} | Select-Object -First 1

if ($femaleVoice) {
    $synth.SelectVoice($femaleVoice.VoiceInfo.Name)
    Write-Output "Selected Female Voice: $($femaleVoice.VoiceInfo.Name)"
} else {
    Write-Output "Selecting default voice by gender: Female"
    $synth.SelectVoiceByHints([System.Speech.Synthesis.VoiceGender]::Female)
}

$synth.Rate = 0
$synth.Speak($text)
