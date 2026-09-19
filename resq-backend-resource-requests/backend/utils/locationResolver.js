const DEMO_LOCATIONS = [
  { key: 'vijayawada', name: 'Vijayawada', latitude: 16.5062, longitude: 80.6480 },
  { key: 'machilipatnam', name: 'Machilipatnam', latitude: 16.1875, longitude: 81.1389 },
  { key: 'kakinada', name: 'Kakinada', latitude: 16.9891, longitude: 82.2475 },
  { key: 'visakhapatnam', name: 'Visakhapatnam', latitude: 17.6868, longitude: 83.2185 },
  { key: 'eluru', name: 'Eluru', latitude: 16.7107, longitude: 81.0952 },
  { key: 'guntur', name: 'Guntur', latitude: 16.3067, longitude: 80.4365 },
  { key: 'amaravati', name: 'Amaravati', latitude: 16.5730, longitude: 80.3580 },
  { key: 'nellore', name: 'Nellore', latitude: 14.4426, longitude: 79.9865 },
  { key: 'tirupati', name: 'Tirupati', latitude: 13.6288, longitude: 79.4192 },
  { key: 'ongole', name: 'Ongole', latitude: 15.5057, longitude: 80.0499 },
  { key: 'srikakulam', name: 'Srikakulam', latitude: 18.2949, longitude: 83.8938 },
  { key: 'kurnool', name: 'Kurnool', latitude: 15.8281, longitude: 78.0373 },
  { key: 'anantapur', name: 'Anantapur', latitude: 14.6819, longitude: 77.6006 },
  { key: 'kadapa', name: 'Kadapa', latitude: 14.4673, longitude: 78.8242 }
];

function resolveLocation(locationText, latitude, longitude) {
  const lat = Number(latitude);
  const lng = Number(longitude);

  if (Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0) {
    return {
      latitude: lat,
      longitude: lng,
      resolvedLocation: locationText || 'Reported coordinates',
      locationSource: 'reported-coordinates'
    };
  }

  const text = String(locationText || '').toLowerCase();
  const match = DEMO_LOCATIONS.find((location) => text.includes(location.key));

  if (match) {
    return {
      latitude: match.latitude,
      longitude: match.longitude,
      resolvedLocation: match.name,
      locationSource: 'demo-location-match'
    };
  }

  // Safe AP fallback for the hackathon demo when a free-text landmark
  // cannot be geocoded by the local prototype.
  const fallback = DEMO_LOCATIONS[0];
  return {
    latitude: fallback.latitude,
    longitude: fallback.longitude,
    resolvedLocation: `${locationText || 'Reported area'} (demo map point: ${fallback.name})`,
    locationSource: 'demo-fallback'
  };
}

module.exports = { DEMO_LOCATIONS, resolveLocation };
