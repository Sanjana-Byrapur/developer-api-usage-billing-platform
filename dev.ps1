$backend = Join-Path $PSScriptRoot 'backend'
$frontend = Join-Path $PSScriptRoot 'frontend'
if (!(Test-Path -LiteralPath $backend) -or !(Test-Path -LiteralPath $frontend)) {
    throw 'Frontend or backend directory not found.'
}
Start-Process powershell.exe -WorkingDirectory $backend -ArgumentList '-NoExit', '-Command', 'npm run dev'
Start-Process powershell.exe -WorkingDirectory $frontend -ArgumentList '-NoExit', '-Command', 'npm run dev'
