// Ajustes da tela inicial. Os IDs vêm da lista de apps da TV (listLaunchPoints).
var CONFIG = {
  // Dock de apps, na ordem em que aparecem.
  dock: [
    'netflix',
    'youtube.leanback.v4',
    'amazon',
    'com.disney.disneyplus-prod',
    'com.wbd.stream',
    'com.apple.appletv',
    'globoplaywebos',
    'com.apple.applemusic'
  ],

  // Nunca aparecem em "Todos os Apps".
  ocultos: [
    'com.palmdts.devmode',
    'br.casa.inicio',
    'webos.day',
    'epoxyaisports',
    'com.webos.app.sportsteamsettings',
    'shortcutcopilot',
    'com.twin.app.gamingportal',
    'com.webos.app.discovery',
    'com.webos.app.homeconnect',
    'com.webos.app.camera'
  ],

  // Entradas da TV (o app de cada uma é fixo no webOS).
  entradas: [
    { id: 'com.webos.app.livetv', titulo: 'TV aberta', icone: 'tv' },
    { id: 'com.webos.app.hdmi1', titulo: 'HDMI 1', icone: 'hdmi' },
    { id: 'com.webos.app.hdmi2', titulo: 'HDMI 2', icone: 'hdmi' },
    { id: 'com.webos.app.hdmi3', titulo: 'HDMI 3', icone: 'hdmi' }
  ],

  // Clima (Open-Meteo, sem chave).
  clima: { cidade: 'São Paulo', lat: -23.5505, lon: -46.6333, fuso: 'America/Sao_Paulo' },

  // Vitrine "Para você": chave da API do TMDB (themoviedb.org → Configurações → API).
  // Aceita a "API Key" (v3) ou o "Token de leitura" (v4, começa com eyJ).
  tmdb: { chave: '', regiao: 'BR', idioma: 'pt-BR' },

  // Animação de abertura: coloque o vídeo em app/assets/intro.mp4.
  // Sem o arquivo, mostra a saudação em texto.
  intro: { video: 'assets/intro.mp4', saudacao: 'Bem-vindo!' }
};
