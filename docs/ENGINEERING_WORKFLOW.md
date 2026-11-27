# Fluxo de engenharia assistida por IA

## Princípio

A IA pode acelerar análise, implementação e documentação. Ela não substitui critérios de aceitação, testes, revisão humana ou validação no dispositivo real.

## Ciclo obrigatório por tarefa

1. **Contexto:** identificar o comportamento atual, os arquivos envolvidos e as restrições.
2. **Problema:** descrever o defeito ou necessidade de forma reproduzível.
3. **Critérios de aceitação:** definir o que precisa acontecer e o que não pode regredir.
4. **Plano:** propor a menor alteração coerente, sem refatorações não relacionadas.
5. **Teste primeiro:** criar ou atualizar um teste que reproduza o defeito ou cubra o comportamento esperado.
6. **Implementação:** alterar somente o necessário para satisfazer o teste.
7. **Verificação:** executar testes, lint e build; registrar comandos, resultados e limitações.
8. **Revisão:** avaliar efeitos colaterais, acessibilidade, desempenho, segurança e compatibilidade móvel.
9. **Registro:** atualizar documentação e histórico técnico.
10. **Integração:** somente após revisão e autorização explícita.

## Regras de qualidade

- Cada bug corrigido deve ter um teste automatizado de regressão.
- Não afirmar que um teste passou se ele não foi executado.
- Não misturar várias correções independentes no mesmo commit.
- Preservar funcionalidades existentes e evitar reescritas amplas.
- Preferir nomes e responsabilidades claros.
- Não introduzir dependências sem avaliar compatibilidade com Node, Vite e TypeScript do projeto.
- Manter segredos, fotos e vídeos privados fora do repositório público.
- Validar câmera, reconhecimento de imagem, áudio e vídeo em aparelhos reais antes de considerar a experiência pronta.

## Estratégia de branches

- `main`: versão principal, mantida estável.
- `auditoria-e-correcoes`: auditoria e correções iniciais.
- Commits pequenos e descritivos.
- Não fazer deploy nem merge sem autorização explícita.

## Relato de cada tarefa

Ao concluir uma tarefa, registrar:
- problema e causa identificada;
- arquivos alterados;
- testes adicionados;
- comandos executados e resultados;
- limitações e riscos restantes;
- próximo passo recomendado.
