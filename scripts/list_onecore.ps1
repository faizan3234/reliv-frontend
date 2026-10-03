Get-ChildItem "HKLM:\SOFTWARE\Microsoft\Speech_OneCore\Voices\Tokens" | ForEach-Object {
    $name = $_.PSChildName
    $gender = (Get-ItemProperty $_.PSPath).Gender
    $lang = (Get-ItemProperty $_.PSPath).Lang
    Write-Output "ONECORE: $name | GENDER: $gender | LANG: $lang"
}
