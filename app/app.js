// Tela inicial: vitrine (TMDB), dock de apps, entradas, widgets e ajustes.
// ES5 de propósito: os navegadores das TVs LG mais antigas não entendem sintaxe nova.
(function () {
  'use strict';

  var KEY = { LEFT: 37, UP: 38, RIGHT: 39, DOWN: 40, OK: 13, BACK: 461 };
  var noTV = !!(window.webOS && window.webOS.service && window.PalmServiceBridge);
  var TOPO_EXTRAS = -830; // deslocamento da página para mostrar a tela 2

  // Provedores do TMDB (região BR) → app da TV.
  var PROVEDORES = {
    8: 'netflix', 119: 'amazon', 337: 'com.disney.disneyplus-prod',
    1899: 'com.wbd.stream', 384: 'com.wbd.stream', 350: 'com.apple.appletv', 307: 'globoplaywebos'
  };
  var IDS_PROVEDORES = '8|119|337|1899|350|307';

  // Visual de cada app no dock (os demais usam o ícone da LG).
  var MARCAS = {
    netflix: { bg: '#141414', img: 'netflix.svg', w: 56, h: 56 },
    'youtube.leanback.v4': { bg: '#212121', img: 'youtube.svg', w: 42, h: 42, texto: 'YouTube', tam: 28 },
    amazon: { bg: 'linear-gradient(135deg,#25b4ea,#0f79af)', texto: 'prime video', tam: 30 },
    'com.disney.disneyplus-prod': { bg: 'linear-gradient(135deg,#0b1f5c,#174294)', img: 'disneyplus.svg', w: 117, h: 64 },
    'com.wbd.stream': { bg: 'linear-gradient(135deg,#6b3cf0,#2b2bd0)', texto: 'HBO Max', tam: 38 },
    'com.apple.appletv': { bg: '#0b0b0c', texto: 'Apple TV', tam: 34 },
    globoplaywebos: { bg: 'linear-gradient(135deg,#ff4d55,#ff8a3d)', img: 'globoplay.svg', w: 138, h: 30, branco: true },
    'com.apple.applemusic': { bg: 'linear-gradient(135deg,#fa233b,#fb6078)', texto: 'Apple Music', tam: 30 }
  };

  function $(id) { return document.getElementById(id); }
  function lista(nl) { return Array.prototype.slice.call(nl); }
  function contem(l, v) { return l.indexOf(v) !== -1; }
  function ler(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function gravar(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function lerJSON(k) { try { return JSON.parse(ler(k)); } catch (e) { return null; } }
  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt) e.textContent = txt;
    return e;
  }
  function icone(nome) { return ICONES[nome] || ''; }
  function pintarIcones(raiz) {
    lista(raiz.querySelectorAll('[data-icone]')).forEach(function (e) { e.innerHTML = icone(e.getAttribute('data-icone')); });
  }
  function getJSON(url, cb, headers) {
    var x = new XMLHttpRequest();
    x.open('GET', url, true);
    if (headers) for (var h in headers) x.setRequestHeader(h, headers[h]);
    x.timeout = 15000;
    x.onload = function () {
      var r = null;
      try { r = JSON.parse(x.responseText); } catch (e) {}
      cb(x.status >= 200 && x.status < 300 ? r : null);
    };
    x.onerror = x.ontimeout = function () { cb(null); };
    x.send();
  }

  // ---------- Ajustes ----------
  var OPCOES = [
    { k: 'tema', nome: 'Tema', valores: ['auto', 'claro', 'escuro'], rotulos: ['Automático', 'Claro', 'Escuro'] },
    { k: 'unidade', nome: 'Temperatura', valores: ['C', 'F'], rotulos: ['°C', '°F'] },
    { k: 'clima', nome: 'Widget do clima', bool: true },
    { k: 'cotacoes', nome: 'Widget de cotações', bool: true },
    { k: 'bitcoin', nome: 'Bitcoin', bool: true },
    { k: 'ethereum', nome: 'Ethereum', bool: true },
    { k: 'desempenho', nome: 'Widget de desempenho', bool: true },
    { k: 'abertura', nome: 'Animação de abertura', valores: ['sempre', 'dia', 'nunca'], rotulos: ['Sempre', '1x por dia', 'Desligada'] }
  ];
  var ajustes = { tema: 'auto', unidade: 'C', clima: true, cotacoes: false, bitcoin: false, ethereum: false, desempenho: false, abertura: 'sempre' };
  (function () { var s = lerJSON('inicio_ajustes'); if (s) for (var k in s) if (k in ajustes) ajustes[k] = s[k]; })();

  function salvarAjustes() { gravar('inicio_ajustes', JSON.stringify(ajustes)); }

  function renderAjustes() {
    var caixa = $('listaAjustes');
    var focoK = atual && atual.getAttribute('data-k');
    caixa.innerHTML = '';
    OPCOES.forEach(function (o) {
      var linha = el('div', 'ajuste', o.nome);
      linha.setAttribute('data-f', '');
      linha.setAttribute('data-k', o.k);
      if (o.bool) {
        linha.appendChild(el('span', 'chave' + (ajustes[o.k] ? ' on' : '')));
      } else {
        linha.appendChild(el('span', 'valor', '‹ ' + o.rotulos[o.valores.indexOf(ajustes[o.k])] + ' ›'));
      }
      caixa.appendChild(linha);
      if (o.k === focoK) focar(linha);
    });
  }

  function mudarAjuste(k, passo) {
    var o = OPCOES.filter(function (x) { return x.k === k; })[0];
    if (o.bool) ajustes[k] = !ajustes[k];
    else ajustes[k] = o.valores[(o.valores.indexOf(ajustes[k]) + passo + o.valores.length) % o.valores.length];
    salvarAjustes();
    renderAjustes();
    aplicarTema();
    renderWidgets();
  }

  // ---------- Tema ----------
  var solHoje = null; // { nascer: Date, por: Date }
  function aplicarTema() {
    var t = ajustes.tema;
    if (t === 'auto') {
      var agora = new Date();
      var dia = solHoje ? (agora >= solHoje.nascer && agora < solHoje.por) : (agora.getHours() >= 6 && agora.getHours() < 18);
      t = dia ? 'claro' : 'escuro';
    }
    document.body.className = t;
  }

  // ---------- Aviso ----------
  var avisoTimer;
  function aviso(txt, ms) {
    var a = $('aviso');
    a.textContent = txt;
    a.className = 'on';
    clearTimeout(avisoTimer);
    avisoTimer = setTimeout(function () { a.className = ''; }, ms || 3000);
  }

  // ---------- Relógio ----------
  function dd(n) { return n < 10 ? '0' + n : '' + n; }
  function tick() {
    var d = new Date();
    $('relogio').textContent = dd(d.getHours()) + ':' + dd(d.getMinutes());
  }

  // ---------- Navegação pelo controle ----------
  var atual = null;
  var ultimoDoGrupo = {};
  var painel = null;

  function visivel(e) { return e.offsetParent !== null || e.getClientRects().length > 0; }

  function focaveis() {
    var raiz = painel || $('pagina');
    return lista(raiz.querySelectorAll('[data-f]')).filter(visivel);
  }

  function focar(e) {
    if (!e) return;
    if (atual) atual.className = atual.className.replace(/ ?foco/g, '');
    atual = e;
    e.className += ' foco';
    var g = e.getAttribute('data-grupo');
    if (g) ultimoDoGrupo[g] = e;
    aoFocar(e);
  }

  function centro(r) { return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }

  function navegar(dx, dy) {
    if (!atual) { focar(focaveis()[0]); return; }
    var ra = atual.getBoundingClientRect();
    var ca = centro(ra);
    var melhor = null;
    var melhorNota = Infinity;
    focaveis().forEach(function (e) {
      if (e === atual) return;
      var r = e.getBoundingClientRect();
      var c = centro(r);
      var prim, sec;
      if (dx) {
        prim = (c.x - ca.x) * dx;
        sec = Math.abs(c.y - ca.y);
        if (prim <= 10 || sec > Math.max(ra.height, r.height)) return; // só na mesma linha
      } else {
        prim = (c.y - ca.y) * dy;
        sec = Math.abs(c.x - ca.x);
        if (prim <= 10) return;
      }
      var nota = prim + sec * (dx ? 3 : 0.6);
      if (nota < melhorNota) { melhorNota = nota; melhor = e; }
    });
    if (!melhor) return;
    // Ao entrar num grupo, volta para o item onde estava antes.
    var g = melhor.getAttribute('data-grupo');
    if (dy && g && g !== atual.getAttribute('data-grupo')) {
      var antes = ultimoDoGrupo[g];
      if (antes && antes.parentNode && visivel(antes)) melhor = antes;
    }
    focar(melhor);
  }

  function aoFocar(e) {
    var g = e.getAttribute('data-grupo');
    if (painel) {
      if (painel === $('painelTodos')) rolarGrade(e);
      return;
    }
    if (g === 'cartoes') destacarCartao(+e.getAttribute('data-i'));
    if (g === 'entradas' || g === 'atalhos' || g === 'widgets') rolarPagina(TOPO_EXTRAS);
    else if (g !== 'dock') rolarPagina(0);
  }

  var paginaY = 0;
  function rolarPagina(y) {
    if (y === paginaY) return;
    paginaY = y;
    $('pagina').style.transform = 'translateY(' + y + 'px)';
    if (y !== 0) medirDesempenho(); // só mede enquanto o widget está à vista
  }

  function ok() {
    if (!atual) return;
    var acao = atual.getAttribute('data-acao') || '';
    var k = atual.getAttribute('data-k');
    if (k) { mudarAjuste(k, 1); return; }
    if (acao.indexOf('app:') === 0) { abrirApp(acao.slice(4), atual.getAttribute('data-nome')); return; }
    if (acao === 'ajustes') { abrirPainel('painelAjustes'); return; }
    if (acao === 'todos') { abrirPainel('painelTodos'); return; }
    if (acao === 'entradas') { focar(ultimoDoGrupo.entradas || $('entradas').firstChild); return; }
    if (acao.indexOf('aba:') === 0) { trocarAba(acao.slice(4)); return; }
    if (acao === 'titulo') abrirTitulo(+atual.getAttribute('data-i'));
  }

  function voltar() {
    if (painel) { fecharPainel(); return; }
    if (paginaY !== 0) focar(ultimoDoGrupo.dock || $('dock').firstChild);
  }

  var focoAntesDoPainel = null;
  function abrirPainel(id) {
    focoAntesDoPainel = atual;
    painel = $(id);
    painel.className = 'painel aberto';
    if (id === 'painelAjustes') { renderAjustes(); focar($('listaAjustes').firstChild); }
    else { renderTodos(); focar($('gradeApps').firstChild); }
  }

  function fecharPainel() {
    painel.className = 'painel';
    painel = null;
    if (atual) atual.className = atual.className.replace(/ ?foco/g, '');
    atual = null;
    focar(focoAntesDoPainel);
  }

  var introAtiva = true;
  document.addEventListener('keydown', function (e) {
    if (introAtiva) { fecharIntro(); e.preventDefault(); return; }
    var k = atual && painel && atual.getAttribute('data-k');
    switch (e.keyCode) {
      case KEY.LEFT: if (k) mudarAjuste(k, -1); else navegar(-1, 0); break;
      case KEY.RIGHT: if (k) mudarAjuste(k, 1); else navegar(1, 0); break;
      case KEY.UP: navegar(0, -1); break;
      case KEY.DOWN: navegar(0, 1); break;
      case KEY.OK: ok(); break;
      case KEY.BACK: voltar(); break;
      default: return;
    }
    e.preventDefault();
  });

  // ---------- Apps da TV ----------
  var apps = {}; // id → { titulo, icone }
  var abrindo = false;

  function caminho(p) {
    if (!p) return '';
    if (/^(https?:|file:|data:)/i.test(p)) return p;
    return p.charAt(0) === '/' ? 'file://' + p : '';
  }

  function receberApps(lps) {
    gravar('inicio_apps', JSON.stringify(lps));
    apps = {};
    lps.forEach(function (lp) {
      if (!lp.id) return;
      apps[lp.id] = { id: lp.id, titulo: lp.title || lp.id, icone: caminho(lp.extraLargeIcon || lp.largeIcon || lp.icon), oculto: lp.hidden };
    });
    renderDock();
  }

  function buscarApps() {
    var cache = lerJSON('inicio_apps');
    if (cache) receberApps(cache);
    if (!noTV) { if (!cache) receberApps(demoApps()); return; }
    webOS.service.request('luna://com.webos.applicationManager', {
      method: 'listLaunchPoints',
      parameters: {},
      onSuccess: function (r) { if (r.launchPoints) receberApps(r.launchPoints); },
      onFailure: buscarViaSSAP
    });
  }

  // Algumas versões do webOS negam listLaunchPoints a apps do modo desenvolvedor;
  // o socket do controle remoto da própria TV lista os apps após um aceite único.
  function buscarViaSSAP() {
    var ws;
    try { ws = new WebSocket('ws://127.0.0.1:3000'); } catch (e) { return; }
    var chave = ler('inicio_ssap_key');
    ws.onopen = function () {
      var p = { pairingType: 'PROMPT', manifest: { manifestVersion: 1, appVersion: '1.0', permissions: ['READ_INSTALLED_APPS'] } };
      if (chave) p['client-key'] = chave;
      ws.send(JSON.stringify({ id: 'reg', type: 'register', payload: p }));
    };
    ws.onmessage = function (ev) {
      var m;
      try { m = JSON.parse(ev.data); } catch (e) { return; }
      if (m.id === 'reg' && m.type === 'response') {
        aviso('Aceite o pedido na tela para listar os apps.', 10000);
      } else if (m.id === 'reg' && m.type === 'registered') {
        gravar('inicio_ssap_key', m.payload['client-key']);
        ws.send(JSON.stringify({ id: 'apps', type: 'request', uri: 'ssap://com.webos.applicationManager/listLaunchPoints' }));
      } else if (m.id === 'apps') {
        if (m.payload && m.payload.launchPoints) receberApps(m.payload.launchPoints);
        ws.close();
      }
    };
  }

  function abrirApp(id, nome) {
    nome = nome || (apps[id] && apps[id].titulo) || id;
    if (abrindo) return;
    if (!noTV) { aviso('Abrir ' + nome + ' (só funciona na TV)'); return; }
    abrindo = true;
    var liberar = function () { abrindo = false; };
    webOS.service.request('luna://com.webos.applicationManager', {
      method: 'launch',
      parameters: { id: id },
      onSuccess: liberar,
      onFailure: function () { liberar(); aviso('Não consegui abrir ' + nome + '.'); }
    });
    setTimeout(liberar, 6000);
  }

  function tileApp(id, grupo, comNome) {
    var a = apps[id] || { id: id, titulo: id };
    var t = el('div', 'app');
    t.setAttribute('data-f', '');
    t.setAttribute('data-grupo', grupo);
    t.setAttribute('data-acao', 'app:' + id);
    t.setAttribute('data-nome', a.titulo);
    var m = !comNome && MARCAS[id];
    if (m) {
      t.style.background = m.bg;
      var linha = el('div', 'marca');
      if (m.img) {
        var img = el('img');
        img.src = 'assets/brands/' + m.img;
        img.style.cssText = 'display:inline-block;vertical-align:middle;width:' + m.w + 'px;height:' + m.h + 'px' +
          (m.branco ? ';-webkit-filter:brightness(0) invert(1);filter:brightness(0) invert(1)' : '');
        linha.appendChild(img);
      }
      if (m.texto) {
        var s = el('span', '', m.texto);
        s.style.cssText = 'display:inline-block;vertical-align:middle;font-size:' + m.tam + 'px' + (m.img ? ';margin-left:10px' : '');
        linha.appendChild(s);
      }
      t.appendChild(linha);
    } else {
      var nome = el('div', 'nomeApp', a.titulo);
      if (a.icone) {
        var i = el('img', 'lg');
        i.onerror = function () { t.removeChild(i); };
        i.src = a.icone;
        t.appendChild(i);
      }
      if (comNome || !a.icone) t.appendChild(nome);
    }
    return t;
  }

  function renderDock() {
    var d = $('dock');
    var focado = atual && atual.parentNode === d ? atual.getAttribute('data-acao') : null;
    d.innerHTML = '';
    CONFIG.dock.forEach(function (id) {
      if (noTV && !apps[id]) return; // app desinstalado
      var t = tileApp(id, 'dock');
      d.appendChild(t);
      if (focado === 'app:' + id) focar(t);
    });
    if (!atual) focar(d.firstChild);
  }

  function renderTodos() {
    var g = $('gradeApps');
    g.innerHTML = '';
    g.style.transform = '';
    Object.keys(apps).forEach(function (id) {
      if (apps[id].oculto || contem(CONFIG.ocultos, id)) return;
      g.appendChild(tileApp(id, 'todos', true));
    });
  }

  function rolarGrade(e) {
    var linha = Math.floor(e.offsetTop / 140);
    $('gradeApps').style.transform = 'translateY(' + (-Math.max(0, linha - 3) * 140) + 'px)';
  }

  function demoApps() {
    var nomes = { netflix: 'Netflix', 'youtube.leanback.v4': 'YouTube', amazon: 'Prime Video', 'com.disney.disneyplus-prod': 'Disney+',
      'com.wbd.stream': 'HBO Max', 'com.apple.appletv': 'Apple TV', globoplaywebos: 'Globoplay', 'com.apple.applemusic': 'Apple Music',
      'com.webos.app.livetv': 'Live TV', looke: 'Looke', 'com.webos.app.browser': 'Navegador Web' };
    return Object.keys(nomes).map(function (id) { return { id: id, title: nomes[id] }; });
  }

  // ---------- Entradas ----------
  function renderEntradas() {
    var c = $('entradas');
    CONFIG.entradas.forEach(function (en) {
      var t = el('div', 'chip');
      t.setAttribute('data-f', '');
      t.setAttribute('data-grupo', 'entradas');
      t.setAttribute('data-acao', 'app:' + en.id);
      t.setAttribute('data-nome', en.titulo);
      var i = el('i');
      i.setAttribute('data-icone', en.icone);
      t.appendChild(i);
      t.appendChild(el('span', '', en.titulo));
      c.appendChild(t);
    });
  }

  // ---------- Vitrine (TMDB) ----------
  var abaAtual = 'explorar';
  var titulos = [];
  var grandeI = 0;
  var detalhes = {};
  var ROTAS = {
    explorar: '/trending/all/week',
    filmes: '/discover/movie?watch_region=' + CONFIG.tmdb.regiao + '&with_watch_providers=' + IDS_PROVEDORES + '&sort_by=popularity.desc',
    series: '/discover/tv?watch_region=' + CONFIG.tmdb.regiao + '&with_watch_providers=' + IDS_PROVEDORES + '&sort_by=popularity.desc'
  };

  function tmdb(rota, cb) {
    var chave = CONFIG.tmdb.chave;
    var url = 'https://api.themoviedb.org/3' + rota + (rota.indexOf('?') < 0 ? '?' : '&') + 'language=' + CONFIG.tmdb.idioma;
    var headers = null;
    if (/^eyJ/.test(chave)) headers = { Authorization: 'Bearer ' + chave };
    else url += '&api_key=' + encodeURIComponent(chave);
    getJSON(url, cb, headers);
  }

  function trocarAba(aba) {
    abaAtual = aba;
    lista(document.querySelectorAll('.aba')).forEach(function (a) {
      var ativa = a.getAttribute('data-acao') === 'aba:' + aba;
      a.className = 'aba' + (ativa ? ' ativa' : '') + (a === atual ? ' foco' : '');
    });
    carregarVitrine();
  }

  function carregarVitrine() {
    if (!CONFIG.tmdb.chave) { vitrineVazia('Adicione a chave do TMDB em config.js para ver filmes e séries aqui.'); return; }
    var chaveCache = 'inicio_tmdb_' + abaAtual;
    var cache = lerJSON(chaveCache);
    if (cache && Date.now() - cache.em < 6 * 3600000) { renderVitrine(cache.itens); return; }
    if (cache) renderVitrine(cache.itens);
    var aba = abaAtual;
    tmdb(ROTAS[aba], function (r) {
      if (!r || !r.results) { if (!cache) vitrineVazia('Não consegui carregar a vitrine agora.'); return; }
      var itens = r.results.filter(function (x) { return x.backdrop_path && x.poster_path; }).slice(0, 20).map(function (x) {
        return { id: x.id, tipo: x.media_type || (aba === 'series' ? 'tv' : 'movie'), titulo: x.title || x.name, poster: x.poster_path, fundo: x.backdrop_path };
      }).filter(function (x) { return x.tipo === 'movie' || x.tipo === 'tv'; });
      gravar(chaveCache, JSON.stringify({ em: Date.now(), itens: itens }));
      if (aba === abaAtual) renderVitrine(itens);
    });
  }

  function vitrineVazia(msg) {
    titulos = [];
    var c = $('cartoes');
    c.innerHTML = '';
    var s = el('div', 'slot grande');
    var cartao = el('div', 'cartao');
    cartao.appendChild(el('div', 'vazio', msg));
    s.appendChild(cartao);
    c.appendChild(s);
  }

  function renderVitrine(itens) {
    titulos = itens;
    var c = $('cartoes');
    var tinhaFoco = atual && atual.getAttribute('data-grupo') === 'cartoes';
    c.innerHTML = '';
    itens.forEach(function (it, i) {
      var s = el('div', 'slot');
      var cartao = el('div', 'cartao');
      cartao.setAttribute('data-f', '');
      cartao.setAttribute('data-grupo', 'cartoes');
      cartao.setAttribute('data-acao', 'titulo');
      cartao.setAttribute('data-i', i);
      cartao.style.backgroundImage = 'url("https://image.tmdb.org/t/p/w342' + it.poster + '")';
      s.appendChild(cartao);
      var leg = el('div', 'legenda');
      leg.appendChild(el('div', 'tituloLeg', it.titulo));
      leg.appendChild(el('div', 'metaLeg'));
      s.appendChild(leg);
      c.appendChild(s);
    });
    ultimoDoGrupo.cartoes = null;
    destacarCartao(0);
    if (tinhaFoco && c.firstChild) focar(c.firstChild.firstChild);
  }

  function destacarCartao(i) {
    var slots = $('cartoes').children;
    var it = titulos[i];
    if (!it || !slots[i]) return;
    if (slots[grandeI]) {
      slots[grandeI].className = 'slot';
      slots[grandeI].firstChild.style.backgroundImage = 'url("https://image.tmdb.org/t/p/w342' + titulos[grandeI].poster + '")';
    }
    grandeI = i;
    slots[i].className = 'slot grande';
    slots[i].firstChild.style.backgroundImage = 'url("https://image.tmdb.org/t/p/w1280' + it.fundo + '")';
    $('cartoes').style.transform = 'translateX(' + (-i * 360) + 'px)';
    $('fundoImg').style.backgroundImage = 'url("https://image.tmdb.org/t/p/w300' + it.fundo + '")';
    carregarDetalhes(it, function (d) {
      if (grandeI === i) slots[i].lastChild.lastChild.textContent = d.meta;
    });
  }

  function carregarDetalhes(it, cb) {
    var k = it.tipo + it.id;
    if (detalhes[k]) { cb(detalhes[k]); return; }
    tmdb('/' + it.tipo + '/' + it.id + '?append_to_response=watch/providers', function (r) {
      if (!r) return;
      var partes = [];
      var genero = r.genres && r.genres[0] && r.genres[0].name;
      if (it.tipo === 'tv') {
        partes.push('Série');
        if (genero) partes.push(genero);
        if (r.number_of_seasons) partes.push(r.number_of_seasons + (r.number_of_seasons > 1 ? ' temporadas' : ' temporada'));
      } else {
        if (genero) partes.push(genero);
        if (r.runtime) partes.push(Math.floor(r.runtime / 60) + ' h ' + (r.runtime % 60) + ' min');
      }
      var prov = null;
      var br = r['watch/providers'] && r['watch/providers'].results && r['watch/providers'].results[CONFIG.tmdb.regiao];
      (br && br.flatrate || []).some(function (p) {
        if (PROVEDORES[p.provider_id]) { prov = { app: PROVEDORES[p.provider_id], nome: p.provider_name }; return true; }
        return false;
      });
      if (prov) partes.push(prov.nome);
      detalhes[k] = { meta: partes.join(' · '), prov: prov };
      cb(detalhes[k]);
    });
  }

  function abrirTitulo(i) {
    var d = titulos[i] && detalhes[titulos[i].tipo + titulos[i].id];
    if (d && d.prov) abrirApp(d.prov.app);
    else aviso('Não encontrei este título nos seus streamings.');
  }

  // ---------- Widgets ----------
  var dadosClima = null;
  var dadosCot = null;
  var WMO = [
    [[0], 'Céu limpo', 'sol'], [[1, 2], 'Parcialmente nublado', 'solNuvem'], [[3], 'Nublado', 'nuvem'],
    [[45, 48], 'Neblina', 'neblina'], [[51, 53, 55, 56, 57], 'Garoa', 'chuva'], [[61, 63, 65, 66, 67], 'Chuva', 'chuva'],
    [[71, 73, 75, 77, 85, 86], 'Neve', 'neve'], [[80, 81, 82], 'Pancadas de chuva', 'chuva'], [[95, 96, 99], 'Tempestade', 'tempestade']
  ];
  function tempo(cod, dia) {
    for (var i = 0; i < WMO.length; i++) {
      if (contem(WMO[i][0], cod)) return { desc: WMO[i][1], ic: WMO[i][2] === 'sol' && !dia ? 'lua' : WMO[i][2] };
    }
    return { desc: '', ic: 'nuvem' };
  }
  function grau(c) { return Math.round(ajustes.unidade === 'F' ? c * 9 / 5 + 32 : c) + '°'; }

  function buscarClima() {
    var c = CONFIG.clima;
    getJSON('https://api.open-meteo.com/v1/forecast?latitude=' + c.lat + '&longitude=' + c.lon +
      '&current=temperature_2m,weather_code,is_day&hourly=temperature_2m,weather_code,is_day' +
      '&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=' + encodeURIComponent(c.fuso) + '&forecast_days=2',
    function (r) {
      if (!r || !r.current) return;
      dadosClima = r;
      solHoje = { nascer: new Date(r.daily.sunrise[0]), por: new Date(r.daily.sunset[0]) };
      aplicarTema();
      renderWidgets();
    });
  }

  function buscarCotacoes() {
    if (!ajustes.cotacoes && !ajustes.bitcoin && !ajustes.ethereum) return;
    getJSON('https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL,BTC-BRL,ETH-BRL', function (r) {
      if (r) { dadosCot = r; renderWidgets(); }
    });
  }

  function widgetClima() {
    var w = el('div', 'widget wClima vidro');
    w.appendChild(el('h3', '', CONFIG.clima.cidade));
    var r = dadosClima;
    if (!r) { w.appendChild(el('div', 'desc', 'Carregando…')); return w; }
    var t = tempo(r.current.weather_code, r.current.is_day);
    var agora = el('div', 'agora');
    var ic = el('i', 'icAgora');
    ic.innerHTML = icone(t.ic);
    agora.appendChild(ic);
    agora.appendChild(el('span', 'temp', grau(r.current.temperature_2m)));
    agora.appendChild(el('div', 'desc', t.desc));
    agora.appendChild(el('div', 'maxmin', 'Máx. ' + grau(r.daily.temperature_2m_max[0]) + '  Mín. ' + grau(r.daily.temperature_2m_min[0])));
    w.appendChild(agora);

    var horas = el('div', 'horas');
    var d = new Date();
    var chave = d.getFullYear() + '-' + dd(d.getMonth() + 1) + '-' + dd(d.getDate()) + 'T' + dd(d.getHours()) + ':00';
    var ini = Math.max(0, r.hourly.time.indexOf(chave) + 1);
    for (var i = ini; i < ini + 6 && i < r.hourly.time.length; i++) {
      var h = el('div', 'hora', r.hourly.time[i].slice(11, 13) + 'h');
      var hi = el('i');
      hi.innerHTML = icone(tempo(r.hourly.weather_code[i], r.hourly.is_day[i]).ic);
      h.appendChild(hi);
      h.appendChild(el('b', '', grau(r.hourly.temperature_2m[i])));
      horas.appendChild(h);
    }
    w.appendChild(horas);

    var sol = el('div', 'sol');
    sol.innerHTML = '<i>' + icone('nascer') + '</i><span>' + r.daily.sunrise[0].slice(11) + '</span>' +
      '<i>' + icone('por') + '</i><span>' + r.daily.sunset[0].slice(11) + '</span>';
    w.appendChild(sol);
    return w;
  }

  function widgetCotacoes() {
    var w = el('div', 'widget wCot vidro');
    w.appendChild(el('h3', '', 'Cotações'));
    var itens = [];
    if (ajustes.cotacoes) itens.push(['USDBRL', 'Dólar'], ['EURBRL', 'Euro']);
    if (ajustes.bitcoin) itens.push(['BTCBRL', 'Bitcoin']);
    if (ajustes.ethereum) itens.push(['ETHBRL', 'Ethereum']);
    itens.forEach(function (it) {
      var v = dadosCot && dadosCot[it[0]] && +dadosCot[it[0]].bid;
      var linha = el('div', 'linha', it[1]);
      linha.appendChild(el('b', '', v ? 'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: v > 1000 ? 0 : 2 }) : '—'));
      w.appendChild(linha);
    });
    return w;
  }

  var modelo = '';
  if (noTV && webOS.deviceInfo) webOS.deviceInfo(function (i) { modelo = i.modelName || ''; });

  function widgetDesempenho() {
    var w = el('div', 'widget wDes vidro');
    w.id = 'wDes';
    var h = el('h3', '', 'Desempenho');
    w.appendChild(h);
    w.appendChild(el('div', 'fps', '—'));
    var barra = el('div', 'barra');
    barra.appendChild(el('div'));
    w.appendChild(barra);
    w.appendChild(el('div', 'itens'));
    return w;
  }

  var medindo = false;
  function medirDesempenho() {
    if (medindo || !ajustes.desempenho) return;
    medindo = true;
    var quadros = 0;
    var inicio = Date.now();
    function passo() {
      quadros++;
      var w = $('wDes');
      if (!w || paginaY === 0 || !ajustes.desempenho) { medindo = false; return; }
      var dt = Date.now() - inicio;
      if (dt >= 1000) {
        var fps = Math.round(quadros * 1000 / dt);
        quadros = 0;
        inicio = Date.now();
        w.children[1].innerHTML = fps + '<small>FPS</small>';
        w.children[2].firstChild.style.width = Math.min(100, fps / 60 * 100) + '%';
        var mem = window.performance && performance.memory ? (performance.memory.usedJSHeapSize / 1048576).toFixed(1) + ' MB' : '—';
        var nucleos = navigator.hardwareConcurrency ? navigator.hardwareConcurrency + ' núcleos' : '—';
        w.children[3].innerHTML =
          '<div>Modelo <b>' + (modelo || '—') + '</b></div>' +
          '<div>Memória do app <b>' + mem + '</b></div>' +
          '<div>Elementos na tela <b>' + document.getElementsByTagName('*').length + '</b></div>' +
          '<div>Hardware <b>' + nucleos + (navigator.deviceMemory ? ' · ~' + navigator.deviceMemory + ' GB' : '') + '</b></div>';
      }
      requestAnimationFrame(passo);
    }
    requestAnimationFrame(passo);
  }

  function renderWidgets() {
    var c = $('widgets');
    c.innerHTML = '';
    if (ajustes.clima) c.appendChild(widgetClima());
    if (ajustes.cotacoes || ajustes.bitcoin || ajustes.ethereum) {
      c.appendChild(widgetCotacoes());
      if (!dadosCot) buscarCotacoes();
    }
    if (ajustes.desempenho) {
      c.appendChild(widgetDesempenho());
      if (paginaY !== 0) medirDesempenho();
    }
    // O clima ocupa o espaço que sobra na linha (1700px).
    var clima = ajustes.clima && c.firstChild;
    if (clima) {
      var resto = 1700;
      lista(c.children).forEach(function (w, i) { if (i) resto -= w.offsetWidth + 30; });
      clima.style.width = resto + 'px';
      if (resto < 900) clima.className += ' compacto';
    }
  }

  // ---------- Abertura ----------
  function fecharIntro() {
    if (!introAtiva) return;
    introAtiva = false;
    var v = $('introVideo');
    try { v.pause(); } catch (e) {}
    $('intro').className = 'saindo';
    setTimeout(function () { $('intro').className = 'fora'; v.removeAttribute('src'); v.load(); }, 900);
  }

  function mostrarSaudacao() {
    var t = $('introTexto');
    t.textContent = CONFIG.intro.saudacao;
    setTimeout(function () { t.className = 'on'; }, 50);
    setTimeout(fecharIntro, 2600);
  }

  function iniciarIntro() {
    var hoje = new Date().toDateString();
    if (ajustes.abertura === 'nunca' || (ajustes.abertura === 'dia' && ler('inicio_intro_dia') === hoje)) {
      introAtiva = false;
      $('intro').className = 'fora';
      return;
    }
    gravar('inicio_intro_dia', hoje);
    var v = $('introVideo');
    var decidido = false;
    var semVideo = function () { if (decidido) return; decidido = true; v.style.display = 'none'; mostrarSaudacao(); };
    // Autoplay só é liberado sem som; começa mudo e tira o mudo assim que tocar.
    v.muted = true;
    v.setAttribute('muted', '');
    v.onerror = semVideo;
    v.onended = fecharIntro;
    var tentarTocar = function () {
      if (decidido) return;
      decidido = true;
      v.style.display = 'block';
      var p = v.play();
      if (p && p.then) p.then(desmutar).catch(semVideo);
      else { desmutar(); } // navegadores antigos: play() não devolve Promise
    };
    function desmutar() {
      try { v.muted = false; v.volume = 1; } catch (e) {}
      if (v.muted) v.removeAttribute('muted'); // se a TV re-mutar, segue sem som
    }
    v.oncanplay = tentarTocar;
    v.onloadeddata = tentarTocar;
    setTimeout(semVideo, 8000); // vídeo ausente ou lento demais
    v.src = CONFIG.intro.video;
    v.load();
  }

  // Ao voltar para o app (ele já estava aberto), recarrega os dados.
  document.addEventListener('webOSRelaunch', function () {
    if (painel) fecharPainel();
    buscarApps();
    buscarClima();
  });

  // ---------- Início ----------
  lista(document.querySelectorAll('.aba')).forEach(function (a) { a.setAttribute('data-acao', 'aba:' + a.getAttribute('data-aba')); });
  aplicarTema();
  tick();
  setInterval(tick, 10000);
  setInterval(aplicarTema, 60000);
  setInterval(buscarClima, 30 * 60000);
  setInterval(buscarCotacoes, 15 * 60000);
  renderEntradas();
  pintarIcones(document);
  renderWidgets();
  buscarApps();
  carregarVitrine();
  buscarClima();
  iniciarIntro();

  // Prévia no PC: index.html#claro, #escuro e/ou #extras.
  if (!noTV && location.hash) {
    var h = location.hash;
    if (/claro|escuro/.test(h)) { ajustes.tema = /claro/.test(h) ? 'claro' : 'escuro'; aplicarTema(); }
    if (/extras/.test(h)) { ajustes.cotacoes = ajustes.desempenho = true; renderWidgets(); focar($('entradas').firstChild); }
    fecharIntro();
  }
})();
