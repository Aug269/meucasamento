# Contexto técnico — meucasamento

## Objetivo do produto

Criar uma experiência de realidade aumentada para um quadro físico de casamento. A pessoa aponta a câmera do celular para a fotografia impressa e o vídeo real do casamento aparece alinhado à imagem reconhecida.

## Experiência desejada

1. A pessoa lê um QR Code impresso ou exibido junto ao quadro.
2. O QR Code abre a experiência em uma página HTTPS no navegador do celular.
3. A página solicita acesso à câmera traseira.
4. O MindAR reconhece a fotografia impressa.
5. O vídeo do casamento é exibido sobre a fotografia, acompanhando o rastreamento.
6. A pessoa pode interagir com a reprodução e o áudio.

Não exigir aplicativo nativo nem cadastro. A reprodução automática com áudio não deve ser presumida: navegadores móveis podem exigir uma interação explícita.

## Repositório e fluxo de trabalho

- Repositório: https://github.com/Aug269/meucasamento
- Branch principal: `main`
- Branch de trabalho desta auditoria: `auditoria-e-correcoes`
- Não integrar na `main` nem publicar sem validação e autorização.

## Tecnologias observadas

- React 19
- TypeScript
- Vite 8
- A-Frame
- MindAR Image Tracking
- Three.js
- IndexedDB para cache de alvos compilados

## Estrutura observada

- `src/App.tsx`: fluxo de telas e estado principal da experiência.
- `src/components/ARExperience.tsx`: inicialização do AR, rastreamento e controles do vídeo.
- `src/services/cameraService.ts`: solicitação e liberação da câmera.
- `src/services/mindTargetService.ts`: compilação, carregamento e cache dos arquivos `.mind`.
- `src/services/aframeComponents.ts`: componentes personalizados do A-Frame.
- `src/config/experienceContent.ts`: conteúdo e configuração da experiência.
- `public/media/`: mídia pública do projeto.
- `public/targets/`: alvos de rastreamento.

## Segurança e privacidade dos materiais

Fotos e vídeos reais do casamento são materiais privados. Não devem ser enviados ao repositório público. A integração deve usar hospedagem apropriada, URLs controladas e validação de acesso, tamanho, formato e compatibilidade.

## Estado desta documentação

Documento inicial elaborado por inspeção estática do código disponível no branch de trabalho. Não representa validação em dispositivo físico nem execução de build ou testes.
