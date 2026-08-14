/* ============================================================
   LI-FI CAMPAIGN — Data layer (localStorage)
   ============================================================ */

const DB_KEYS = {
  campaigns: 'lifi_campaign_campaigns_v1',
  zones: 'lifi_campaign_zones_v1',
  events: 'lifi_campaign_events_v1',
  settings: 'lifi_campaign_settings_v1',
  seeded: 'lifi_campaign_seeded_v1',
};

function uid(prefix) {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    console.warn('DB read error', key, e);
    return fallback;
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.warn('DB write error', key, e);
    return false;
  }
}

/* ---------------- Zones ---------------- */
const ZoneStore = {
  all() {
    return readJSON(DB_KEYS.zones, []);
  },
  get(zoneId) {
    return this.all().find(z => z.zoneId === zoneId) || null;
  },
  save(zone) {
    const zones = this.all();
    const idx = zones.findIndex(z => z.zoneId === zone.zoneId);
    if (idx >= 0) zones[idx] = zone; else zones.push(zone);
    writeJSON(DB_KEYS.zones, zones);
    return zone;
  },
  remove(zoneId) {
    const zones = this.all().filter(z => z.zoneId !== zoneId);
    writeJSON(DB_KEYS.zones, zones);
    // detach from campaigns
    const campaigns = CampaignStore.all().map(c => ({
      ...c,
      zoneIds: c.zoneIds.filter(id => id !== zoneId),
    }));
    writeJSON(DB_KEYS.campaigns, campaigns);
  },
  create({ name, description = '' }) {
    const zone = {
      zoneId: uid('zone'),
      name,
      description,
      status: 'active',
      futureHardwareId: '',
      metadata: {},
      createdAt: Date.now(),
    };
    return this.save(zone);
  },
  toggleStatus(zoneId) {
    const zone = this.get(zoneId);
    if (!zone) return null;
    zone.status = zone.status === 'active' ? 'inactive' : 'active';
    return this.save(zone);
  },
};

/* ---------------- Campaigns ---------------- */
const CampaignStore = {
  all() {
    return readJSON(DB_KEYS.campaigns, []).sort((a, b) => b.updatedAt - a.updatedAt);
  },
  get(id) {
    return readJSON(DB_KEYS.campaigns, []).find(c => c.id === id) || null;
  },
  save(campaign) {
    const campaigns = readJSON(DB_KEYS.campaigns, []);
    campaign.updatedAt = Date.now();
    const idx = campaigns.findIndex(c => c.id === campaign.id);
    if (idx >= 0) campaigns[idx] = campaign; else campaigns.push(campaign);
    writeJSON(DB_KEYS.campaigns, campaigns);
    return campaign;
  },
  remove(id) {
    const campaigns = readJSON(DB_KEYS.campaigns, []).filter(c => c.id !== id);
    writeJSON(DB_KEYS.campaigns, campaigns);
  },
  duplicate(id) {
    const original = this.get(id);
    if (!original) return null;
    const copy = JSON.parse(JSON.stringify(original));
    copy.id = uid('camp');
    copy.name = `${original.name} (copie)`;
    copy.status = 'draft';
    copy.createdAt = Date.now();
    copy.updatedAt = Date.now();
    return this.save(copy);
  },
  setStatus(id, status) {
    const campaign = this.get(id);
    if (!campaign) return null;
    campaign.status = status;
    return this.save(campaign);
  },
  createBlank() {
    const now = Date.now();
    return {
      id: uid('camp'),
      name: '',
      description: '',
      startDate: '',
      endDate: '',
      status: 'draft',
      zoneIds: [],
      content: {
        type: 'text',
        title: '',
        text: '',
        cta: '',
        url: '',
        mediaUrl: '',
      },
      behavior: {
        display: 'immediate',
        delayMinutes: 5,
        frequency: 'multiple',
        priority: 'normal',
      },
      createdAt: now,
      updatedAt: now,
    };
  },
  /** Computes a display status factoring in dates (schedule awareness) */
  computedStatus(c) {
    if (c.status === 'draft' || c.status === 'paused') return c.status;
    const today = new Date().toISOString().slice(0, 10);
    if (c.endDate && c.endDate < today) return 'ended';
    if (c.startDate && c.startDate > today) return 'scheduled';
    if (c.status === 'active') return 'active';
    return c.status;
  },
  activeForZone(zoneId) {
    const today = new Date().toISOString().slice(0, 10);
    return this.all()
      .filter(c => c.status === 'active' && c.zoneIds.includes(zoneId))
      .filter(c => (!c.startDate || c.startDate <= today) && (!c.endDate || c.endDate >= today))
      .sort((a, b) => {
        const order = { high: 0, normal: 1, low: 2 };
        return order[a.behavior.priority] - order[b.behavior.priority];
      });
  },
};

