# Alinhamento Stitch x Projeto Principal

Este documento organiza o que foi trazido no projeto do Stitch e como transformar em entregas implementáveis no produto principal.

## Origem (projeto Stitch analisado)

Projeto: `projects/11827324003945686641`

Telas identificadas:
- Dashboard Principal (PT-BR)
- Gerenciador de Pesquisas (PT-BR)
- Editor de Perguntas (PT-BR)
- Gerenciador de Usuários (PT-BR)
- Configurações de SMTP (PT-BR)
- Dashboard Mobile (PWA)
- Pesquisas Mobile (PWA)
- Editor Mobile (PWA)
- Código-fonte e documentação comentados (PT-BR)

## Matriz de aderência

### Já implementado
- Dashboard administrativo
- Listagem e gestão de pesquisas
- Editor de perguntas
- Gestão de usuários (RBAC)
- Fluxo responder pesquisa por token

### Implementado nesta rodada
- Tela administrativa de Configurações SMTP
- Diagnóstico SMTP em API dedicada
- Teste de conexão SMTP em tempo real no painel
- Entrada de navegação para SMTP no menu lateral
- Dashboard com seletor de período 7/30/90 dias e gráfico de tendências (envios vs. respostas)
- Resultados com filtro por pergunta e exportação CSV (gerada no cliente, UTF-8 BOM)
- SMTP: histórico dos últimos 10 testes com timestamp e resultado (persistido no localStorage)

### Parcial (necessita evolução)
- Experiência mobile (há responsividade, mas não há PWA completo)
- Dashboards sem visualizações avançadas (gráficos, comparativos e tendências)
- Resultados sem filtros analíticos por período/pergunta/segmento

### Não implementado
- Modo PWA completo (manifest, service worker, install prompt, offline)
- Navegação mobile dedicada (bottom navigation e fluxos touch-first)
- Estrutura de documentação técnica no padrão da tela "Código-fonte e documentação comentados"

## Backlog priorizado

## Fase 1 - Consolidar paridade visual/funcional ✅ Concluída
1. ~~Refinar Dashboard para incluir tendências por período (7/30/90 dias).~~
2. ~~Expandir Resultados com filtros por pergunta e exportação CSV.~~
3. ~~Completar tela SMTP com histórico de testes e última validação.~~

Critérios de aceite:
- Indicadores com período selecionável em dashboard.
- Filtros funcionais e exportação no módulo de resultados.
- SMTP mostra último teste com timestamp e resultado.

## Fase 2 - Mobile/PWA (médio prazo)
1. Criar `manifest.webmanifest` e ícones de app.
2. Adicionar service worker para cache de shell e páginas críticas.
3. Introduzir navegação mobile dedicada para Dashboard, Pesquisas e Editor.
4. Ajustar componentes para padrões touch (área mínima de toque, sticky actions).

Critérios de aceite:
- Aplicação instalável em Android/iOS suportado.
- Navegação mobile com paridade mínima das três telas-chave do Stitch.
- Lighthouse PWA >= 80.

## Fase 3 - Governança e observabilidade (médio/longo prazo)
1. Telemetria de uso por tela (eventos de navegação e ações críticas).
2. Log estruturado para falhas de SMTP, disparo e resposta.
3. Documentação técnica viva em `docs/` com runbooks operacionais.

Critérios de aceite:
- Eventos críticos registrados com contexto da empresa (tenant).
- Runbook de incidentes de envio e autenticação publicado.

## Organização de implementação (sugestão de sprints)

Sprint A:
- Dashboard tendências
- Resultados com filtros

Sprint B:
- PWA base (manifest + SW)
- Navegação mobile principal

Sprint C:
- Observabilidade
- Documentação operacional

## Dependências técnicas
- Confirmar estratégia de service worker no Next.js (plugin/manual).
- Definir storage para histórico de verificação SMTP (tabela própria ou log estruturado).
- Definir padrão de eventos para analytics (camada `services/telemetry`).

## Riscos
- PWA pode conflitar com cache de dados sensíveis por tenant se não houver política clara.
- Métricas sem anonimização mínima podem introduzir risco de privacidade.
- Evoluções de dashboard podem exigir índices adicionais no banco.

## Próximo passo recomendado
- Iniciar Sprint A com os dois primeiros itens de analytics (dashboard + resultados), pois geram valor imediato de negócio com baixo risco arquitetural.
