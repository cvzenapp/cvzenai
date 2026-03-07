import { Router } from 'express';

const router = Router();

// Common locations database for quick suggestions
const commonLocations = [
  // Major cities
  { name: 'New York, NY, USA', lat: '40.7128', lon: '-74.0060' },
  { name: 'Los Angeles, CA, USA', lat: '34.0522', lon: '-118.2437' },
  { name: 'Chicago, IL, USA', lat: '41.8781', lon: '-87.6298' },
  { name: 'Houston, TX, USA', lat: '29.7604', lon: '-95.3698' },
  { name: 'Phoenix, AZ, USA', lat: '33.4484', lon: '-112.0740' },
  { name: 'Philadelphia, PA, USA', lat: '39.9526', lon: '-75.1652' },
  { name: 'San Antonio, TX, USA', lat: '29.4241', lon: '-98.4936' },
  { name: 'San Diego, CA, USA', lat: '32.7157', lon: '-117.1611' },
  { name: 'Dallas, TX, USA', lat: '32.7767', lon: '-96.7970' },
  { name: 'San Jose, CA, USA', lat: '37.3382', lon: '-121.8863' },
  { name: 'Austin, TX, USA', lat: '30.2672', lon: '-97.7431' },
  { name: 'Jacksonville, FL, USA', lat: '30.3322', lon: '-81.6557' },
  { name: 'San Francisco, CA, USA', lat: '37.7749', lon: '-122.4194' },
  { name: 'Columbus, OH, USA', lat: '39.9612', lon: '-82.9988' },
  { name: 'Fort Worth, TX, USA', lat: '32.7555', lon: '-97.3308' },
  { name: 'Indianapolis, IN, USA', lat: '39.7684', lon: '-86.1581' },
  { name: 'Charlotte, NC, USA', lat: '35.2271', lon: '-80.8431' },
  { name: 'Seattle, WA, USA', lat: '47.6062', lon: '-122.3321' },
  { name: 'Denver, CO, USA', lat: '39.7392', lon: '-104.9903' },
  { name: 'Boston, MA, USA', lat: '42.3601', lon: '-71.0589' },
  
  // International cities
  { name: 'London, UK', lat: '51.5074', lon: '-0.1278' },
  { name: 'Paris, France', lat: '48.8566', lon: '2.3522' },
  { name: 'Berlin, Germany', lat: '52.5200', lon: '13.4050' },
  { name: 'Tokyo, Japan', lat: '35.6762', lon: '139.6503' },
  { name: 'Sydney, Australia', lat: '-33.8688', lon: '151.2093' },
  { name: 'Toronto, Canada', lat: '43.6532', lon: '-79.3832' },
  { name: 'Mumbai, India', lat: '19.0760', lon: '72.8777' },
  { name: 'Delhi, India', lat: '28.7041', lon: '77.1025' },
  { name: 'Bangalore, India', lat: '12.9716', lon: '77.5946' },
  { name: 'Singapore', lat: '1.3521', lon: '103.8198' },
  
  // Common business districts
  { name: 'Manhattan, New York, NY, USA', lat: '40.7831', lon: '-73.9712' },
  { name: 'Downtown Los Angeles, CA, USA', lat: '34.0522', lon: '-118.2437' },
  { name: 'Financial District, San Francisco, CA, USA', lat: '37.7946', lon: '-122.3999' },
  { name: 'Loop, Chicago, IL, USA', lat: '41.8781', lon: '-87.6298' },
  { name: 'Midtown, Atlanta, GA, USA', lat: '33.7490', lon: '-84.3880' }
];

// Location search endpoint with fallback to local database
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string' || q.trim().length < 2) {
      return res.json([]);
    }

    const query = q.toLowerCase().trim();
    
    // First, try local search in common locations
    const localResults = commonLocations
      .filter(location => location.name.toLowerCase().includes(query))
      .slice(0, 5)
      .map(location => ({
        display_name: location.name,
        lat: location.lat,
        lon: location.lon,
        place_id: `local_${location.name.replace(/[^a-zA-Z0-9]/g, '_')}`,
        type: 'city',
        importance: 0.8
      }));

    // If we have local results, return them immediately
    if (localResults.length > 0) {
      return res.json(localResults);
    }

    // If no local results and query is long enough, try external API with rate limiting
    if (query.length >= 3) {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=3&addressdetails=1`,
          {
            headers: {
              'User-Agent': 'CVZen-Interview-Scheduler/1.0'
            }
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          
          const externalResults = data.map((item: any) => ({
            display_name: item.display_name,
            lat: item.lat,
            lon: item.lon,
            place_id: item.place_id,
            type: item.type,
            importance: item.importance
          }));
          
          return res.json(externalResults);
        }
      } catch (externalError) {
        console.warn('External API failed, using fallback:', externalError.message);
      }
    }

    // Fallback: create a generic location entry
    const fallbackResult = [{
      display_name: `${q} (Search Location)`,
      lat: '0',
      lon: '0',
      place_id: `fallback_${q.replace(/[^a-zA-Z0-9]/g, '_')}`,
      type: 'search',
      importance: 0.5
    }];
    
    res.json(fallbackResult);
  } catch (error) {
    console.error('Location search error:', error);
    
    // Even on error, provide a fallback result
    const { q } = req.query;
    if (q && typeof q === 'string') {
      const fallbackResult = [{
        display_name: `${q} (Manual Entry)`,
        lat: '0',
        lon: '0',
        place_id: `manual_${q.replace(/[^a-zA-Z0-9]/g, '_')}`,
        type: 'manual',
        importance: 0.3
      }];
      
      res.json(fallbackResult);
    } else {
      res.json([]);
    }
  }
});

export default router;