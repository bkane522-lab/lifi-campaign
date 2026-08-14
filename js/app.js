/* ============================================================
   LI-FI CAMPAIGN — App shell, router & actions
   ============================================================ */

const state = {
  route: 'dashboard',
  params: {},
  campaignsFilter: 'all',
  previewCampaignId: null,
  wizard: {
    step: 1,
    editingId: null,
    draft: null,
  },
};

/* ---------------- Path helpers for wizard binding ---------------- */
function getByPath(obj, path) {
  return path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
}
function setByPath(obj, path, value) {
  const keys = path.split('.');
  let cur = obj;
  for (let i = 0; i < keys.length - 1; i++) cur = cur[keys[i]];
  cur[keys[keys.length - 1]] = value;
}

/* ---------------- Router ---------------- */
function parseHash() {
  const hash = location.hash.replace(/^#\/?/, '');
  const parts = hash.split('/').filter(Boolean);
  if (parts.length === 0) return { route: 'dashboard', params: {} };
  if (parts[0] === 'campaigns' && parts[1] === 'new') return { route: 'wizard', params: {} };
  if (parts[0] === 'campaigns' && parts[1] && parts[2] === 'edit') return { route: 'wizard', params: { id: parts[1] } };
  if (parts[0] === 'campaigns' && parts[1]) return { route: 'campaign-detail', params: { id: parts[1] } };
  if (parts[0] === 'campaigns') return { route: 'campaigns', params: {} };
  if (parts[0] === 'zones') return { route: 'zones', params: {} };
  if (parts[0] === 'preview' && parts[1]) return { route: 'preview', params: { id: parts[1] } };
  if (parts[0] === 'preview') return { route: 'preview', params: {} };
  if (parts[0] === 'settings') return { route: 'settings', params: {} };
  return { route: 'dashboard', params: {} };
}

function navigateTo(hash) {
  if (location.hash === hash) { render(); return; }
  location.hash = hash;
}

function onRouteChange() {
  const { route, params } = parseHash();
  state.route = route;
  state.params = params;

  if (route === 'wizard') {
    if (params.id) {
      const existing = CampaignStore.get(params.id);
      if (existing && (!state.wizard.draft || state.wizard.editingId !== params.id)) {
        state.wizard = { step: 1, editingId: params.id, draft: JSON.parse(JSON.stringify(existing)) };
      }
    } else if (state.wizard.editingId !== null || !state.wizard.draft) {
      state.wizard = { step: 1, editingId: null, draft: CampaignStore.createBlank() };
    }
  }

  render();
  window.scrollTo(0, 0);
}

/* ---------------- Render ---------------- */
const NAV_KEY_BY_ROUTE = {
  dashboard: 'dashboard',
  campaigns: 'campaigns',
  'campaign-detail': 'campaigns',
  wizard: 'campaigns',
  zones: 'zones',
  preview: 'preview',
  settings: 'settings',
};

function render() {
  const root = document.getElementById('app');
  const { route, params } = state;

  let body = '';
  switch (route) {
    case 'dashboard': body = renderDashboard(); break;
    case 'campaigns': body = renderCampaignsList(); break;
    case 'campaign-detail': body = renderCampaignDetail(params.id); break;
    case 'wizard': body = renderWizard(); break;
    case 'zones': body = renderZones(); break;
    case 'preview': body = renderPreview(params.id); break;
    case 'settings': body = renderSettings(); break;
    default: body = renderDashboard();
  }

  root.innerHTML = `
    ${renderHeader(route)}
    <main class="app-main" id="app-content">${body}</main>
    ${renderBottomNav(NAV_KEY_BY_ROUTE[route])}
  `;
}

/* ---------------- Toast ---------------- */
let toastTimer = null;
function showToast(message, type = 'success') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'toast';
  const iconName = type === 'warning' ? 'alert' : 'checkCircle';
  const iconColor = type === 'warning' ? 'var(--warning)' : 'var(--success)';
  toast.innerHTML = `<span style="color:${iconColor}; display:flex;">${icon(iconName)}</span><span>${escapeHTML(message)}</span>`;
  document.body.appendChild(toast);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.remove(), 2200);
}

/* ---------------- Confirmation sheet ---------------- */
function openConfirmSheet({ title, text, confirmLabel = 'Confirmer', danger = true, onConfirm }) {
  const overlay = document.createElement('div');
  overlay.className = 'sheet-overlay';
  overlay.innerHTML = `
    <div class="sheet" role="dialog" aria-modal="true">
      <div class="sheet__handle"></div>
      <div class="sheet__title">${escapeHTML(title)}</div>
      <div class="sheet__text">${escapeHTML(text)}</div>
      <div class="sheet__actions">
        <button class="btn ${danger ? 'btn-danger' : 'btn-primary'} btn-block" data-role="confirm">${escapeHTML(confirmLabel)}</button>
        <button class="btn btn-secondary btn-block" data-role="cancel">Annuler</button>
      </div>
    </div>
  `;
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay || e.target.dataset.role === 'cancel') {
      overlay.remove();
    } else if (e.target.closest('[data-role="confirm"]')) {
      onConfirm();
      overlay.remove();
    }
  });
  document.body.appendChild(overlay);
}

