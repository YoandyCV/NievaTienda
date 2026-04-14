// Configuración: cambia esta URL por la de tu Google Apps Script
const SCRIPT_URL = 'https://script.google.com/macros/s/TU_ID_AQUI/exec';

// Cargar apps desde apps.json
async function cargarApps() {
  try {
    const response = await fetch('apps.json');
    if (!response.ok) throw new Error('No se pudo cargar apps.json');
    const apps = await response.json();
    
    // Obtener contadores globales
    const contadores = await obtenerContadores();
    
    // Renderizar tarjetas
    const container = document.getElementById('appsContainer');
    container.innerHTML = '';
    
    apps.forEach(app => {
      const card = crearTarjeta(app, contadores[app.id] || 0);
      container.appendChild(card);
    });
  } catch (error) {
    document.getElementById('appsContainer').innerHTML = `<div class="loader">❌ Error cargando datos: ${error.message}</div>`;
  }
}

// Obtener todos los contadores desde Google Sheets
async function obtenerContadores() {
  try {
    const url = `${SCRIPT_URL}?action=get`;
    const res = await fetch(url);
    if (!res.ok) throw new Error();
    const data = await res.json();
    return data;
  } catch (error) {
    console.warn('No se pudo obtener contadores, se usarán valores locales');
    return {};
  }
}

// Incrementar contador para una app
async function incrementarContador(appId) {
  try {
    const url = `${SCRIPT_URL}?action=increment&appId=${encodeURIComponent(appId)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error();
    const data = await res.json();
    return data.success ? data.newValue : null;
  } catch (error) {
    console.error('Error al incrementar contador', error);
    return null;
  }
}

// Crear tarjeta HTML de una app
function crearTarjeta(app, descargas) {
  const card = document.createElement('div');
  card.className = 'app-card';
  
  card.innerHTML = `
    <div class="card-content">
      <h2 class="app-title">${escapeHtml(app.nombre)}</h2>
      <p class="app-description">${escapeHtml(app.descripcion)}</p>
      <div class="app-meta">
        <span class="app-size">📦 ${app.tamaño}</span>
        <span class="download-count" id="count-${app.id}">${descargas}</span>
      </div>
    </div>
    <button class="btn-download" data-id="${app.id}" data-url="${app.urlDescarga}">⛓️ Descargar</button>
  `;
  
  const btn = card.querySelector('.btn-download');
  btn.addEventListener('click', async (e) => {
    e.preventDefault();
    const appId = btn.dataset.id;
    const downloadUrl = btn.dataset.url;
    
    // Incrementar contador en el servidor
    const nuevoValor = await incrementarContador(appId);
    if (nuevoValor !== null) {
      const countSpan = document.getElementById(`count-${appId}`);
      if (countSpan) countSpan.textContent = nuevoValor;
    }
    
    // Iniciar descarga
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = ''; // opcional, fuerza descarga
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
  
  return card;
}

// Utilidad para evitar XSS
function escapeHtml(str) {
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

// Iniciar
cargarApps();