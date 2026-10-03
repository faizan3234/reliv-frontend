Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$voices = $synth.GetInstalledVoices()
foreach ($v in $voices) {
    Write-Output "NAME: $($v.VoiceInfo.Name) | GENDER: $($v.VoiceInfo.Gender) | CULTURE: $($v.VoiceInfo.Culture) | DESC: $($v.VoiceInfo.Description)"
}