/* ---------------- Wizard validation ---------------- */
function wizardCanContinue() {
  const { step, draft } = state.wizard;
  if (step === 1) return draft.name.trim().length > 0;
  return true;
}

function commitWizardStatusAndSave(finalStatus) {
  const draft = state.wizard.draft;
  draft.status = finalStatus;
  CampaignStore.save(draft);
  return draft;
}

/* ---------------- Simulation run ---------------- */
function runSimulation(zoneId) {
  const zone = ZoneStore.get(zoneId);
  const { event, campaign } = activeTriggerProvider.trigger(zoneId);
  const resultEl = document.getElementById('sim-result');
  if (!resultEl) return;
  resultEl.innerHTML = renderSimulationFlow({ event, campaign, zone });

  // sequential reveal animation
  const steps = resultEl.querySelectorAll('.sim-step');
  steps.forEach((el, i) => {
    setTimeout(() => {
      el.classList.add(i === steps.length - 1 ? 'is-active' : 'is-done');
      if (i === steps.length - 1) el.classList.add('is-active');
    }, i * 260);
  });
}

/* ---------------- Global action handler ---------------- */
function handleAction(actionEl, e) {
  const action = actionEl.dataset.action;

  switch (action) {
    case 'navigate':
      e.preventDefault();
      navigateTo(actionEl.dataset.href);
      break;

    case 'new-campaign':
      navigateTo('#/campaigns/new');
      break;

    case 'new-zone': {
      openZoneEditorSheet(null);
      break;
    }
    case 'edit-zone': {
      openZoneEditorSheet(ZoneStore.get(actionEl.dataset.id));
      break;
    }
    case 'confirm-delete-zone': {
      const zone = ZoneStore.get(actionEl.dataset.id);
      openConfirmSheet({
        title: 'Supprimer cette zone ?',
        text: `"${zone.name}" sera retirée de toutes les campagnes associées. Cette action est irréversible.`,
        confirmLabel: 'Supprimer',
        onConfirm: () => { ZoneStore.remove(zone.zoneId); render(); showToast('Zone supprimée'); },
      });
      break;
    }

    case 'filter-campaigns':
      state.campaignsFilter = actionEl.dataset.filter;
      render();
      break;

    case 'duplicate-campaign': {
      const copy = CampaignStore.duplicate(actionEl.dataset.id);
      render();
      if (copy) showToast('Campagne dupliquée');
      break;
    }
    case 'pause-campaign':
      CampaignStore.setStatus(actionEl.dataset.id, 'paused');
      render();
      showToast('Campagne suspendue');
      break;
    case 'activate-campaign':
      CampaignStore.setStatus(actionEl.dataset.id, 'active');
      render();
      showToast('Campagne activée');
      break;
    case 'confirm-delete-campaign': {
      const c = CampaignStore.get(actionEl.dataset.id);
      openConfirmSheet({
        title: 'Supprimer cette campagne ?',
        text: `"${c.name || 'Sans titre'}" sera définitivement supprimée.`,
        confirmLabel: 'Supprimer',
        onConfirm: () => {
          CampaignStore.remove(c.id);
          if (state.route === 'campaign-detail') navigateTo('#/campaigns'); else render();
          showToast('Campagne supprimée');
        },
      });
      break;
    }

    /* Wizard */
    case 'wizard-next':
      if (!wizardCanContinue()) { showToast('Le nom de la campagne est requis', 'warning'); return; }
      state.wizard.step = Math.min(state.wizard.step + 1, WIZARD_STEPS.length);
      render();
      break;
    case 'wizard-back':
      state.wizard.step = Math.max(state.wizard.step - 1, 1);
      render();
      break;
    case 'wizard-finish': {
      const saved = commitWizardStatusAndSave('active');
      state.wizard = { step: 1, editingId: null, draft: null };
      navigateTo(`#/campaigns/${saved.id}`);
      showToast('Campagne activée');
      break;
    }
    case 'wizard-save-draft': {
      const saved = commitWizardStatusAndSave('draft');
      state.wizard = { step: 1, editingId: null, draft: null };
      navigateTo(`#/campaigns/${saved.id}`);
      showToast('Brouillon enregistré');
      break;
    }
    case 'toggle-zone': {
      const zid = actionEl.dataset.zoneId;
      const d = state.wizard.draft;
      d.zoneIds = d.zoneIds.includes(zid) ? d.zoneIds.filter(id => id !== zid) : [...d.zoneIds, zid];
      render();
      break;
    }
    case 'set-content-type':
      state.wizard.draft.content.type = actionEl.dataset.type;
      render();
      break;
    case 'set-behavior':
      setByPath(state.wizard.draft, `behavior.${actionEl.dataset.key}`, actionEl.dataset.value);
      render();
      break;

    /* Preview / simulation */
    case 'run-simulation': {
      const zoneSelect = document.getElementById('preview-zone-select');
      if (!zoneSelect || !zoneSelect.value) { showToast('Aucune zone disponible', 'warning'); return; }
      runSimulation(zoneSelect.value);
      break;
    }

    /* Settings */
    case 'confirm-reset-demo':
      openConfirmSheet({
        title: 'Réinitialiser les données de démonstration ?',
        text: 'Toutes les campagnes, zones et simulations actuelles seront remplacées par les données d\u2019exemple.',
        confirmLabel: 'Réinitialiser',
        onConfirm: () => { resetDemoData(); render(); showToast('Données de démonstration restaurées'); },
      });
      break;
    case 'confirm-clear-events':
      openConfirmSheet({
        title: 'Effacer l\u2019historique des simulations ?',
        text: 'Les compteurs d\u2019interactions simulées seront remis à zéro. Les campagnes et zones ne sont pas affectées.',
        confirmLabel: 'Effacer',
        onConfirm: () => { EventStore.clear(); render(); showToast('Historique effacé'); },
      });
      break;

    default:
      break;
  }
}

