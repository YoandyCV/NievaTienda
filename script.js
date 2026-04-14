// Configuración: cambia esta URL por la de tu Google Apps Script
const SCRIPT_URL = 'https://script.google.com/macros/s/TU_ID_AQUI/exec';

// Menú móvil
document.addEventListener('DOMContentLoaded', () => {
  const menuToggle = document.getElementById('menuToggle');
  const sidebar = document.querySelector('.sidebar');
  
  if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
  }
  
  // Cerrar menú al hacer clic en enlace (móvil)
  const links = document.querySelectorAll('.contact-link');
  links.forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 768) {
        sidebar.classList.remove('open');
      }
    });
  });
});

// Cargar apps desde apps.json
async function cargarApps() {
  try {
    const response = await fetch('apps.json');
    if (!response.ok) throw new Error('No se pudo cargar apps.json');
    const apps = await response.json();
    
    const contadores = await obtenerContadores();
    const container = document.getElementById('appsContainer');
    container.innerHTML = '';
    
    apps.forEach(app => {
      const card = crearTarjeta(app, contadores[app.id] || 0);
      container.appendChild(card);
    });
  } catch (error) {
    document.getElementById('appsContainer').innerHTML = `<div class="loader">❌ Error: ${error.message}</div>`;
  }
}

async function obtenerContadores() {
  try {
    const url = `${SCRIPT_URL}?action=get`;
    const res = await fetch(url);
    if (!res.ok) throw new Error();
    const data = await res.json();
    return data;
  } catch (error) {
    console.warn('Usando contadores locales');
    return {};
  }
}

async function incrementarContador(appId) {
  try {
    const url = `${SCRIPT_URL}?action=increment&appId=${encodeURIComponent(appId)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error();
    const data = await res.json();
    return data.success ? data.newValue : null;
  } catch (error) {
    console.error('Error al incrementar', error);
    return null;
  }
}

function crearTarjeta(app, descargas) {
  const card = document.createElement('div');
  card.className = 'app-card';
  
  // Determinar icono (puede ser emoji o URL de imagen)
  let iconHtml = '';
  if (app.iconoUrl) {
    iconHtml = `<img src="${app.iconoUrl}" alt="${app.nombre}">`;
  } else {
    iconHtml = app.iconoEmoji || '📱';
  }
  
  card.innerHTML = `
    <div class="card-header">
      <div class="app-icon">
        ${iconHtml}
      </div>
      <h2 class="app-title">${escapeHtml(app.nombre)}</h2>
    </div>
    <div class="card-content">
      <p class="app-description">${escapeHtml(app.descripcion)}</p>
      <div class="app-meta">
        <span class="app-size">📦 ${app.tamaño}</span>
        <span class="download-count" id="count-${app.id}">⬇️ ${descargas}</span>
      </div>
    </div>
    <button class="btn-download" data-id="${app.id}" data-url="${app.urlDescarga}">
      ⛓️ Descargar
    </button>
  `;
  
  const btn = card.querySelector('.btn-download');
  btn.addEventListener('click', async (e) => {
    e.preventDefault();
    const appId = btn.dataset.id;
    const downloadUrl = btn.dataset.url;
    
    const nuevoValor = await incrementarContador(appId);
    if (nuevoValor !== null) {
      const countSpan = document.getElementById(`count-${appId}`);
      if (countSpan) countSpan.innerHTML = `⬇️ ${nuevoValor}`;
    }
    
    // Iniciar descarga
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = '';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
  
  return card;
}

function escapeHtml(str) {
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

cargarApps();