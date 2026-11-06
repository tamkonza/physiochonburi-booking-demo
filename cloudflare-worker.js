// Small CORS bridge: GitHub Pages -> Cloudflare Worker -> Google Apps Script.
// Set ALLOWED_ORIGIN to the exact GitHub Pages origin for this repository.
const GAS_URL = 'https://script.google.com/macros/s/AKfycbyPDwnQqcNlqN4l0fL36CdDbmnaT0N5HjixWY0Wso7-X4ATSRoUSeyqMwFH_0AycCmAaw/exec';
const ALLOWED_ORIGIN = 'https://tamkonza.github.io';

export default {
  async fetch(request) {
    if (request.method === 'GET') {
      return new Response(JSON.stringify({ ok: true, service: 'physio-booking-worker' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    const origin = request.headers.get('Origin') || '';
    const cors = {
      'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
      'Vary': 'Origin'
    };

    if (origin !== ALLOWED_ORIGIN) {
      return new Response(JSON.stringify({ ok: false, error: 'Origin ไม่ได้รับอนุญาต' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ ok: false, error: 'ใช้ POST เท่านั้น' }), {
        status: 405,
        headers: { ...cors, 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    try {
      const body = await request.text();
      JSON.parse(body); // Reject malformed requests before forwarding.
      const upstream = await fetch(GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body
      });
      const headers = new Headers(cors);
      headers.set('Content-Type', upstream.headers.get('Content-Type') || 'application/json; charset=utf-8');
      return new Response(upstream.body, { status: upstream.status, headers });
    } catch (error) {
      return new Response(JSON.stringify({ ok: false, error: 'เชื่อมต่อ Apps Script ไม่สำเร็จ' }), {
        status: 502,
        headers: { ...cors, 'Content-Type': 'application/json; charset=utf-8' }
      });
    }
  }
};
