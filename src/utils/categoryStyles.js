export const CATEGORY_STYLES = {
  Business:               { bg: '#FDF5E4', color: '#B8892A' },
  Agriculture:            { bg: '#EAF5EE', color: '#2E7D52' },
  Manufacturing:          { bg: '#EAF0FA', color: '#2B5FA6' },
  'Food Processing':      { bg: '#FDF0E4', color: '#C4681C' },
  'Industrial Production':{ bg: '#F0EAF8', color: '#6B3FA6' },
  'Real Estate':          { bg: '#EDE8DE', color: '#7A6A56' },
  Technology:             { bg: '#EAF0FA', color: '#2B5FA6' },
  Finance:                { bg: '#FDF0E4', color: '#C4681C' },
  Community:              { bg: '#EAF5EE', color: '#2E7D52' },
  Personal:               { bg: '#EDE8DE', color: '#9A8E80' },
  Other:                  { bg: '#EDE8DE', color: '#9A8E80' },
};

export const CATEGORIES = ['All', 'Business', 'Agriculture', 'Manufacturing', 'Food Processing', 'Industrial Production', 'Real Estate', 'Other'];

export const IDEA_CATEGORIES = ['Business', 'Agriculture', 'Manufacturing', 'Food Processing', 'Industrial Production', 'Real Estate', 'Other'];

export function getCategoryStyle(category) {
  return CATEGORY_STYLES[category] || CATEGORY_STYLES.Other;
}
