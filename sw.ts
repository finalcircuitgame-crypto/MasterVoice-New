// MasterVoice Virtual Edge API Service Worker
const CACHE_NAME = 'mv-v2-cache';

self.addEventListener('install', (event: any) => {
  // Use any cast to access skipWaiting on Service Worker scope
  (self as any).skipWaiting();
});

self.addEventListener('activate', (event: any) => {
  // Use any cast to access clients.claim on Service Worker scope
  event.waitUntil((self as any).clients.claim());
});

self.addEventListener('fetch', (event: any) => {
  const url = new URL(event.request.url);

  // Intercept /v2/telemetry
  if (url.pathname === '/v2/telemetry') {
    const authHeader = event.request.headers.get('Authorization') || '';
    
    if (!authHeader.startsWith('mv_elite_')) {
      event.respondWith(
        new Response(JSON.stringify({ 
          error: "Unauthorized", 
          message: "The /v2/telemetry endpoint is restricted to Elite Tier users." 
        }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        })
      );
      return;
    }

    // Generate dynamic mock data
    const regions = ['EU-WEST-1', 'US-EAST-1', 'US-WEST-2', 'AP-SOUTH-1', 'SA-EAST-1'];
    const telemetry = regions.map(region => ({
      id: `node-${region.toLowerCase()}`,
      timestamp: new Date().toISOString(),
      region,
      metrics: {
        rtt: Math.floor(Math.random() * 35) + 8,
        jitter: Math.floor(Math.random() * 4) + 1,
        packet_loss: parseFloat((Math.random() * 0.05).toFixed(4)),
        cpu_load: Math.floor(Math.random() * 20) + 5,
        active_streams: Math.floor(Math.random() * 1000) + 200
      },
      status: 'operational'
    }));

    event.respondWith(
      new Response(JSON.stringify(telemetry), {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    );
  }
});
