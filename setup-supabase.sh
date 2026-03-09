#!/bin/bash
set -e

echo "╔════════════════════════════════════════════╗"
echo "║  🚀 SUPABASE SETUP – Automatizovaný        ║"
echo "╚════════════════════════════════════════════╝"
echo ""

# STEP 1: Vytvořit .env
echo "📝 STEP 1: Vytvářím server/.env..."
if [ -f "./server/.env" ]; then
    echo "⚠️  server/.env už existuje!"
else
    cp ./server/.env.example ./server/.env
    echo "✅ Vytvořen server/.env"
fi

echo ""
echo "📋 STEP 2: Co musíš udělat v Supabase:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1️⃣  Jdi na: https://app.supabase.com/"
echo "2️⃣  Settings → API"
echo "3️⃣  Zkopíruj 'Project URL' a 'Service Role Secret'"
echo ""
echo "4️⃣  Vrať se sem a spusť:"
echo "    nano server/.env"
echo ""
echo "5️⃣  Vyplň tyto 2 řádky:"
echo "    SUPABASE_URL=<tvá Project URL>"
echo "    SUPABASE_SERVICE_ROLE_KEY=<tvůj Service Role Secret>"
echo ""
echo "    (Smazat 'YOUR_' prefixem)"
echo ""
echo "6️⃣  Ulož (Ctrl+O, Enter, Ctrl+X)"
echo ""
echo "7️⃣  Spusť tuto SQL v Supabase (SQL Editor → New Query):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cat << 'SQL'
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id BIGSERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  source TEXT DEFAULT 'web_footer',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_newsletter_email ON newsletter_subscribers(email);
CREATE INDEX idx_newsletter_active ON newsletter_subscribers(is_active);
SQL
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "8️⃣  Vrať se sem a spusť:"
echo "    npm run dev"
echo ""
echo "✅ Hotovo! Newsletter by měl fungovat."
echo ""
