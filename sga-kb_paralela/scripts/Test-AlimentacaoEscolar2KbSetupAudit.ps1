#requires -Version 7.4
<#
.SYNOPSIS
Wrapper local sanitizado para auditoria agregada da pasta paralela da KB.

.DESCRIPTION
Executa o script compartilhado `Test-XpzSetupAudit.ps1` para consolidar, em
saida deterministica, as evidencias principais de auditoria operacional da
pasta paralela: `powershell/runtime`, `sync/materializacao`,
`naming/objetos-da-kb`, `indice/gate`, `indice/semantica`, `metadata wrapper`,
`empacotamento local`, `declarativo/timestamps`, `wrappers/inventario` e
`estado_operacional_sugerido`. A dimensao `naming/objetos-da-kb` delega ao
wrapper local `Test-AlimentacaoEscolar2KbObjetosDaKbNaming.ps1` quando disponivel.

Este wrapper nao substitui os gates especificos. Ele apenas centraliza a
execucao deles para handoff e diagnostico curto em `modo_atualizacao`.

.PARAMETER KbRoot
Caminho opcional para a raiz da pasta paralela da KB.
Quando omitido, usa a pasta pai de `scripts`.

.PARAMETER GateWrapperPath
Caminho opcional para `Test-AlimentacaoEscolar2KbIndexGate.ps1`.

.PARAMETER MetadataWrapperTestPath
Caminho opcional para `Test-AlimentacaoEscolar2KbMetadataWrapper.ps1`.

.PARAMETER SourceSanityWrapperPath
Caminho opcional para `Test-AlimentacaoEscolar2KbSourceSanity.ps1`.

.PARAMETER PackageCollisionWrapperPath
Caminho opcional para `Test-AlimentacaoEscolar2KbPackageCollision.ps1`.

.PARAMETER PowerShellRuntimeWrapperPath
Caminho opcional para `Test-AlimentacaoEscolar2KbPowerShellRuntime.ps1`.

.PARAMETER NamingWrapperPath
Caminho opcional para `Test-AlimentacaoEscolar2KbObjetosDaKbNaming.ps1`.

.PARAMETER SharedSkillsRoot
Raiz local da base compartilhada `GeneXus-XPZ-Skills`.

.EXAMPLE
.\Test-AlimentacaoEscolar2KbSetupAudit.ps1

.EXAMPLE
.\Test-AlimentacaoEscolar2KbSetupAudit.ps1 -KbRoot C:\KB
#>

param(
    [string]$KbRoot,

    [string]$GateWrapperPath,

    [string]$MetadataWrapperTestPath,

    [string]$SourceSanityWrapperPath,

    [string]$PackageCollisionWrapperPath,

    [string]$PowerShellRuntimeWrapperPath,

    [string]$NamingWrapperPath,

    [string]$SharedSkillsRoot = "C:\Desenvolvimento\sga\GeneXus-XPZ-Skills-main"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if (-not $KbRoot) {
    $KbRoot = Split-Path -Parent $PSScriptRoot
}

if (-not $GateWrapperPath) {
    $GateWrapperPath = Join-Path $PSScriptRoot 'Test-AlimentacaoEscolar2KbIndexGate.ps1'
}

if (-not $MetadataWrapperTestPath) {
    $MetadataWrapperTestPath = Join-Path $PSScriptRoot 'Test-AlimentacaoEscolar2KbMetadataWrapper.ps1'
}

if (-not $SourceSanityWrapperPath) {
    $candidate = Join-Path $PSScriptRoot 'Test-AlimentacaoEscolar2KbSourceSanity.ps1'
    if (Test-Path -LiteralPath $candidate -PathType Leaf) {
        $SourceSanityWrapperPath = $candidate
    }
}

if (-not $PackageCollisionWrapperPath) {
    $candidate = Join-Path $PSScriptRoot 'Test-AlimentacaoEscolar2KbPackageCollision.ps1'
    if (Test-Path -LiteralPath $candidate -PathType Leaf) {
        $PackageCollisionWrapperPath = $candidate
    }
}

if (-not $PowerShellRuntimeWrapperPath) {
    $PowerShellRuntimeWrapperPath = Join-Path $PSScriptRoot 'Test-AlimentacaoEscolar2KbPowerShellRuntime.ps1'
}

if (-not $NamingWrapperPath) {
    $candidate = Join-Path $PSScriptRoot 'Test-AlimentacaoEscolar2KbObjetosDaKbNaming.ps1'
    if (Test-Path -LiteralPath $candidate -PathType Leaf) {
        $NamingWrapperPath = $candidate
    }
}

$enginePath = Join-Path $SharedSkillsRoot 'scripts\Test-XpzSetupAudit.ps1'
if (-not (Test-Path -LiteralPath $enginePath -PathType Leaf)) {
    throw "Shared setup audit script not found: $enginePath"
}

& $enginePath `
    -KbRoot $KbRoot `
    -GateWrapperPath $GateWrapperPath `
    -MetadataWrapperTestPath $MetadataWrapperTestPath `
    -PowerShellRuntimeTestPath $PowerShellRuntimeWrapperPath `
    -NamingWrapperPath $NamingWrapperPath `
    -SourceSanityWrapperPath $SourceSanityWrapperPath `
    -PackageCollisionWrapperPath $PackageCollisionWrapperPath
exit $LASTEXITCODE
