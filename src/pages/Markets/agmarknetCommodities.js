// Coconut-family commodities supported by the data.gov.in Agmarknet resource
// (9ef84268-d588-465a-a308-a864a43d0070). `key` is stored on the commodity
// doc's `agmarknet.key`; `label` is shown in the picker; `name` is the exact
// `filters[commodity]` value the scheduled Cloud Function sends to the API.
export const AGMARKNET_COMMODITIES = [
  { key: 'coconut',        label: 'Coconut',        name: 'Coconut' },
  { key: 'copra',          label: 'Copra',          name: 'Copra' },
  { key: 'coconut-oil',    label: 'Coconut Oil',    name: 'Coconut Oil' },
  { key: 'coconut-seed',   label: 'Coconut Seed',   name: 'Coconut Seed' },
  { key: 'tender-coconut', label: 'Tender Coconut', name: 'Tender Coconut' },
  { key: 'dry-coconut',    label: 'Dry Coconut',    name: 'Dry Coconut' },
];

// Resolve a stored agmarknet key to its full entry — used to re-select the
// picker when editing. Returns null for unknown / missing keys.
export function agmarknetByKey(key) {
  return AGMARKNET_COMMODITIES.find(c => c.key === key) || null;
}