/* ---------------- Events (trigger log) ---------------- */
const EventStore = {
  all() {
    return readJSON(DB_KEYS.events, []).sort((a, b) => b.timestamp - a.timestamp);
  },
  add(event) {
    const events = readJSON(DB_KEYS.events, []);
    events.push(event);
    // cap history to last 200 events to keep storage light
    const trimmed = events.slice(-200);
    writeJSON(DB_KEYS.events, trimmed);
    return event;
  },
  clear() {
    writeJSON(DB_KEYS.events, []);
  },
};

/* ---------------- Settings ---------------- */
const SettingsStore = {
  get() {
    return readJSON(DB_KEYS.settings, { orgName: 'Mon organisation' });
  },
  save(settings) {
    writeJSON(DB_KEYS.settings, settings);
    return settings;
  },
};

/* ---------------- Seed demo data ---------------- */
function seedDemoData(force = false) {
  const alreadySeeded = readJSON(DB_KEYS.seeded, false);
  if (alreadySeeded && !force) return;

  const zoneDefs = [
    { name: 'Entrée', description: 'Zone d\u2019accueil, premier contact visiteur' },
    { name: 'Vitrine', description: 'Devanture extérieure, forte visibilité' },
    { name: 'Rayon Mode', description: 'Espace prêt-à-porter et accessoires' },
    { name: 'Rayon Chaussures', description: 'Espace chaussures et maroquinerie' },
    { name: 'Nouveautés', description: 'Table de mise en avant des nouveautés' },
    { name: 'Caisse', description: 'Zone d\u2019encaissement, dernier point de contact' },
  ];

  writeJSON(DB_KEYS.zones, []);
  const zones = zoneDefs.map(z => ZoneStore.create(z));

  writeJSON(DB_KEYS.campaigns, []);
  const today = new Date();
  const iso = d => d.toISOString().slice(0, 10);
  const addDays = n => { const d = new Date(today); d.setDate(d.getDate() + n); return d; };

  const c1 = CampaignStore.createBlank();
  Object.assign(c1, {
    name: 'Nouvelle collection été',
    description: 'Mise en avant de la nouvelle collection saison.',
    startDate: iso(addDays(-3)),
    endDate: iso(addDays(28)),
    status: 'active',
    zoneIds: [zones[0].zoneId, zones[2].zoneId],
    content: {
      type: 'offer',
      title: 'Découvrez la nouvelle collection',
      text: 'Explorez nos nouveautés disponibles dès aujourd\u2019hui en boutique.',
      cta: 'Découvrir',
      url: 'https://example.com/collection-ete',
      mediaUrl: '',
    },
    behavior: { display: 'immediate', delayMinutes: 0, frequency: 'multiple', priority: 'normal' },
  });
  CampaignStore.save(c1);

  const c2 = CampaignStore.createBlank();
  Object.assign(c2, {
    name: 'Offre Weekend',
    description: 'Promotion flash valable uniquement le weekend.',
    startDate: iso(addDays(4)),
    endDate: iso(addDays(6)),
    status: 'active',
    zoneIds: [zones[5].zoneId],
    content: {
      type: 'offer',
      title: '-15% ce weekend',
      text: 'Profitez de -15% sur tout le magasin, samedi et dimanche uniquement.',
      cta: 'Voir l\u2019offre',
      url: 'https://example.com/offre-weekend',
      mediaUrl: '',
    },
    behavior: { display: 'immediate', delayMinutes: 0, frequency: 'once', priority: 'high' },
  });
  CampaignStore.save(c2);

  const c3 = CampaignStore.createBlank();
  Object.assign(c3, {
    name: 'Fiche produit — Sneakers Aero',
    description: 'Présentation détaillée du modèle vedette du rayon.',
    startDate: iso(addDays(-10)),
    endDate: iso(addDays(-1)),
    status: 'active',
    zoneIds: [zones[3].zoneId],
    content: {
      type: 'product',
      title: 'Sneakers Aero',
      text: 'Légèreté, respirabilité et style. Disponible en 5 coloris.',
      cta: 'Voir la fiche',
      url: 'https://example.com/sneakers-aero',
      mediaUrl: '',
    },
    behavior: { display: 'delay', delayMinutes: 2, frequency: 'multiple', priority: 'low' },
  });
  CampaignStore.save(c3);

  const c4 = CampaignStore.createBlank();
  Object.assign(c4, {
    name: 'Teaser rentrée',
    description: 'Campagne en préparation pour la rentrée.',
    status: 'draft',
    zoneIds: [zones[1].zoneId],
    content: { type: 'text', title: 'La rentrée arrive', text: 'Restez connectés.', cta: '', url: '', mediaUrl: '' },
    behavior: { display: 'immediate', delayMinutes: 0, frequency: 'multiple', priority: 'normal' },
  });
  CampaignStore.save(c4);

  // A few demo simulation events
  EventStore.clear();
  const provider = new SimulationTriggerProvider();
  provider.trigger(zones[0].zoneId);
  provider.trigger(zones[2].zoneId);
  provider.trigger(zones[5].zoneId);

  writeJSON(DB_KEYS.seeded, true);
}

function resetDemoData() {
  writeJSON(DB_KEYS.seeded, false);
  seedDemoData(true);
}
