/* Jornal AJL — Tempo (Open-Meteo, sem chave) */
(() => {
  const out = (id) => document.getElementById(id);

  const fmtTemp = (t) => (t === null || t === undefined || Number.isNaN(Number(t))) ? '—' : `${Math.round(t)}°`;
  const fmtWind = (w) => (w === null || w === undefined || Number.isNaN(Number(w))) ? '—' : `${Math.round(w)} km/h`;

  const codeToText = (code) => {
    const c = Number(code);
    // mapa simplificado
    if (c === 0) return 'Céu limpo';
    if (c === 1 || c === 2) return 'Poucas nuvens';
    if (c === 3) return 'Nublado';
    if ([45, 48].includes(c)) return 'Nevoeiro';
    if ([51,53,55,56,57].includes(c)) return 'Garoa';
    if ([61,63,65,66,67].includes(c)) return 'Chuva';
    if ([71,73,75,77].includes(c)) return 'Neve / Granizo';
    if ([80,81,82].includes(c)) return 'Pancadas';
    if ([95,96,99].includes(c)) return 'Tempestade';
    return 'Tempo variável';
  };

  const icon = (code) => {
    const c = Number(code);
    if (c === 0) return '☀️';
    if (c === 1 || c === 2) return '🌤️';
    if (c === 3) return '☁️';
    if ([45,48].includes(c)) return '🌫️';
    if ([51,53,55,56,57].includes(c)) return '🌦️';
    if ([61,63,65,66,67].includes(c)) return '🌧️';
    if ([80,81,82].includes(c)) return '🌧️';
    if ([95,96,99].includes(c)) return '⛈️';
    if ([71,73,75,77].includes(c)) return '❄️';
    return '⛅';
  };

  const defaultPlace = {
    name: 'São Paulo (referência)',
    lat: -23.5505,
    lon: -46.6333,
  };

  const fetchForecast = async (lat, lon) => {
    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.searchParams.set('latitude', lat);
    url.searchParams.set('longitude', lon);
    url.searchParams.set('current', 'temperature_2m,apparent_temperature,weather_code,wind_speed_10m');
    url.searchParams.set('daily', 'temperature_2m_max,temperature_2m_min,weather_code');
    url.searchParams.set('timezone', 'America/Sao_Paulo');

    const res = await fetch(url.toString(), { cache: 'no-store' });
    if (!res.ok) throw new Error('Falha ao buscar previsão.');
    return res.json();
  };

  const render = (placeName, data) => {
    out('placeName').textContent = placeName;

    const cur = data.current || {};
    out('curIcon').textContent = icon(cur.weather_code);
    out('curTemp').textContent = fmtTemp(cur.temperature_2m);
    out('curDesc').textContent = codeToText(cur.weather_code);
    out('curFeels').textContent = fmtTemp(cur.apparent_temperature);
    out('curWind').textContent = fmtWind(cur.wind_speed_10m);

    const daily = data.daily || {};
    const days = daily.time || [];
    const max = daily.temperature_2m_max || [];
    const min = daily.temperature_2m_min || [];
    const codes = daily.weather_code || [];

    const rows = days.slice(0,7).map((d,i) => {
      const date = new Date(d + 'T00:00:00');
      const label = date.toLocaleDateString('pt-BR', { weekday:'short', day:'2-digit', month:'2-digit' });
      return `
        <div class="wx-row">
          <div class="wx-day">${label}</div>
          <div class="wx-ic">${icon(codes[i])}</div>
          <div class="wx-desc">${codeToText(codes[i])}</div>
          <div class="wx-temp"><strong>${fmtTemp(max[i])}</strong> <span class="wx-min">${fmtTemp(min[i])}</span></div>
        </div>
      `;
    }).join('');

    out('dailyList').innerHTML = rows || '<div class="note">Sem dados diários.</div>';
  };

  const setStatus = (msg) => { out('status').textContent = msg || ''; };

  const load = async (place) => {
    try{
      setStatus('Carregando previsão…');
      const data = await fetchForecast(place.lat, place.lon);
      render(place.name, data);
      setStatus('');
    }catch(err){
      setStatus('Não foi possível carregar a previsão agora. Verifique sua internet e tente novamente.');
      console.error(err);
    }
  };

  const btn = out('useLocation');
  if (btn && navigator.geolocation) {
    btn.addEventListener('click', () => {
      setStatus('Pedindo sua localização…');
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          load({
            name: 'Sua localização',
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
          });
        },
        () => {
          setStatus('Localização bloqueada. Usando São Paulo como referência.');
          load(defaultPlace);
        },
        { enableHighAccuracy:false, timeout: 10000, maximumAge: 120000 }
      );
    });
  }

  // start
  load(defaultPlace);
})();