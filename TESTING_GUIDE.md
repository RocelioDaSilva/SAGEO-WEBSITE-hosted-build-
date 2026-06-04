# 🚀 SAGEO 2026 — Guia Completo de Testes (Layout, Performance, Lighthouse)

Após os testes de segurança, aqui estão as instruções para validar layout, responsividade e performance.

---

## **1. TESTES DE LAYOUT E RESPONSIVIDADE (Manual)**

### Passo 1.1: Abrir a aplicação no Chrome DevTools

1. **Servidor local:**
   ```powershell
   cd "c:\Users\rocel\OneDrive\Desktop\smc\website da SAGEO\Main Live Website (dev build)"
   npm run dev
   ```
   Aguarde até ver: `Server running on port 3000`

2. **Abrir no browser:**
   - Abra o Chrome (recomendado para Lighthouse)
   - Navegue para `http://localhost:3000`

3. **Ativar DevTools:**
   - Pressione `F12` ou `Ctrl+Shift+I`
   - Clique no ícone **Device Toolbar** (ou `Ctrl+Shift+M`) para ativar o modo responsivo

### Passo 1.2: Testar ecrãs pequenos

Nos DevTools, mude para estes tamanhos de viewport (um de cada vez):

| Dispositivo | Largura | Verificações |
|---|---|---|
| **iPhone SE** | 375px | Sem scroll horizontal; navegação visível; imagens ao escala |
| **Galaxy S20** | 360px | Texto legível; botões clicáveis; cards com flex-wrap |
| **iPhone 12** | 390px | Layouts ajustam-se; gap entre elementos mantém-se |
| **iPad** | 768px | Navegação secundária visível; colunas reorganizadas |
| **Desktop** | 1200px+ | Sem scroll horizontal; layout fluido |

**Para cada tamanho:**
- Abra `http://localhost:3000` e navegue por todas as páginas/tabs:
  - Homepage (Cronograma)
  - Painel de Registo
  - Check-in (Painel Admin)
  - Galeria
  - Painel Administrador

- **Red flags (erros a relatar):**
  - Barra de scroll horizontal aparecer
  - Texto cortado ou ilegível
  - Botões fora da zona clicável
  - Imagens não carregarem ou deformadas
  - Elementos sobrepostos

### Passo 1.3: Inspecionar Console

Nos DevTools, abra a aba **Console** (F12 → Console):

- **Procure por erros em vermelho** (ex.: `Uncaught TypeError`, `Failed to load...`)
- **Procure por avisos em amarelo** (ex.: `Deprecation Warning`)
- Confirme se há mensagens de rede bloqueadas (CORS, CSP)

**Esperado:**
- Sem erros críticos de JavaScript
- Mensagens de log normais do servidor (ex.: `[Email Mock Simulation]`, `Server running...`)

---

## **2. TESTE DE PERFORMANCE COM LIGHTHOUSE**

### Passo 2.1: Instalar Lighthouse CLI (opcional)

```powershell
npm install -g @lhci/cli@latest lighthouse
```

### Passo 2.2: Build para produção (teste mais realista)

```powershell
cd "c:\Users\rocel\OneDrive\Desktop\smc\website da SAGEO\Main Live Website (dev build)"
npm run build
```

Aguarde até terminar. Resultados estarão em `dist/`.

### Passo 2.3: Usar Lighthouse no Chrome DevTools (método mais rápido)

1. **Abra DevTools** (F12)
2. Clique na aba **Lighthouse** (ou menu **▶** → **More tools** → **Lighthouse**)
3. Selecione:
   - **Mode:** `Mobile` (por padrão)
   - **Categories:** ✅ `Performance`, ✅ `Accessibility`, ✅ `Best Practices`, ✅ `SEO`
4. **Clique em "Analyze page load"**

Aguarde 30–60 segundos.

### Passo 2.4: Interpretar resultados

**Métricas de Performance esperadas:**

| Métrica | Alvo | Status |
|---|---|---|
| **First Contentful Paint (FCP)** | < 1.8s | 🟢 Bom |
| **Largest Contentful Paint (LCP)** | < 2.5s | 🟢 Bom |
| **Cumulative Layout Shift (CLS)** | < 0.1 | 🟢 Bom |
| **Time to Interactive (TTI)** | < 3.8s | 🟢 Bom |

**Interpretação dos scores (0–100):**
- **90–100:** Excelente
- **50–89:** Melhorias recomendadas
- **0–49:** Problemas críticos

### Passo 2.5: Executar Lighthouse CLI para relatório detalhado (opcional)

```powershell
# A partir da raiz do projeto:
lighthouse http://localhost:3000 `
  --chrome-flags="--headless" `
  --output=html `
  --output-path="lighthouse-report.html" `
  --emulated-form-factor=mobile
```

Após terminar, um ficheiro `lighthouse-report.html` será gerado. Abra-o no browser para ver o relatório completo.

---

## **3. TESTE DE LAZY LOADING (Network tab)**

### Passo 3.1: Abrir Network tab

1. **DevTools → aba Network**
2. **Filter:** Escreva `img` para filtrar apenas imagens

