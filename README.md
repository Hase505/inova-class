# Inova Class

Repositório utilizado para versionamento e publicação dos códigos do projeto Inova Class.

## Organização do repositório

- /app
  - Utilizado para criar as funcionalidades do aplicativo Android.
- /esp32
  - Utilizado para armazenar o código utilizado pelo ESP32.
- /backend
  - Utilizado para implementar o backend do servidor central

## Organização das branches

- main: para versão final de cada fase do projeto.
- dev: para unificar desenvolvimento dos 3 componentes do projeto e realizar testes finais.
- app: para alterações específicas do aplicativo.
- esp32: para alterações específicas do esp32.
- backend: para alterações específicas do backend.

## Processo de desenvolvimento

Cada funcionalidade deve ser implementada em sua respectiva branch. Se uma nova feature do backend foi feita, 
é necessário commitar primeiramente na branch "backend", a fim de manter um bom histórico de alterações do projeto.

Após finalizar a feature, fazer merge com squash na branch "dev". Squash para não poluir a branch de desenvolvimento.

Assim que os testes finais na branch "dev" estarem concluídos, fazer PR para a branch main. Ela será a única que exigirá aprovação de todos os membros.
