export const CATEGORY_STYLES = {
  Business:     { bg: '#FDF5E4', color: '#B8892A' },
  Agriculture:  { bg: '#EAF5EE', color: '#2E7D52' },
  Technology:   { bg: '#EAF0FA', color: '#2B5FA6' },
  Finance:      { bg: '#FDF0E4', color: '#C4681C' },
  'Real Estate':{ bg: '#F0EAF8', color: '#6B3FA6' },
  Community:    { bg: '#EAF5EE', color: '#2E7D52' },
  Travel:       { bg: '#EAF0FA', color: '#2B5FA6' },
  Personal:     { bg: '#EDE8DE', color: '#9A8E80' },
  Other:        { bg: '#EDE8DE', color: '#9A8E80' },
};

export const CATEGORIES = ['All', 'Business', 'Agriculture', 'Technology', 'Finance', 'Real Estate', 'Community', 'Personal', 'Other'];

export function getCategoryStyle(category) {
  return CATEGORY_STYLES[category] || CATEGORY_STYLES.Other;
}
