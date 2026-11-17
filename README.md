# TV Início

Tela inicial própria para TVs LG com **webOS**, inspirada na interface da Apple TV: dock de apps favoritos, vitrine de filmes e séries, clima, cotações e abertura animada — tudo navegável pelo controle remoto.

## Funcionalidades

- **Dock de apps** configurável, lido da própria TV (`listLaunchPoints`), com *fallback* via socket SSAP para versões do webOS que bloqueiam a API em modo desenvolvedor
- **Todos os Apps** e **Entradas** (TV aberta, HDMI) com ocultação de apps de sistema
- **Vitrine "Para você"** com tendências do [TMDB](https://www.themoviedb.org/) (filmes e séries), com cache local
- **Widgets** de clima ([Open-Meteo](https://open-meteo.com/), sem chave) e cotações
- **Abertura** com vídeo opcional ou saudação em texto, exibida sempre, uma vez por dia ou nunca
- **Navegação espacial** pelo controle remoto (setas, OK, voltar), tema claro/escuro e ajustes persistidos
- **Modo demonstração**: aberto num navegador comum, usa uma lista fictícia de apps — dá para testar a interface sem TV

## Stack

JavaScript puro (ES5, compatível com o motor das TVs), HTML e CSS, sem framework nem etapa de build. Empacotamento e instalação via [webOS CLI](https://webostv.developer.lge.com/develop/tools/cli-introduction).

## Rodando

**No navegador (modo demonstração):** abra `app/index.html`.

**Na TV:**

1. Ative o *Developer Mode* na TV e cadastre-a no CLI: `npx ares-setup-device`
2. Ajuste `app/config.js` (dock, cidade do clima e, se quiser a vitrine, uma chave gratuita do TMDB)
3. Instale e abra:

```bash
npm install
TV_DEVICE=nome-da-tv npm run deploy
```

## Estrutura

```
app/
  index.html     # layout
  app.js         # navegação, apps, vitrine, widgets, abertura
  config.js      # personalização (dock, clima, TMDB, abertura)
  icones.js      # ícones SVG
  assets/brands  # logotipos (Simple Icons, licença em SIMPLE-ICONS-LICENSE.md)
deploy.mjs       # empacota, instala e abre na TV
```

## Licença

MIT
