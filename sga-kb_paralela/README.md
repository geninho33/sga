# Pasta paralela â€” AlimentacaoEscolar2

Pasta paralela da Knowledge Base GeneXus **AlimentacaoEscolar2**.

## Caminhos

- Pasta paralela: `C:\Desenvolvimento\sga\sga-kb_paralela`
- Pasta nativa da KB (somente leitura para agentes): `D:\genexus\Sistemas\AlimentacaoEscolar2`

A pasta `CSharpMySQL` dentro da KB nativa e apenas o output de um environment;
nao e a raiz da Knowledge Base.

## Primeiros passos

1. Exportar um `.xpz` full pela IDE GeneXus para `XpzExportadosPelaIDE\`.
2. Materializar com `scripts\Update-AlimentacaoEscolar2KbFromXpz.ps1`.
3. Regenerar o indice com `scripts\Rebuild-AlimentacaoEscolar2KbIntelligenceIndex.ps1` (exige Python 3.x).

Estado operacional e timestamps: consultar `kb-source-metadata.md`, `Test-AlimentacaoEscolar2KbSetupAudit.ps1`
e `Test-AlimentacaoEscolar2KbIndexGate.ps1` â€” nao espelhar timestamps neste README.