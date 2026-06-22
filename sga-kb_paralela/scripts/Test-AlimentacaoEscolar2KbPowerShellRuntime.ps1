<#
.SYNOPSIS
Wrapper local sanitizado para validar o runtime PowerShell minimo da pasta paralela da KB.

.DESCRIPTION
Delega ao motor compartilhado `Test-XpzPowerShellRuntime.ps1`.
Este gate deve ser executado antes de qualquer uso operacional da pasta paralela.
Este wrapper nao usa `#requires -Version 7.4` de proposito, para conseguir
emitir `BLOCK:` tambem quando chamado a partir de um host PowerShell antigo.

.PARAMETER SharedSkillsRoot
Raiz local da base compartilhada `GeneXus-XPZ-Skills`.

.EXAMPLE
.\Test-AlimentacaoEscolar2KbPowerShellRuntime.ps1
#>

param(
    [string]$SharedSkillsRoot = "C:\Desenvolvimento\sga\GeneXus-XPZ-Skills-main"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$enginePath = Join-Path $SharedSkillsRoot 'scripts\Test-XpzPowerShellRuntime.ps1'

if (-not (Test-Path -LiteralPath $enginePath -PathType Leaf)) {
    throw "Engine script not found: $enginePath"
}

& $enginePath -MinimumVersion ([version]'7.4')
exit $LASTEXITCODE
