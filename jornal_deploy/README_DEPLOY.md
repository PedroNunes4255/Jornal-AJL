# Jornal AJL — Versão estática (deploy)

Esta versão foi organizada para **funcionar 100% no Netlify (grátis)** como site estático.

## Estrutura
- `frontend/` → **pasta publicada no Netlify**
  - `index.html`
  - `pages/` (todas as páginas)
  - `CSS/style.css`
  - `js/site.js` (header/footer + menu + busca)
  - `js/news.js` (busca/filtro em “Todas as notícias”)
  - `js/tempo.js` (previsão do tempo via Open-Meteo)

## O que foi removido
- Firebase / curtidas / visitas
- Bootstrap / GSAP

## Como publicar no Netlify
1. Suba este projeto no GitHub
2. No Netlify, selecione o repositório
3. Publish directory: **frontend** (ou deixe o `netlify.toml` fazer isso)
4. Build command: **vazio** (nenhum)

## Observação importante (imagens)
A pasta é `frontend/IMG` (maiúsculo). No Netlify, o sistema é case-sensitive:
- certo: `../IMG/minhaImagem.jpg`
- errado: `../img/minhaImagem.jpg`

Atualizado em: 2026-02-09
