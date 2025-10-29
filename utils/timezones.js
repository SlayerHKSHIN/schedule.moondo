// Global timezone configuration for major cities
// Organized by region for better UX

const timezoneOptions = {
  // Asia-Pacific
  'Asia': [
    { value: 'Asia/Seoul', label: 'Seoul', abbr: 'KST', offset: '+09:00' },
    { value: 'Asia/Tokyo', label: 'Tokyo', abbr: 'JST', offset: '+09:00' },
    { value: 'Asia/Shanghai', label: 'Shanghai/Beijing', abbr: 'CST', offset: '+08:00' },
    { value: 'Asia/Hong_Kong', label: 'Hong Kong', abbr: 'HKT', offset: '+08:00' },
    { value: 'Asia/Singapore', label: 'Singapore', abbr: 'SGT', offset: '+08:00' },
    { value: 'Asia/Taipei', label: 'Taipei', abbr: 'CST', offset: '+08:00' },
    { value: 'Asia/Bangkok', label: 'Bangkok', abbr: 'ICT', offset: '+07:00' },
    { value: 'Asia/Jakarta', label: 'Jakarta', abbr: 'WIB', offset: '+07:00' },
    { value: 'Asia/Ho_Chi_Minh', label: 'Ho Chi Minh City', abbr: 'ICT', offset: '+07:00' },
    { value: 'Asia/Kolkata', label: 'Mumbai/Delhi', abbr: 'IST', offset: '+05:30' },
    { value: 'Asia/Dubai', label: 'Dubai', abbr: 'GST', offset: '+04:00' },
    { value: 'Asia/Tel_Aviv', label: 'Tel Aviv', abbr: 'IST', offset: '+03:00' },
  ],
  
  // Europe & Africa
  'Europe': [
    { value: 'Europe/London', label: 'London', abbr: 'GMT/BST', offset: '+00:00/+01:00' },
    { value: 'Europe/Paris', label: 'Paris', abbr: 'CET/CEST', offset: '+01:00/+02:00' },
    { value: 'Europe/Berlin', label: 'Berlin', abbr: 'CET/CEST', offset: '+01:00/+02:00' },
    { value: 'Europe/Amsterdam', label: 'Amsterdam', abbr: 'CET/CEST', offset: '+01:00/+02:00' },
    { value: 'Europe/Zurich', label: 'Zurich', abbr: 'CET/CEST', offset: '+01:00/+02:00' },
    { value: 'Europe/Madrid', label: 'Madrid', abbr: 'CET/CEST', offset: '+01:00/+02:00' },
    { value: 'Europe/Rome', label: 'Rome', abbr: 'CET/CEST', offset: '+01:00/+02:00' },
    { value: 'Europe/Stockholm', label: 'Stockholm', abbr: 'CET/CEST', offset: '+01:00/+02:00' },
    { value: 'Europe/Warsaw', label: 'Warsaw', abbr: 'CET/CEST', offset: '+01:00/+02:00' },
    { value: 'Europe/Moscow', label: 'Moscow', abbr: 'MSK', offset: '+03:00' },
    { value: 'Europe/Istanbul', label: 'Istanbul', abbr: 'TRT', offset: '+03:00' },
    { value: 'Africa/Cairo', label: 'Cairo', abbr: 'EET', offset: '+02:00' },
    { value: 'Africa/Johannesburg', label: 'Johannesburg', abbr: 'SAST', offset: '+02:00' },
    { value: 'Africa/Lagos', label: 'Lagos', abbr: 'WAT', offset: '+01:00' },
  ],
  
  // Americas
  'Americas': [
    { value: 'America/New_York', label: 'New York', abbr: 'EST/EDT', offset: '-05:00/-04:00' },
    { value: 'America/Chicago', label: 'Chicago', abbr: 'CST/CDT', offset: '-06:00/-05:00' },
    { value: 'America/Denver', label: 'Denver', abbr: 'MST/MDT', offset: '-07:00/-06:00' },
    { value: 'America/Los_Angeles', label: 'Los Angeles', abbr: 'PST/PDT', offset: '-08:00/-07:00' },
    { value: 'America/Vancouver', label: 'Vancouver', abbr: 'PST/PDT', offset: '-08:00/-07:00' },
    { value: 'America/Toronto', label: 'Toronto', abbr: 'EST/EDT', offset: '-05:00/-04:00' },
    { value: 'America/Montreal', label: 'Montreal', abbr: 'EST/EDT', offset: '-05:00/-04:00' },
    { value: 'America/Mexico_City', label: 'Mexico City', abbr: 'CST', offset: '-06:00' },
    { value: 'America/Sao_Paulo', label: 'São Paulo', abbr: 'BRT', offset: '-03:00' },
    { value: 'America/Buenos_Aires', label: 'Buenos Aires', abbr: 'ART', offset: '-03:00' },
    { value: 'America/Santiago', label: 'Santiago', abbr: 'CLT/CLST', offset: '-04:00/-03:00' },
    { value: 'America/Bogota', label: 'Bogotá', abbr: 'COT', offset: '-05:00' },
  ],
  
  // Oceania
  'Oceania': [
    { value: 'Australia/Sydney', label: 'Sydney', abbr: 'AEDT/AEST', offset: '+11:00/+10:00' },
    { value: 'Australia/Melbourne', label: 'Melbourne', abbr: 'AEDT/AEST', offset: '+11:00/+10:00' },
    { value: 'Australia/Brisbane', label: 'Brisbane', abbr: 'AEST', offset: '+10:00' },
    { value: 'Australia/Perth', label: 'Perth', abbr: 'AWST', offset: '+08:00' },
    { value: 'Pacific/Auckland', label: 'Auckland', abbr: 'NZDT/NZST', offset: '+13:00/+12:00' },
  ]
};

