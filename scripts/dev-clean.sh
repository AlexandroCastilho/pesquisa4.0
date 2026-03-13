#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="/workspaces/pesquisa4.0"

# Finaliza processos de dev que podem manter lock/porta.
# Nao inclui "npm run dev" para evitar matar o proprio "npm run dev:clean".
pkill -9 -f 'next-server|/workspaces/pesquisa4.0/.next/dev|node .*next' || true

# Remove lock stale do Next.
rm -f "$PROJECT_DIR/.next/dev/lock" || true

# Libera a porta 3000, se houver processo preso.
PIDS_3000=$(lsof -ti :3000 2>/dev/null || true)
if [[ -n "$PIDS_3000" ]]; then
  kill -9 $PIDS_3000 || true
fi

echo "Ambiente de dev limpo: processos finalizados, lock removido e porta 3000 liberada."
