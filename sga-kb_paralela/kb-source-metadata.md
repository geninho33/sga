---
name: KB Source Metadata
description: Metadados operacionais da pasta paralela AlimentacaoEscolar2 â€” identidade pendente de reconciliacao via Resolve-AlimentacaoEscolar2KbIdentity.ps1
source_refresh_status: complete
last_setup_audit_run_at: 2026-06-17T20:14:34.6453763-03:00
setup_contract_signature_version: xpz-setup-contract-signature-v1
setup_contract_signature_hash: b3d5bc9dc4fd17aaf5f55dd6ab15e7b9625ea830097b2eba9d3bfb41fdd4c8d5
updated: 2026-06-17T23:42:33.0000000Z
last_xpz_materialization_run_at: 2026-06-17T23:42:33.0000000Z
source_xpz: C:\Desenvolvimento\sga\sga-kb_paralela\XpzExportadosPelaIDE\processado_AlimentacaoEscolar2.xpz
---

## KMW

| Campo        | Valor |
|---|---|
| MajorVersion | 4 |
| MinorVersion | 0 |
| Build | 182098 |

## Source

| Campo    | Valor |
|---|---|
| kb (GUID) | fa842054-683e-482a-b804-3cf455220f18 |
| username | DESKTOP-OQ270FR\Geninho |
| UNCPath | \\DESKTOP-OQ270FR\D$\genexus\Sistemas\AlimentacaoEscolar2 |

## Source/Version

| Campo | Valor |
|---|---|
| guid | e87c2379-0a9c-4a2b-a6cb-d1904630131e |
| name | AlimentacaoEscolar2 |

## Uso

Ao gerar um `import_file.xml` ou `.xpz` para importacao na KB, usar estes valores
nos blocos `<KMW>` e `<Source>` do envelope `<ExportFile>`.

Identidade estavel: executar `scripts\Resolve-AlimentacaoEscolar2KbIdentity.ps1 -UpdateMetadata -AsJson`
apos o setup, antes do primeiro empacotamento.