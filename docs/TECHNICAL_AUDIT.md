# Auditoria técnica inicial

## Escopo

Inspeção estática inicial de arquivos do fluxo de AR e configuração do projeto. Os achados abaixo são hipóteses técnicas que precisam ser reproduzidas e verificadas antes de qualquer correção.

## Achados para investigação

### A-01 — Inicializações concorrentes do AR

**Prioridade:** alta  
**Arquivos:** `src/components/ARExperience.tsx`, `src/App.tsx`

Os handlers de upload de imagem e de arquivo `.mind` chamam `onUpdateContent(...)` e também chamam `bootstrapAR(...)` diretamente. A atualização do conteúdo pode alterar as dependências do callback `bootstrapAR`, fazendo o efeito que depende dele executar novamente. Isso pode provocar inicializações concorrentes ou repetidas.

**Verificação necessária:** reproduzir a troca de alvo e contar quantas inicializações são disparadas; verificar cancelamento e descarte da inicialização anterior.

### A-02 — Ciclo de vida de URLs temporárias

**Prioridade:** alta  
**Arquivos:** `src/components/ARExperience.tsx`, `src/services/mindTargetService.ts`

Há URLs criadas com `URL.createObjectURL` para vídeo, imagem de prévia e arquivos `.mind`. O serviço também cria URLs para alvos compilados e recuperados do IndexedDB. A inspeção inicial não identificou um ciclo de liberação abrangente para substituição de arquivos, troca de alvo e desmontagem do componente.

**Verificação necessária:** mapear a propriedade de cada URL, garantir revogação apenas quando não estiver mais em uso e criar testes que verifiquem a liberação sem invalidar recursos ativos.

### A-03 — Solicitação prévia da câmera

**Prioridade:** média  
**Arquivo:** `src/services/cameraService.ts`, `src/components/ARExperience.tsx`

O serviço solicita a câmera com `getUserMedia` e encerra imediatamente as tracks. Em seguida, o MindAR inicializa sua própria câmera. Isso pode ser intencional para antecipar a permissão, mas implica duas operações de acesso ao hardware.

**Verificação necessária:** testar em Android e iOS, observar permissões, troca de câmera e falhas de inicialização antes de alterar o fluxo.

### A-04 — Verificação e carregamento de alvos pré-compilados

**Prioridade:** média  
**Arquivo:** `src/services/mindTargetService.ts`

A função `checkPrecompiledMindUrl` faz uma requisição GET e lê o corpo para validar o arquivo. O MindAR pode realizar outra requisição ao consumir a URL.

**Verificação necessária:** confirmar o comportamento real do MindAR, avaliar cache e evitar downloads duplicados sem enfraquecer a validação.

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