// Flatten for dropdown options with region grouping
const getAllTimezones = () => {
  const flattened = [];
  Object.entries(timezoneOptions).forEach(([region, zones]) => {
    zones.forEach(zone => {
      flattened.push({
        ...zone,
        region,
        display: `${zone.label} (${zone.abbr})`,
        fullDisplay: `${region} - ${zone.label} (${zone.abbr})`
      });
    });
  });
  return flattened;
};

// Get timezone offset for a specific timezone and date
const getTimezoneOffset = (timezone, date = new Date()) => {
  const allZones = getAllTimezones();
  const zone = allZones.find(z => z.value === timezone);
  
  // For America/Chicago (Dallas), which might not be in our list
  if (!zone && timezone === 'America/Chicago') {
    const month = date.getMonth();
    const isDST = month >= 2 && month <= 10;
    return isDST ? '-05:00' : '-06:00'; // CDT/CST
  }
  
  if (!zone) {
    // Better fallback for unknown timezones - don't use local browser offset
    console.warn(`Unknown timezone: ${timezone}, defaulting to UTC`);
    return '+00:00';
  }
  
  // Handle DST for zones with two offsets
  if (zone.offset.includes('/')) {
    const [standard, dst] = zone.offset.split('/');
    const month = date.getMonth();
    
    // Rough DST approximation (Northern Hemisphere)
    if (timezone.startsWith('America/') || timezone.startsWith('Europe/')) {
      return (month >= 2 && month <= 10) ? dst : standard;
    }
    // Southern Hemisphere
    else if (timezone.startsWith('Australia/') || timezone === 'Pacific/Auckland') {
      return (month >= 9 || month <= 3) ? dst : standard;
    }
  }
  
  return zone.offset;
};

// Check if a timezone observes DST
const observesDST = (timezone) => {
  const allZones = getAllTimezones();
  const zone = allZones.find(z => z.value === timezone);
  return zone && zone.offset.includes('/');
};

// Export for CommonJS
module.exports = {
  timezoneOptions,
  getAllTimezones,
  getTimezoneOffset,
  observesDST
};