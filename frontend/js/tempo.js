(function(){
  const out = document.getElementById('weatherOutput');
  const statusEl = document.getElementById('weatherStatus');

  function setStatus(t){ if(statusEl) statusEl.textContent = t; }
  function htmlEscape(s){ return String(s).replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

  async function fetchForecast(lat, lon){
    // Open-Meteo (sem chave)
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=America%2FSao_Paulo`;
    const r = await fetch(url, {cache:'no-store'});
    if(!r.ok) throw new Error('Falha ao buscar previsão');
    return r.json();
  }

  function render(data, label){
    const cur = data.current || {};
    const daily = data.daily || {};
    const days = daily.time || [];
    const maxs = daily.temperature_2m_max || [];
    const mins = daily.temperature_2m_min || [];
    const pops = daily.precipitation_probability_max || [];

    const rows = days.slice(0,7).map((d,i)=>{
      const dt = new Date(d+'T00:00:00');
      const day = dt.toLocaleDateString('pt-BR', {weekday:'short', day:'2-digit', month:'2-digit'});
      const max = (maxs[i]!=null) ? Math.round(maxs[i])+'°' : '—';
      const min = (mins[i]!=null) ? Math.round(mins[i])+'°' : '—';
      const pop = (pops[i]!=null) ? (Math.round(pops[i])+'%') : '—';
      return `<tr><td>${htmlEscape(day)}</td><td><strong>${max}</strong> / ${min}</td><td>${pop}</td></tr>`;
    }).join('');

    const curTemp = (cur.temperature_2m!=null) ? Math.round(cur.temperature_2m)+'°C' : '—';
    const hum = (cur.relative_humidity_2m!=null) ? Math.round(cur.relative_humidity_2m)+'%' : '—';
    const wind = (cur.wind_speed_10m!=null) ? Math.round(cur.wind_speed_10m)+' km/h' : '—';

    out.innerHTML = `
      <div class="widget">
        <header><h3>Previsão do tempo</h3><span class="small">${htmlEscape(label)}</span></header>
        <div class="pad">
          <div style="display:flex;gap:14px;flex-wrap:wrap;align-items:center">
            <div style="font-size:42px;font-weight:900;line-height:1">${curTemp}</div>
            <div class="small" style="display:grid;gap:6px">
              <div>Umidade: <strong>${hum}</strong></div>
              <div>Vento: <strong>${wind}</strong></div>
              <div style="color:var(--muted)">Fonte: Open‑Meteo</div>
            </div>
          </div>
          <div style="margin-top:12px;overflow:auto">
            <table style="width:100%;border-collapse:collapse">
              <thead>
                <tr style="text-align:left;color:var(--muted);font-size:13px">
                  <th style="padding:8px 6px;border-bottom:1px solid var(--border)">Dia</th>
                  <th style="padding:8px 6px;border-bottom:1px solid var(--border)">Temp.</th>
                  <th style="padding:8px 6px;border-bottom:1px solid var(--border)">Chuva</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  async function loadDefault(){
    setStatus('Carregando previsão de São Paulo...');
    try{
      const data = await fetchForecast(-23.5505, -46.6333);
      render(data, 'São Paulo (SP)');
      setStatus('');
    }catch(e){
      setStatus('Não foi possível carregar agora. Tente novamente mais tarde.');
      if(out) out.innerHTML = '';
    }
  }

  async function loadGeo(){
    if(!navigator.geolocation){
      setStatus('Seu navegador não suporta geolocalização.');
      return;
    }
    setStatus('Obtendo sua localização...');
    navigator.geolocation.getCurrentPosition(async (pos)=>{
      try{
        const {latitude, longitude} = pos.coords;
        setStatus('Carregando previsão da sua região...');
        const data = await fetchForecast(latitude, longitude);
        render(data, 'Sua localização');
        setStatus('');
      }catch(e){
        setStatus('Falha ao buscar previsão da sua localização. Mostrando São Paulo.');
        loadDefault();
      }
    }, ()=>{
      setStatus('Permissão negada. Mostrando São Paulo.');
      loadDefault();
    }, {enableHighAccuracy:false, timeout:8000});
  }

  const geoBtn = document.getElementById('useMyLocation');
  if(geoBtn) geoBtn.addEventListener('click', loadGeo);

  loadDefault();
})();
