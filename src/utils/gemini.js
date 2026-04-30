// Browser-side stubs that call the Cloud Functions in functions/index.js.
// Previously these called the Gemini SDK directly with a key inlined into
// the bundle — anyone could lift the key from DevTools and burn billing
// quota. Now the prompt construction lives server-side; the browser only
// sends the user inputs and receives the rendered text back.

import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';

// httpsCallable returns the same wrapper object across calls if given the
// same name, but we cache it explicitly to avoid re-registering on each
// invocation.
const _callables = {};
function callable(name) {
  if (!_callables[name]) _callables[name] = httpsCallable(functions, name);
  return _callables[name];
}

async function invoke(name, data) {
  try {
    const res = await callable(name)(data);
    return res?.data?.text ?? '';
  } catch (err) {
    // Surface a clean message to the page-level toast handlers.
    const msg = err?.message || 'AI service is unavailable. Please try again.';
    throw new Error(msg);
  }
}

export async function analyzeIdea(title, desc) {
  return invoke('analyzeIdea', { title, desc });
}

export async function generatePlanSection(sectionTitle, planTitle, existingContent) {
  return invoke('generatePlanSection', { sectionTitle, planTitle, existingContent });
}

export async function improveSummary(title, summary) {
  return invoke('improveSummary', { title, summary });
}