/* ---------------- Zone editor sheet ---------------- */
function openZoneEditorSheet(existingZone) {
  const overlay = document.createElement('div');
  overlay.className = 'sheet-overlay';
  overlay.innerHTML = `
    <div class="sheet" role="dialog" aria-modal="true">
      <div class="sheet__handle"></div>
      <div class="sheet__title">${existingZone ? 'Modifier la zone' : 'Nouvelle zone'}</div>
      <div class="field">
        <label for="zone-name">Nom de la zone</label>
        <input class="input" id="zone-name" type="text" placeholder="Rayon Chaussures" value="${existingZone ? escapeAttr(existingZone.name) : ''}" />
      </div>
      <div class="field">
        <label for="zone-desc">Description</label>
        <textarea class="textarea" id="zone-desc" placeholder="Espace chaussures et maroquinerie">${existingZone ? escapeHTML(existingZone.description) : ''}</textarea>
      </div>
      <div class="sheet__actions">
        <button class="btn btn-primary btn-block" data-role="save">${existingZone ? 'Enregistrer' : 'Ajouter la zone'}</button>
        <button class="btn btn-secondary btn-block" data-role="cancel">Annuler</button>
      </div>
    </div>
  `;
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay || e.target.dataset.role === 'cancel') {
      overlay.remove();
    } else if (e.target.closest('[data-role="save"]')) {
      const name = overlay.querySelector('#zone-name').value.trim();
      const description = overlay.querySelector('#zone-desc').value.trim();
      if (!name) { showToast('Le nom de la zone est requis', 'warning'); return; }
      if (existingZone) {
        existingZone.name = name;
        existingZone.description = description;
        ZoneStore.save(existingZone);
        showToast('Zone mise à jour');
      } else {
        ZoneStore.create({ name, description });
        showToast('Zone ajoutée');
      }
      overlay.remove();
      render();
    }
  });
  document.body.appendChild(overlay);
  setTimeout(() => overlay.querySelector('#zone-name').focus(), 50);
}

/* ---------------- Event delegation ---------------- */
function attachGlobalListeners() {
  document.body.addEventListener('click', (e) => {
    const actionEl = e.target.closest('[data-action]');
    if (actionEl) { handleAction(actionEl, e); return; }
  });

  document.body.addEventListener('input', (e) => {
    const el = e.target;
    if (el.dataset && el.dataset.bind && state.route === 'wizard') {
      setByPath(state.wizard.draft, el.dataset.bind, el.value);
    }
  });

  document.body.addEventListener('change', (e) => {
    const el = e.target;
    if (!el.dataset) return;
    if (el.dataset.actionChange === 'select-preview-campaign') {
      state.previewCampaignId = el.value;
      render();
    }
    if (el.dataset.actionChange === 'update-org-name') {
      const settings = SettingsStore.get();
      settings.orgName = el.value.trim() || 'Mon organisation';
      SettingsStore.save(settings);
      showToast('Réglages enregistrés');
    }
    if (el.dataset.bind && state.route === 'wizard') {
      setByPath(state.wizard.draft, el.dataset.bind, el.value);
      if (el.dataset.bind === 'status') render();
    }
  });

  window.addEventListener('hashchange', onRouteChange);
}

/* ---------------- PWA: service worker registration ---------------- */
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    });
  }
}

/* ---------------- Bootstrap ---------------- */
function boot() {
  seedDemoData();
  attachGlobalListeners();
  registerServiceWorker();
  onRouteChange();
}

document.addEventListener('DOMContentLoaded', boot);
