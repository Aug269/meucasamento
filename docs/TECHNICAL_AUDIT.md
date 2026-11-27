# Auditoria técnica inicial

## Escopo

Inspeção estática inicial de arquivos do fluxo de AR e configuração do projeto. Os achados abaixo são hipóteses técnicas que precisam ser reproduzidas e verificadas antes de qualquer correção.

## Achados para investigação

### A-01 — Inicializações concorrentes do AR

**Prioridade:** alta  
**Arquivos:** `src/components/ARExperience.tsx`, `src/App.tsx`

**Confirmado por inspeção do fluxo de código; reprodução em navegador ainda pendente.** Os handlers de upload de imagem e de arquivo `.mind` chamam `onUpdateContent(...)` e também chamam `bootstrapAR(...)` diretamente. A atualização do conteúdo altera dependências do callback `bootstrapAR` (`customImageFile` e/ou `customMindFile`), fazendo o efeito que depende dele executar novamente. O cleanup do efeito chama `stopActiveAR` e a nova execução chama `bootstrapAR` outra vez. Portanto, a troca de alvo tem dois caminhos de inicialização: o disparo manual e o disparo provocado pela atualização das dependências.

**Teste de regressão planejado:** renderizar `ARExperience`, simular upload de imagem e upload de `.mind`, e verificar que cada ação produz uma única inicialização efetiva, sem deixar a inicialização anterior ativa. A implementação do teste deve isolar câmera e MindAR por mocks.

### A-02 — Ciclo de vida de URLs temporárias

**Prioridade:** alta  
**Arquivos:** `src/components/ARExperience.tsx`, `src/services/mindTargetService.ts`

**Confirmado por inspeção estática; impacto de memória ainda não medido.** Foram localizadas criações de URLs em `InstructionsScreen.tsx`, `ARExperience.tsx` e `mindTargetService.ts`. Elas cobrem foto de prévia, vídeo, áudio, arquivo `.mind` e alvo compilado. Não foi identificado um ciclo correspondente de `URL.revokeObjectURL` para substituição dos arquivos ou desmontagem dos componentes; a única revogação localizada é a URL temporária usada em `downloadMindBytes`.

**Teste de regressão planejado:** mockar `URL.createObjectURL`/`URL.revokeObjectURL` e verificar que recursos substituídos ou descartados são revogados uma única vez, enquanto URLs ainda referenciadas por elementos ativos permanecem válidas. Antes da correção, será necessário definir claramente quem é dono de cada URL para evitar revogação prematura.

### A-03 — Solicitação prévia da câmera

**Prioridade:** média  
**Arquivo:** `src/services/cameraService.ts`, `src/components/ARExperience.tsx`

O serviço solicita a câmera com `getUserMedia` e encerra imediatamente as tracks. Em seguida, o MindAR inicializa sua própria câmera. Isso pode ser intencional para antecipar a permissão, mas implica duas operações de acesso ao hardware.

**Verificação necessária:** testar em Android e iOS, observar permissões, troca de câmera e falhas de inicialização antes de alterar o fluxo.

### A-04 — Verificação e carregamento de alvos pré-compilados

**Prioridade:** média  
**Arquivo:** `src/services/mindTargetService.ts`

A função `checkPrecompiledMindUrl` faz uma requisição GET e lê o corpo para validar o arquivo. O MindAR pode realizar outra requisição ao consumir a URL.

**Verificação necessária:** confirmar o comportamento real do MindAR, avaliar cache e evitar downloads duplicados sem enfraquecer a validação. Ainda não há confirmação de que isso gere transferência duplicada em todas as versões/navegadores.

### A-05 — Pré-carregamento do vídeo

**Prioridade:** média  
**Arquivo:** `src/components/ARExperience.tsx`

O elemento de vídeo usa `preload="auto"`. Isso pode iniciar consumo de dados antes de a imagem ser reconhecida.

**Verificação necessária:** medir carregamento em rede móvel e avaliar carregamento sob demanda, preservando o comportamento de textura de vídeo no iOS.

### A-06 — Ausência de infraestrutura de testes identificada

**Prioridade:** alta  
**Arquivo:** `package.json`

O manifesto consultado contém scripts de desenvolvimento, build, preview e lint, mas não contém script de teste nem dependências de teste identificadas. Também não foi encontrado arquivo de lockfile nos caminhos convencionais consultados.

**Verificação necessária:** confirmar o ambiente Node usado pelo projeto e escolher versões compatíveis de Vitest, ambiente DOM e bibliotecas de teste antes de adicionar dependências.

## Estado de validação

- Inspeção estática: realizada parcialmente.
- Build: não executado.
- Lint: não executado.
- Testes automatizados: não executados; infraestrutura ainda não configurada.
- Teste em celular: pendente.
- Materiais reais do casamento: ainda não integrados.

Nenhum achado deve ser tratado como bug confirmado até existir reprodução e teste.
