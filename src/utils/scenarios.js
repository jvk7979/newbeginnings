// localStorage-backed snapshot store for the Calculations page.
// Each project (selectedProject.id) gets its own slot. A scenario is a
// frozen copy of the calc input plus a name + savedAt timestamp.

const KEY = (projectId) => `calc-scenarios-${projectId}`;

export function loadScenarios(projectId) {
  if (!projectId) return [];
  try {
    const raw = localStorage.getItem(KEY(projectId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveScenarios(projectId, scenarios) {
  if (!projectId) return;
  try {
    localStorage.setItem(KEY(projectId), JSON.stringify(scenarios));
  } catch {
    // Quota exceeded / private mode — silently no-op. The user keeps
    // their in-memory state but the snapshot won't survive reload.
  }
}

export function clearScenarios(projectId) {
  if (!projectId) return;
  try { localStorage.removeItem(KEY(projectId)); } catch {}
}