### Passo 3.2: Verificar carregamento de imagens

1. **Refresque a página** (`F5`)
2. **Role para baixo lentamente** na galeria ou cronograma
3. **Observações esperadas:**
   - Imagens **acima da linha de visão** não devem estar listadas inicialmente
   - Ao fazer scroll para baixo, as imagens fora da viewport devem começar a carregar
   - Tamanho de cada imagem na aba **Network** deve ser reduzido (ex.: `?w=400&q=75`)

**Red flags:**
- Todas as imagens carregam na inicialização (sem lazy loading)
- Imagens com tamanho excessivo (>500KB)

---

## **4. TESTE DE EFEITOS HOVER E ANIMAÇÕES**

### Verificações manuais:

1. **Hover sobre cartas de eventos:**
   - Deve haver leve sombra dourada
   - Escala 1.02x (ligeiro zoom)
   - Sem travamentos de FPS

2. **Hover sobre botões:**
   - Cor de fundo muda
   - Cursor muda para `pointer`
   - Sem salto ou layout shift

3. **Animações de transição (moderação):**
   - Ao aprovar/rejeitar, o card desaparece com fade-out suave
   - Histórico atualiza sem recarregar a página
   - Sem glitches visuais

**Ferramenta:** DevTools → **Performance** tab:
- Clique **Record**
- Faça interações (hover, clique)
- Clique **Stop**
- Procure por picos no gráfico (FPS deve manter-se acima de 60)

---

## **5. COMANDOS RÁPIDOS (PowerShell)**

### Iniciar servidor com env vars para testes:

```powershell
$env:ADMIN_PASSCODES='SAGEO2026'
$env:NODE_ENV='development'
npm run dev
```

### Build e servir versão production:

```powershell
npm run build
npm run start  # Inicia o servidor a partir de dist/
```

### Limpar cache e reinstalar dependências:

```powershell
rm -Recurse node_modules -Force
rm package-lock.json
npm install
```

---

## **6. CHECKLIST FINAL**

Marca ✅ cada item após verificar:

### Segurança
- [ ] Console sem erros de JavaScript críticos
- [ ] Sem credenciais visíveis no HTML (`Ctrl+U` → procura por `SAGEO2026`, `@gmail.com`, API keys)
- [ ] Formulários validam input (sem injeção de scripts)

### Layout (Mobile 375px, 360px)
- [ ] Sem scroll horizontal
- [ ] Texto legível (tamanho mínimo 12px)
- [ ] Botões são clicáveis (área mínima 44x44px)
- [ ] Imagens carregam e mantêm proporção

### Layout (Tablet 768px)
- [ ] Navegação adapta-se
- [ ] Cards em 2 colunas (se aplicável)
- [ ] Sem gaps excessivos

### Layout (Desktop 1200px+)
- [ ] Conteúdo não está muito esticado
- [ ] Máximo de 3–4 colunas onde apropriado

### Performance (Lighthouse)
- [ ] Performance score ≥ 70 (mobile), ≥ 80 (desktop)
- [ ] FCP < 1.8s
- [ ] LCP < 2.5s
- [ ] CLS < 0.1
- [ ] Accessibility score ≥ 80

### Imagens
- [ ] Loading="lazy" presente em imagens da galeria
- [ ] URLs usam `getOptimizedImageUrl()` com width parametrizado
- [ ] Sem carregamento desnecessário fora da viewport

### Moderação (Admin)
- [ ] POST `/api/admin/gallery/approve` atualiza `moderated_at`
- [ ] POST `/api/admin/gallery/reject` atualiza `moderated_at`
- [ ] Histórico mostra últimos 5 itens moderados
- [ ] Aprovações/rejeições refletem-se sem recarregar página

### Email & Rate-Limiting
- [ ] POST `/api/send-email` para `@isptec.co.ao` → HTTP 200
- [ ] POST `/api/send-email` para `@gmail.com` → HTTP 403 Forbidden
- [ ] 10+ POSTs rápidos → HTTP 429 Too Many Requests no 11º

---

## **7. RELATÓRIO ESPERADO**

Após completar todos os testes, compile um relatório com:

1. **Estatísticas Lighthouse** (screenshot ou export HTML)
2. **Ecrãs testados** (listagem de viewport sizes)
3. **Red flags encontradas** (se houver)
4. **Recomendações** (ex.: "Considere adiar imagens >2MB", "Melhorar CLS em mobile")
5. **Status geral** (✅ Pronto para produção / ⚠️ Requer ajustes)

---

## **8. PRÓXIMOS PASSOS**

- [ ] Após validar tudo, commitar alterações de segurança (`ADMIN_PASSCODES`, remoção de DB dumps)
- [ ] Purgar histórico Git de ficheiros sensíveis (git-filter-repo)
- [ ] Fazer deploy em Vercel/Netlify (frontend) ou VPS (full stack)
- [ ] Rotacionar tokens de teste por tokens reais
- [ ] Configurar HTTPS e certificados SSL

---

**Dúvidas?** Consulte a secção de troubleshooting no `README.md` ou contacte a equipa técnica.

