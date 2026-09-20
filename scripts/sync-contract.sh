#!/usr/bin/env bash
# Sincroniza el contrato OpenAPI del backend (opción A, ADR-008 del back) y regenera el cliente tipado.
# Uso: pnpm sync-contract            (usa ../finanzapp-back)
#      BACK_REPO=/ruta/al/back pnpm sync-contract
set -euo pipefail
cd "$(dirname "$0")/.."
BACK_REPO="${BACK_REPO:-../finanzapp-back}"
SRC="$BACK_REPO/contracts/openapi.json"
[ -f "$SRC" ] || { echo "No se encontró $SRC (¿corriste 'pnpm openapi:generate' en el back?)" >&2; exit 1; }
cp "$SRC" contracts/openapi.json
npx openapi-typescript contracts/openapi.json -o src/core-react/api/schema.d.ts
echo "Contrato sincronizado desde $SRC"
