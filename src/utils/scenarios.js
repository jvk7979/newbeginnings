// Firestore-backed snapshot store for the Calculations page.
// Each project gets a `sharedPlans/{planId}/scenarios` subcollection — the
// same pattern as Research Vault clips — so snapshots sync across devices
// and family members. A scenario is a frozen copy of the calc input plus a
// name, savedAt timestamp, and who saved it.
//
// Previously this was localStorage-only: snapshots were invisible on any
// other device (and to every other collaborator). The one-time migration
// below uploads any legacy local snapshots the first time a project's
// scenarios are subscribed to, then clears the local copy.

import { onSnapshot, setDoc, deleteDoc, updateDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { planScenariosCol, planScenarioRef } from '../data/paths';

const LEGACY_KEY = (projectId) => `calc-scenarios-${projectId}`;

// Upload legacy localStorage snapshots iff the Firestore collection is
// still empty (so a migration from device A can't clobber snapshots that
// device B already migrated and possibly edited). Clears the local copy
// on success either way — once Firestore is the source of truth, a stale
// local cache would only re-trigger this check forever.
async function migrateLegacyScenarios(projectId) {
  let legacy = [];
  try {
    const raw = localStorage.getItem(LEGACY_KEY(projectId));
    if (!raw) return;
    const parsed = JSON.parse(raw);
    legacy = Array.isArray(parsed) ? parsed : [];
  } catch {
    return;
  }
  try {
    const existing = await getDocs(planScenariosCol(db, projectId));
    if (existing.empty && legacy.length > 0) {
      await Promise.all(legacy.map(s =>
        setDoc(planScenarioRef(db, projectId, s.id), { ...s })
      ));
    }
    localStorage.removeItem(LEGACY_KEY(projectId));
  } catch {
    // Offline / rules rejection — keep the local copy so a later visit
    // can retry the migration.
  }
}

// Live subscription. Runs the legacy migration first, then attaches an
// onSnapshot listener (which, with Firestore offline persistence on,
// also fires immediately from cache and gives optimistic local echoes
// for our own writes). Returns an unsubscribe function.
export function subscribeScenarios(projectId, onChange) {
  if (!projectId) { onChange([]); return () => {}; }
  let unsub = null;
  let cancelled = false;
  (async () => {
    await migrateLegacyScenarios(projectId);
    if (cancelled) return;
    unsub = onSnapshot(planScenariosCol(db, projectId), (snap) => {
      const list = snap.docs.map(d => d.data())
        .sort((a, b) => (a.savedAt || 0) - (b.savedAt || 0));
      onChange(list);
    }, () => onChange([]));
  })();
  return () => { cancelled = true; if (unsub) unsub(); };
}

export function addScenario(projectId, scenario) {
  return setDoc(planScenarioRef(db, projectId, scenario.id), scenario);
}

export function deleteScenario(projectId, scenarioId) {
  return deleteDoc(planScenarioRef(db, projectId, scenarioId));
}

export function renameScenario(projectId, scenarioId, name) {
  return updateDoc(planScenarioRef(db, projectId, scenarioId), { name });
}
