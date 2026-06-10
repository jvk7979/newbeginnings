// src/data/paths.js
//
// Single source of truth for Firestore collection / document path
// strings. Previously these were scattered across 14 files — every
// rename ('sharedPlans' → 'sharedProjects' was a near-miss in the
// past) had to chase down stringly-typed references in:
//   - AppContext.jsx (5 shared* collections)
//   - PlanDetailPage / AccessPage / ResearchVault / IdeaTopics
//   - Markets/AutoFetchSettings / Markets/CommodityWatch
//   - AuthContext (allowedUsers)
//
// The functions below take a Firestore `db` instance + entity id and
// return the appropriate CollectionReference or DocumentReference. No
// runtime behaviour change — this is purely a search-and-replace
// refactor to make the names compile-time-resolvable. A typo now
// surfaces as an ImportError, not a silent "permission denied".
//
// Why functions rather than constants: collection paths nested under
// a parent doc (e.g. `sharedPlans/{planId}/clips`) need the parent id
// at call time. Keeping every accessor as a function gives them
// uniform shape.

import { collection, doc } from 'firebase/firestore';

// Top-level shared collections — every entity readable by any allowed
// user, writable by editors only (see firestore.rules isEditor gate).
export const ideasCol        = (db) => collection(db, 'sharedIdeas');
export const ideaRef         = (db, id) => doc(db, 'sharedIdeas', String(id));

export const projectsCol     = (db) => collection(db, 'sharedProjects');
export const projectRef      = (db, id) => doc(db, 'sharedProjects', String(id));

export const plansCol        = (db) => collection(db, 'sharedPlans');
export const planRef         = (db, id) => doc(db, 'sharedPlans', String(id));

export const commoditiesCol  = (db) => collection(db, 'sharedCommodities');
export const commodityRef    = (db, id) => doc(db, 'sharedCommodities', String(id));

export const suppliersCol    = (db) => collection(db, 'sharedSuppliers');
export const supplierRef     = (db, id) => doc(db, 'sharedSuppliers', String(id));

// Per-plan Research Vault clips — nested subcollection of sharedPlans.
export const planClipsCol    = (db, planId)         => collection(db, 'sharedPlans', String(planId), 'clips');
export const planClipRef     = (db, planId, clipId) => doc(db, 'sharedPlans', String(planId), 'clips', String(clipId));

// Per-plan calculation scenarios — frozen calc-input snapshots. Lived in
// localStorage before (device-local, invisible to other family members);
// now a subcollection so they sync like everything else.
export const planScenariosCol = (db, planId)             => collection(db, 'sharedPlans', String(planId), 'scenarios');
export const planScenarioRef  = (db, planId, scenarioId) => doc(db, 'sharedPlans', String(planId), 'scenarios', String(scenarioId));

// Activity feed — lightweight "who did what" events (creates, deletes,
// status changes). Read by the Dashboard feed with a limit() query.
export const activityCol = (db)     => collection(db, 'sharedActivity');
export const activityRef = (db, id) => doc(db, 'sharedActivity', String(id));

// Per-idea discussion topics + their nested comment threads.
export const ideaTopicsCol      = (db, ideaId)              => collection(db, 'ideaTopics', String(ideaId), 'topics');
export const ideaTopicRef       = (db, ideaId, topicId)     => doc(db, 'ideaTopics', String(ideaId), 'topics', String(topicId));
export const ideaTopicCommentsCol = (db, topicId)           => collection(db, 'ideaTopicComments', String(topicId), 'comments');

// Markets feature — auto-fetch schedule config + dashboard callouts.
export const marketsConfigRef   = (db, docId = 'autoFetch') => doc(db, 'marketsConfig', String(docId));
export const marketsCalloutsRef = (db)                       => doc(db, 'marketsConfig', 'callouts');

// Access page — the allowedUsers roster (admin-managed).
export const allowedUsersCol = (db) => collection(db, 'allowedUsers');
export const allowedUserRef  = (db, email) => doc(db, 'allowedUsers', String(email).toLowerCase().trim());

// Legacy per-user collections — only read during one-time migration in
// ensureSharedData() (AppContext.jsx). Kept exposed so the migration
// path stays a one-line change rather than reaching into firebase/firestore
// from a non-data-layer file.
export const legacyUserIdeasCol    = (db, uid) => collection(db, 'users', String(uid), 'ideas');
export const legacyUserProjectsCol = (db, uid) => collection(db, 'users', String(uid), 'projects');
export const legacyUserPlansCol    = (db, uid) => collection(db, 'users', String(uid), 'plans');
