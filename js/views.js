/* ============================================================
   LI-FI CAMPAIGN — Views (render functions → HTML strings)
   ============================================================ */

const STATUS_LABEL = {
  active: 'Active',
  scheduled: 'Programmée',
  draft: 'Brouillon',
  paused: 'Suspendue',
  ended: 'Terminée',
};
const STATUS_BADGE_CLASS = {
  active: 'badge--active',
  scheduled: 'badge--scheduled',
  draft: 'badge--draft',
  paused: 'badge--paused',
  ended: 'badge--ended',
};

const CONTENT_TYPES = [
  { value: 'text', label: 'Texte', icon: 'text' },
  { value: 'image', label: 'Image', icon: 'image' },
  { value: 'video', label: 'Vidéo', icon: 'video' },
  { value: 'product', label: 'Fiche produit', icon: 'product' },
  { value: 'offer', label: 'Offre', icon: 'offer' },
  { value: 'cta', label: 'CTA', icon: 'cta' },
  { value: 'url', label: 'URL', icon: 'link' },
];

function fmtDate(d) {
  if (!d) return null;
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

function fmtDateRange(start, end) {
  if (!start && !end) return 'Aucune date définie';
  if (start && end) return `${fmtDate(start)} → ${fmtDate(end)}`;
  if (start) return `Dès le ${fmtDate(start)}`;
  return `Jusqu'au ${fmtDate(end)}`;
}

function zoneNames(zoneIds) {
  if (!zoneIds || !zoneIds.length) return 'Aucune zone';
  const zones = ZoneStore.all();
  return zoneIds
    .map(id => zones.find(z => z.zoneId === id))
    .filter(Boolean)
    .map(z => z.name)
    .join(' + ') || 'Zone supprimée';
}

/* ---------------- Responsive imagery helper ---------------- */
const IMG_WIDTHS = {
  hero: [640, 1024, 1536],
  zones: [640, 1024, 1536],
  analytics: [640, 864],
  onboarding: [640, 1024, 1536],
};

function responsiveImg({ name, alt, eager = false }) {
  const widths = IMG_WIDTHS[name];
  const srcset = widths.map(w => `img/${name}-${w}.webp ${w}w`).join(', ');
  const fallback = `img/${name}-${widths[widths.length - 1]}.webp`;
  return `<img
      src="${fallback}"
      srcset="${srcset}"
      sizes="(min-width: 860px) 720px, 100vw"
      alt="${escapeAttr(alt)}"
      loading="${eager ? 'eager' : 'lazy'}"
      ${eager ? 'fetchpriority="high"' : ''}
    />`;
}

/* ---------------- Header ---------------- */
function renderHeader(route) {
  const titles = {
    dashboard: null,
    campaigns: { title: 'Campagnes' },
    'campaign-detail': { title: 'Détail campagne', back: '#/campaigns' },
    wizard: { title: state.wizard.editingId ? 'Modifier la campagne' : 'Nouvelle campagne', back: '#/campaigns' },
    zones: { title: 'Zones' },
    preview: { title: 'Aperçu & Simulation' },
    settings: { title: 'Réglages' },
  };
  const cfg = titles[route];

  if (!cfg) {
    // Dashboard brand header
    return `
      <header class="app-header">
        <div class="app-header__brand">
          <img class="app-header__logo" src="icons/icon-192.png" alt="Li-Fi Campaign" width="32" height="32" />
          <div class="app-header__title">Li-Fi Campaign</div>
        </div>
      </header>`;
  }

  return `
    <header class="app-header">
      ${cfg.back ? `<button class="app-header__back" data-action="navigate" data-href="${cfg.back}" aria-label="Retour">${icon('back')}</button>` : ''}
      <div class="app-header__title">${cfg.title}</div>
    </header>`;
}

/* ---------------- Bottom nav ---------------- */
const NAV_ITEMS = [
  { key: 'dashboard', href: '#/', label: 'Accueil', icon: 'home' },
  { key: 'campaigns', href: '#/campaigns', label: 'Campagnes', icon: 'campaigns' },
  { key: 'zones', href: '#/zones', label: 'Zones', icon: 'zones' },
  { key: 'preview', href: '#/preview', label: 'Aperçu', icon: 'preview' },
  { key: 'settings', href: '#/settings', label: 'Réglages', icon: 'settings' },
];

function renderBottomNav(activeKey) {
  return `
    <nav class="bottom-nav" aria-label="Navigation principale">
      ${NAV_ITEMS.map(item => `
        <a class="bottom-nav__item ${activeKey === item.key ? 'is-active' : ''}" href="${item.href}" aria-current="${activeKey === item.key ? 'page' : 'false'}">
          ${icon(item.icon)}
          <span>${item.label}</span>
        </a>
      `).join('')}
    </nav>`;
}

/* ---------------- Dashboard ---------------- */
function renderDashboard() {
  const campaigns = CampaignStore.all();
  const zones = ZoneStore.all();
  const events = EventStore.all();

  const activeCount = campaigns.filter(c => CampaignStore.computedStatus(c) === 'active').length;
  const scheduledCount = campaigns.filter(c => CampaignStore.computedStatus(c) === 'scheduled').length;
  const zonesCount = zones.length;
  const eventsCount = events.length;

  const recent = campaigns.slice(0, 4);
  const settings = SettingsStore.get();

  return `
    <div class="visual-banner visual-banner--hero">
      ${responsiveImg({ name: 'hero', alt: 'Faisceau lumineux Li-Fi entre deux zones de diffusion', eager: true })}
      <div class="visual-banner__label">Li-Fi Campaign<small>Le marketing piloté par la lumière</small></div>
    </div>

    <div class="greeting">Bonjour</div>
    <div class="greeting-sub">Pilotez vos campagnes lumineuses${settings.orgName ? ` — ${settings.orgName}` : ''}.</div>

    <div class="stat-grid">
      <div class="card stat-card stat-card--cyan"><div class="stat-card__glow"></div><div class="stat-card__value">${activeCount}</div><div class="stat-card__label">Campagnes actives</div></div>
      <div class="card stat-card stat-card--violet"><div class="stat-card__glow"></div><div class="stat-card__value">${scheduledCount}</div><div class="stat-card__label">Programmées</div></div>
      <div class="card stat-card stat-card--cyan"><div class="stat-card__glow"></div><div class="stat-card__value">${zonesCount}</div><div class="stat-card__label">Zones configurées</div></div>
      <div class="card stat-card stat-card--violet"><div class="stat-card__glow"></div><div class="stat-card__value">${eventsCount}</div><div class="stat-card__label">Interactions simulées</div></div>
    </div>

    <button class="fab-new" data-action="new-campaign">${icon('plus')} Nouvelle campagne</button>

    <div class="section-title">Campagnes récentes</div>
    ${recent.length ? recent.map(c => renderCampaignItem(c)).join('') : renderEmptyCampaigns()}
  `;
}

/* ---------------- Campaign item (shared) ---------------- */
function renderCampaignItem(c) {
  const status = CampaignStore.computedStatus(c);
  return `
    <div class="card campaign-item" data-action="navigate" data-href="#/campaigns/${c.id}">
      <div class="campaign-item__top">
        <div class="campaign-item__name">${escapeHTML(c.name) || 'Sans titre'}</div>
        <span class="badge ${STATUS_BADGE_CLASS[status]}">${STATUS_LABEL[status]}</span>
      </div>
      <div class="campaign-item__meta">
        <div class="campaign-item__meta-row">${icon('calendar')} <span>${fmtDateRange(c.startDate, c.endDate)}</span></div>
        <div class="campaign-item__meta-row">${icon('pin')} <span class="campaign-item__zones">${escapeHTML(zoneNames(c.zoneIds))}</span></div>
      </div>
    </div>`;
}

function renderEmptyCampaigns() {
  return `
    <div class="card" style="overflow:hidden; padding:0;">
      <div class="onboarding-hero">
        ${responsiveImg({ name: 'onboarding', alt: 'Première campagne Li-Fi en cours de construction' })}
      </div>
      <div class="empty-state" style="padding:8px 24px 28px;">
        ${icon('empty')}
        <div class="empty-state__title">Aucune campagne pour l'instant</div>
        <div class="empty-state__text">Créez votre première campagne pour préparer une expérience lumineuse.</div>
      </div>
    </div>`;
}

/* ---------------- Campaigns list ---------------- */
const CAMPAIGN_FILTERS = [
  { key: 'all', label: 'Toutes' },
  { key: 'draft', label: 'Brouillons' },
  { key: 'scheduled', label: 'Programmées' },
  { key: 'active', label: 'Actives' },
  { key: 'paused', label: 'Suspendues' },
  { key: 'ended', label: 'Terminées' },
];

function renderCampaignsList() {
  const all = CampaignStore.all();
  const filter = state.campaignsFilter || 'all';
  const filtered = filter === 'all' ? all : all.filter(c => CampaignStore.computedStatus(c) === filter);

  return `
    <div class="chip-row">
      ${CAMPAIGN_FILTERS.map(f => `
        <div class="chip ${filter === f.key ? 'is-active' : ''}" data-action="filter-campaigns" data-filter="${f.key}">${f.label}</div>
      `).join('')}
    </div>

    <button class="fab-new" data-action="new-campaign">${icon('plus')} Nouvelle campagne</button>

    <div style="margin-top:18px;">
      ${filtered.length ? filtered.map(c => renderCampaignListRow(c)).join('') : renderEmptyCampaigns()}
    </div>
  `;
}

function renderCampaignListRow(c) {
  const status = CampaignStore.computedStatus(c);
  return `
    <div class="card campaign-item">
      <div data-action="navigate" data-href="#/campaigns/${c.id}">
        <div class="campaign-item__top">
          <div class="campaign-item__name">${escapeHTML(c.name) || 'Sans titre'}</div>
          <span class="badge ${STATUS_BADGE_CLASS[status]}">${STATUS_LABEL[status]}</span>
        </div>
        <div class="campaign-item__meta">
          <div class="campaign-item__meta-row">${icon('calendar')} <span>${fmtDateRange(c.startDate, c.endDate)}</span></div>
          <div class="campaign-item__meta-row">${icon('pin')} <span class="campaign-item__zones">${escapeHTML(zoneNames(c.zoneIds))}</span></div>
          <div class="campaign-item__meta-row">${icon(CONTENT_TYPES.find(t => t.value === c.content.type)?.icon || 'text')} <span>${CONTENT_TYPES.find(t => t.value === c.content.type)?.label || 'Texte'}</span></div>
        </div>
      </div>
      <div class="divider"></div>
      <div style="display:flex; gap:8px; flex-wrap:wrap;">
        <button class="btn btn-secondary btn-sm" data-action="navigate" data-href="#/campaigns/${c.id}/edit">${icon('edit')} Modifier</button>
        <button class="btn btn-secondary btn-sm" data-action="duplicate-campaign" data-id="${c.id}">${icon('duplicate')} Dupliquer</button>
        ${c.status === 'active'
          ? `<button class="btn btn-secondary btn-sm" data-action="pause-campaign" data-id="${c.id}">${icon('pause')} Suspendre</button>`
          : `<button class="btn btn-secondary btn-sm" data-action="activate-campaign" data-id="${c.id}">${icon('play')} Activer</button>`}
        <button class="btn btn-danger btn-sm" data-action="confirm-delete-campaign" data-id="${c.id}">${icon('trash')}</button>
      </div>
    </div>`;
}

/* ---------------- Campaign detail ---------------- */
function renderCampaignDetail(id) {
  const c = CampaignStore.get(id);
  if (!c) return `<div class="card empty-state">${icon('empty')}<div class="empty-state__title">Campagne introuvable</div></div>`;
  const status = CampaignStore.computedStatus(c);
  const ct = CONTENT_TYPES.find(t => t.value === c.content.type);

  return `
    <div class="card" style="padding:18px;">
      <div class="flex-between">
        <h2 style="font-size:19px;">${escapeHTML(c.name) || 'Sans titre'}</h2>
        <span class="badge ${STATUS_BADGE_CLASS[status]}">${STATUS_LABEL[status]}</span>
      </div>
      ${c.description ? `<p class="text-muted" style="margin-top:8px; font-size:13.5px; line-height:1.5;">${escapeHTML(c.description)}</p>` : ''}

      <div class="divider"></div>

      <div class="campaign-item__meta">
        <div class="campaign-item__meta-row">${icon('calendar')} <span>${fmtDateRange(c.startDate, c.endDate)}</span></div>
        <div class="campaign-item__meta-row">${icon('pin')} <span class="campaign-item__zones">${escapeHTML(zoneNames(c.zoneIds))}</span></div>
        <div class="campaign-item__meta-row">${icon(ct?.icon || 'text')} <span>Contenu : ${ct?.label || 'Texte'}</span></div>
        <div class="campaign-item__meta-row">${icon('bolt')} <span>Priorité ${c.behavior.priority === 'high' ? 'haute' : c.behavior.priority === 'low' ? 'basse' : 'normale'} · ${c.behavior.frequency === 'once' ? 'une fois par session' : 'déclenchements multiples'}</span></div>
      </div>
    </div>

    <div class="section-title">Aperçu du contenu</div>
    ${renderPhonePreview(c)}

    <div style="display:flex; gap:10px; margin-top:22px;">
      <button class="btn btn-primary btn-block" data-action="navigate" data-href="#/preview/${c.id}">${icon('bolt')} Simuler</button>
      <button class="btn btn-secondary btn-block" data-action="navigate" data-href="#/campaigns/${c.id}/edit">${icon('edit')} Modifier</button>
    </div>
    <div style="display:flex; gap:10px; margin-top:10px;">
      <button class="btn btn-secondary btn-block" data-action="duplicate-campaign" data-id="${c.id}">${icon('duplicate')} Dupliquer</button>
      ${status === 'active' || status === 'scheduled'
        ? `<button class="btn btn-secondary btn-block" data-action="pause-campaign" data-id="${c.id}">${icon('pause')} Suspendre</button>`
        : `<button class="btn btn-secondary btn-block" data-action="activate-campaign" data-id="${c.id}">${icon('play')} Activer</button>`}
    </div>
    <button class="btn btn-danger btn-block" style="margin-top:10px;" data-action="confirm-delete-campaign" data-id="${c.id}">${icon('trash')} Supprimer la campagne</button>
  `;
}

/* ---------------- Phone mockup preview (shared) ---------------- */
function renderPhonePreview(c) {
  const hasContent = c.content.title || c.content.text;
  const ct = CONTENT_TYPES.find(t => t.value === c.content.type);
  return `
    <div class="phone-mock">
      <div class="phone-mock__notch"></div>
      <div class="phone-mock__screen">
        ${hasContent ? `
          <div class="phone-notif">
            <div class="phone-notif__tag">${icon(ct?.icon || 'text', '')} ${ct?.label || 'Contenu'}</div>
            ${(c.content.type === 'image' || c.content.type === 'video') ? `<div class="phone-notif__media">${c.content.type === 'video' ? 'Aperçu vidéo' : 'Aperçu image'}</div>` : ''}
            <div class="phone-notif__title">${escapeHTML(c.content.title) || 'Titre de la campagne'}</div>
            <div class="phone-notif__text">${escapeHTML(c.content.text) || ''}</div>
            ${c.content.cta ? `<span class="phone-notif__cta">${escapeHTML(c.content.cta)}</span>` : ''}
          </div>
        ` : `<div class="phone-empty">Ajoutez un titre ou un texte pour prévisualiser le contenu reçu par l'utilisateur.</div>`}
      </div>
    </div>
  `;
}

/* ---------------- Wizard ---------------- */
const WIZARD_STEPS = ['Informations', 'Zones', 'Contenu', 'Comportement', 'Aperçu'];

function renderWizard() {
  const { step, draft } = state.wizard;
  return `
    <div class="wizard-steps">
      ${WIZARD_STEPS.map((_, i) => `<div class="wizard-steps__dot ${i + 1 < step ? 'is-done' : ''} ${i + 1 === step ? 'is-current' : ''}"></div>`).join('')}
    </div>
    <div class="wizard-label">Étape ${step} / ${WIZARD_STEPS.length}</div>
    <h2 class="wizard-heading">${WIZARD_STEPS[step - 1]}</h2>

    ${step === 1 ? renderWizardStep1(draft) : ''}
    ${step === 2 ? renderWizardStep2(draft) : ''}
    ${step === 3 ? renderWizardStep3(draft) : ''}
    ${step === 4 ? renderWizardStep4(draft) : ''}
    ${step === 5 ? renderWizardStep5(draft) : ''}

    <div class="wizard-actions">
      ${step > 1 ? `<button class="btn btn-secondary" data-action="wizard-back">Précédent</button>` : `<button class="btn btn-secondary" data-action="navigate" data-href="#/campaigns">Annuler</button>`}
      ${step < WIZARD_STEPS.length
        ? `<button class="btn btn-primary" data-action="wizard-next">Continuer</button>`
        : `<button class="btn btn-primary" data-action="wizard-finish">${icon('check')} Activer la campagne</button>`}
    </div>
    ${step === WIZARD_STEPS.length ? `<button class="btn btn-ghost btn-block" style="margin-top:8px;" data-action="wizard-save-draft">Enregistrer comme brouillon</button>` : ''}
  `;
}

function renderWizardStep1(d) {
  return `
    <div class="field">
      <label for="w-name">Nom de la campagne</label>
      <input class="input" id="w-name" type="text" placeholder="Nouvelle collection été" value="${escapeAttr(d.name)}" data-bind="name" />
    </div>
    <div class="field">
      <label for="w-desc">Description</label>
      <textarea class="textarea" id="w-desc" placeholder="Décrivez l'objectif de cette campagne" data-bind="description">${escapeHTML(d.description)}</textarea>
    </div>
    <div class="field">
      <label>Période</label>
      <div class="date-row">
        <input class="input" type="date" value="${d.startDate}" data-bind="startDate" aria-label="Date de début" />
        <input class="input" type="date" value="${d.endDate}" data-bind="endDate" aria-label="Date de fin" />
      </div>
      <div class="hint">Laissez vide pour une campagne sans limite de date.</div>
    </div>
    <div class="field">
      <label for="w-status">Statut</label>
      <select class="select" id="w-status" data-bind="status">
        ${['draft', 'active', 'paused'].map(s => `<option value="${s}" ${d.status === s ? 'selected' : ''}>${STATUS_LABEL[s]}</option>`).join('')}
      </select>
    </div>
  `;
}

function renderWizardStep2(d) {
  const zones = ZoneStore.all();
  if (!zones.length) {
    return `
      <div class="card empty-state">
        ${icon('empty')}
        <div class="empty-state__title">Aucune zone configurée</div>
        <div class="empty-state__text">Créez d'abord une zone pour pouvoir y associer cette campagne.</div>
      </div>
      <button class="btn btn-secondary btn-block" style="margin-top:16px;" data-action="navigate" data-href="#/zones">${icon('zones')} Aller à Zones</button>
    `;
  }
  return `
    <div class="field">
      <label>Zones de déclenchement</label>
      <div class="hint" style="margin-bottom:12px;">Sélection multiple autorisée.</div>
      <div class="zone-grid">
        ${zones.map((z, i) => `
          <div class="zone-pick ${d.zoneIds.includes(z.zoneId) ? 'is-selected' : ''}" data-action="toggle-zone" data-zone-id="${z.zoneId}">
            <div class="zone-pick__id">ZONE ${String(i + 1).padStart(2, '0')}</div>
            <div class="zone-pick__name">${escapeHTML(z.name)}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderWizardStep3(d) {
  const c = d.content;
  return `
    <div class="field">
      <label>Type de contenu</label>
      <div class="content-type-grid">
        ${CONTENT_TYPES.map(t => `
          <div class="content-type-pick ${c.type === t.value ? 'is-selected' : ''}" data-action="set-content-type" data-type="${t.value}">
            ${icon(t.icon)}
            <span>${t.label}</span>
          </div>
        `).join('')}
      </div>
    </div>
    <div class="field">
      <label for="w-ctitle">Titre</label>
      <input class="input" id="w-ctitle" type="text" placeholder="Découvrez la nouvelle collection" value="${escapeAttr(c.title)}" data-bind="content.title" />
    </div>
    <div class="field">
      <label for="w-ctext">Texte</label>
      <textarea class="textarea" id="w-ctext" placeholder="Explorez nos nouveautés disponibles aujourd'hui." data-bind="content.text">${escapeHTML(c.text)}</textarea>
    </div>
    ${(c.type === 'image' || c.type === 'video') ? `
      <div class="field">
        <label for="w-cmedia">${c.type === 'video' ? 'URL de la vidéo' : 'URL de l\u2019image'}</label>
        <input class="input" id="w-cmedia" type="url" placeholder="https://…" value="${escapeAttr(c.mediaUrl)}" data-bind="content.mediaUrl" />
        <div class="hint">Aucun média lourd n'est hébergé en V1 — utilisez un lien externe.</div>
      </div>
    ` : ''}
    <div class="field">
      <label for="w-ccta">Bouton d'action (CTA)</label>
      <input class="input" id="w-ccta" type="text" placeholder="Découvrir" value="${escapeAttr(c.cta)}" data-bind="content.cta" />
    </div>
    <div class="field">
      <label for="w-curl">URL de destination</label>
      <input class="input" id="w-curl" type="url" placeholder="https://…" value="${escapeAttr(c.url)}" data-bind="content.url" />
    </div>
  `;
}

function renderWizardStep4(d) {
  const b = d.behavior;
  return `
    <div class="field">
      <label>Affichage</label>
      <div class="choice-list">
        <div class="choice-card ${b.display === 'immediate' ? 'is-selected' : ''}" data-action="set-behavior" data-key="display" data-value="immediate">
          <div class="choice-card__icon">${icon('bolt')}</div>
          <div><div class="choice-card__title">Afficher immédiatement</div><div class="choice-card__desc">Dès l'entrée dans la zone</div></div>
          <div class="choice-card__check">${b.display === 'immediate' ? icon('check') : ''}</div>
        </div>
        <div class="choice-card ${b.display === 'delay' ? 'is-selected' : ''}" data-action="set-behavior" data-key="display" data-value="delay">
          <div class="choice-card__icon">${icon('calendar')}</div>
          <div><div class="choice-card__title">Afficher après délai</div><div class="choice-card__desc">Après ${b.delayMinutes || 5} min dans la zone</div></div>
          <div class="choice-card__check">${b.display === 'delay' ? icon('check') : ''}</div>
        </div>
      </div>
      ${b.display === 'delay' ? `
        <div class="field" style="margin-top:12px;">
          <label for="w-delay">Délai (minutes)</label>
          <input class="input" id="w-delay" type="number" min="1" max="120" value="${b.delayMinutes || 5}" data-bind="behavior.delayMinutes" />
        </div>
      ` : ''}
    </div>

    <div class="field">
      <label>Fréquence</label>
      <div class="choice-list">
        <div class="choice-card ${b.frequency === 'once' ? 'is-selected' : ''}" data-action="set-behavior" data-key="frequency" data-value="once">
          <div class="choice-card__icon">${icon('checkCircle')}</div>
          <div><div class="choice-card__title">Une seule fois par session</div><div class="choice-card__desc">N'apparaît plus une fois vue</div></div>
          <div class="choice-card__check">${b.frequency === 'once' ? icon('check') : ''}</div>
        </div>
        <div class="choice-card ${b.frequency === 'multiple' ? 'is-selected' : ''}" data-action="set-behavior" data-key="frequency" data-value="multiple">
          <div class="choice-card__icon">${icon('refresh')}</div>
          <div><div class="choice-card__title">Déclenchements multiples</div><div class="choice-card__desc">Réapparaît à chaque entrée en zone</div></div>
          <div class="choice-card__check">${b.frequency === 'multiple' ? icon('check') : ''}</div>
        </div>
      </div>
    </div>

    <div class="field">
      <label>Priorité</label>
      <div class="priority-row">
        ${['low', 'normal', 'high'].map(p => `
          <div class="priority-pill ${b.priority === p ? `is-selected--${p}` : ''}" data-action="set-behavior" data-key="priority" data-value="${p}">
            ${p === 'low' ? 'Basse' : p === 'normal' ? 'Normale' : 'Haute'}
          </div>
        `).join('')}
      </div>
      <div class="hint">Détermine quelle campagne s'affiche si plusieurs sont actives sur la même zone.</div>
    </div>
  `;
}

function renderWizardStep5(d) {
  return `
    <div style="display:flex; flex-direction:column; align-items:center;">
      ${renderPhonePreview(d)}
    </div>
    <div class="section-title">Récapitulatif</div>
    <div class="card" style="padding:16px;">
      <div class="campaign-item__meta">
        <div class="campaign-item__meta-row">${icon('campaigns')} <span>${escapeHTML(d.name) || 'Sans titre'}</span></div>
        <div class="campaign-item__meta-row">${icon('calendar')} <span>${fmtDateRange(d.startDate, d.endDate)}</span></div>
        <div class="campaign-item__meta-row">${icon('pin')} <span>${escapeHTML(zoneNames(d.zoneIds))}</span></div>
        <div class="campaign-item__meta-row">${icon('bolt')} <span>${d.behavior.display === 'immediate' ? 'Immédiat' : `Après ${d.behavior.delayMinutes} min`} · Priorité ${d.behavior.priority}</span></div>
      </div>
    </div>
  `;
}

/* ---------------- Zones ---------------- */
function renderZones() {
  const zones = ZoneStore.all();
  return `
    <div class="visual-banner visual-banner--zones">
      ${responsiveImg({ name: 'zones', alt: 'Zones lumineuses Li-Fi réparties dans un espace' })}
      <div class="visual-banner__label">Zones<small>Chaque point lumineux, un espace adressable</small></div>
    </div>

    <button class="fab-new" data-action="new-zone">${icon('plus')} Ajouter une zone</button>
    <div style="margin-top:18px;">
      ${zones.length ? zones.map((z, i) => renderZoneItem(z, i)).join('') : `
        <div class="card empty-state">
          ${icon('empty')}
          <div class="empty-state__title">Aucune zone configurée</div>
          <div class="empty-state__text">Ajoutez une zone virtuelle pour pouvoir y associer vos campagnes.</div>
        </div>
      `}
    </div>
  `;
}

function renderZoneItem(z, i) {
  const campaignCount = CampaignStore.all().filter(c => c.zoneIds.includes(z.zoneId)).length;
  return `
    <div class="card zone-item">
      <div class="zone-item__icon">${String(i + 1).padStart(2, '0')}</div>
      <div class="zone-item__body">
        <div class="zone-item__name">${escapeHTML(z.name)}</div>
        <div class="zone-item__desc">${escapeHTML(z.description) || `${campaignCount} campagne(s) associée(s)`}</div>
      </div>
      <span class="badge ${z.status === 'active' ? 'badge--active' : 'badge--draft'}" style="margin-right:4px;">${z.status === 'active' ? 'Active' : 'Inactive'}</span>
      <div class="zone-item__actions">
        <button class="icon-btn" data-action="edit-zone" data-id="${z.zoneId}" aria-label="Modifier la zone">${icon('edit')}</button>
        <button class="icon-btn" data-action="confirm-delete-zone" data-id="${z.zoneId}" aria-label="Supprimer la zone">${icon('trash')}</button>
      </div>
    </div>
  `;
}

/* ---------------- Preview / Simulation hub ---------------- */
function renderPreview(preselectId) {
  const campaigns = CampaignStore.all();
  const zones = ZoneStore.all();
  const selectedId = preselectId || state.previewCampaignId || (campaigns[0] && campaigns[0].id);
  const selected = campaigns.find(c => c.id === selectedId) || null;
  state.previewCampaignId = selectedId;

  if (!campaigns.length) {
    return `<div class="card empty-state">${icon('empty')}<div class="empty-state__title">Aucune campagne à prévisualiser</div><div class="empty-state__text">Créez une campagne pour pouvoir la simuler.</div></div>`;
  }

  return `
    <div class="field">
      <label for="preview-campaign-select">Campagne</label>
      <select class="select" id="preview-campaign-select" data-action-change="select-preview-campaign">
        ${campaigns.map(c => `<option value="${c.id}" ${c.id === selectedId ? 'selected' : ''}>${escapeHTML(c.name) || 'Sans titre'}</option>`).join('')}
      </select>
    </div>

    ${selected ? renderPhonePreview(selected) : ''}

    <div class="field" style="margin-top:22px;">
      <label for="preview-zone-select">Zone à simuler</label>
      <select class="select" id="preview-zone-select">
        ${zones.length ? zones.map(z => `<option value="${z.zoneId}" ${selected && selected.zoneIds[0] === z.zoneId ? 'selected' : ''}>${escapeHTML(z.name)}</option>`).join('') : '<option value="">Aucune zone disponible</option>'}
      </select>
    </div>

    <button class="btn btn-primary btn-block" style="margin-top:8px;" data-action="run-simulation" ${zones.length ? '' : 'disabled'}>${icon('bolt')} Simuler le déclenchement</button>

    <div id="sim-result"></div>

    <div class="sim-disclaimer">${icon('alert')} Simulation — aucun matériel Li-Fi connecté</div>
  `;
}

function renderSimulationFlow(result) {
  const { event, campaign, zone } = result;
  const steps = [
    { label: 'Zone active', sub: zone ? zone.name : '—' },
    { label: 'Signal Li-Fi simulé', sub: 'Source : simulation logicielle' },
    { label: 'Campagne identifiée', sub: campaign ? campaign.name : 'Aucune campagne active sur cette zone' },
    { label: 'Contenu préparé', sub: campaign ? (CONTENT_TYPES.find(t => t.value === campaign.content.type)?.label || 'Contenu') : '—' },
    { label: 'Affichage utilisateur', sub: campaign ? 'Notification envoyée au mockup ci-dessus' : 'Rien à afficher' },
  ];
  return `
    <div class="sim-flow" id="sim-flow-anim">
      ${steps.map((s, i) => `
        <div class="sim-step" data-step-index="${i}">
          <div class="sim-step__dot">${icon('checkCircle')}</div>
          <div><div class="sim-step__label">${s.label}</div><div class="sim-step__sub">${escapeHTML(s.sub)}</div></div>
        </div>
      `).join('')}
    </div>
    <div class="card" style="padding:14px; font-size:12.5px; color:var(--text-muted);" class="mono">
      <div class="mono">event: ${event.id} · source: ${event.source} · ${new Date(event.timestamp).toLocaleTimeString('fr-FR')}</div>
    </div>
  `;
}

/* ---------------- Settings ---------------- */
function renderSettings() {
  const settings = SettingsStore.get();
  const campaigns = CampaignStore.all();
  const zones = ZoneStore.all();
  const events = EventStore.all();
  return `
    <div class="field">
      <label for="s-org">Nom de l'organisation</label>
      <input class="input" id="s-org" type="text" value="${escapeAttr(settings.orgName)}" data-action-change="update-org-name" />
    </div>

    <div class="section-title">Aperçu des données locales</div>
    <div class="visual-banner visual-banner--analytics">
      ${responsiveImg({ name: 'analytics', alt: 'Visualisation de signaux Li-Fi Analytics' })}
      <div class="visual-banner__label">Li-Fi Analytics<small>Bientôt : mesure fine des campagnes et zones</small></div>
    </div>
    <div class="card" style="padding:4px 16px;">
      <div class="settings-row">
        <div class="settings-row__icon">${icon('campaigns')}</div>
        <div><div class="settings-row__label">Campagnes</div><div class="settings-row__desc">${campaigns.length} enregistrée(s)</div></div>
      </div>
      <div class="settings-row">
        <div class="settings-row__icon">${icon('zones')}</div>
        <div><div class="settings-row__label">Zones</div><div class="settings-row__desc">${zones.length} enregistrée(s)</div></div>
      </div>
      <div class="settings-row">
        <div class="settings-row__icon">${icon('bolt')}</div>
        <div><div class="settings-row__label">Événements simulés</div><div class="settings-row__desc">${events.length} enregistré(s)</div></div>
      </div>
    </div>

    <div class="section-title">Démonstration</div>
    <div class="card" style="padding:4px 16px;">
      <div class="settings-row" data-action="confirm-reset-demo">
        <div class="settings-row__icon">${icon('refresh')}</div>
        <div><div class="settings-row__label">Réinitialiser les données de démonstration</div><div class="settings-row__desc">Restaure les campagnes et zones d'exemple</div></div>
        <div class="settings-row__chevron">${icon('chevronRight')}</div>
      </div>
    </div>

    <div class="section-title">Données</div>
    <div class="card" style="padding:4px 16px;">
      <div class="settings-row settings-row--danger" data-action="confirm-clear-events">
        <div class="settings-row__icon">${icon('trash')}</div>
        <div><div class="settings-row__label">Effacer l'historique des simulations</div><div class="settings-row__desc">Les campagnes et zones sont conservées</div></div>
        <div class="settings-row__chevron">${icon('chevronRight')}</div>
      </div>
    </div>

    <div class="section-title">À propos</div>
    <div class="card" style="padding:16px; font-size:12.5px; color:var(--text-muted); line-height:1.6;">
      Li-Fi Campaign V1 — application 100% logicielle. Les zones et déclenchements sont simulés localement ; aucune donnée personnelle n'est collectée. Une future intégration matérielle Li-Fi pourra remplacer le simulateur sans reconstruire l'application.
    </div>
  `;
}

/* ---------------- Small utils ---------------- */
function escapeHTML(str) {
  if (str === undefined || str === null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
function escapeAttr(str) {
  if (str === undefined || str === null) return '';
  return String(str).replace(/"/g, '&quot;');
}
