/* ============================================================
   LI-FI CAMPAIGN — Trigger provider abstraction
   ------------------------------------------------------------
   CAMPAIGN → ZONE → TRIGGER PROVIDER → EVENT → CONTENT

   La V1 n'a qu'un SimulationTriggerProvider. Une future intégration
   matérielle pourra ajouter un LiFiTriggerProvider qui produit le
   même type de TriggerEvent, sans que le reste de l'application
   n'ait besoin d'être modifié.
   ============================================================ */

class TriggerProvider {
  /** @returns {{event: object, campaign: object|null}} */
  trigger(zoneId) {
    throw new Error('trigger() must be implemented by subclass');
  }
}

class SimulationTriggerProvider extends TriggerProvider {
  trigger(zoneId) {
    const candidates = CampaignStore.activeForZone(zoneId);
    const campaign = candidates[0] || null;

    const event = {
      id: uid('evt'),
      zoneId,
      campaignId: campaign ? campaign.id : null,
      source: 'simulation',
      timestamp: Date.now(),
      metadata: { candidateCount: candidates.length },
    };
    EventStore.add(event);
    return { event, campaign };
  }
}

/* Point d'entrée unique utilisé par l'UI — permettra de basculer vers
   un LiFiTriggerProvider plus tard sans toucher aux vues. */
const activeTriggerProvider = new SimulationTriggerProvider();
