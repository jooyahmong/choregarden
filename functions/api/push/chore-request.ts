interface Env { FIREBASE_PROJECT_ID: string; FIREBASE_SERVICE_ACCOUNT_EMAIL: string; FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY: string; }
const text = new TextEncoder();
const base64Url = (value: string | ArrayBuffer) => btoa(typeof value === 'string' ? value : String.fromCharCode(...new Uint8Array(value))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
const decodeBytes = (value: string) => { const normalized = value.replace(/-/g, '+').replace(/_/g, '/'); return Uint8Array.from(atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')), (c) => c.charCodeAt(0)); };
const decode = (value: string) => JSON.parse(new TextDecoder().decode(decodeBytes(value)));
const toObject = (fields: Record<string, { stringValue?: string; booleanValue?: boolean }> = {}) => Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, value.stringValue ?? value.booleanValue]));
const documentUrl = (env: Env, path: string) => `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/${path}`;
const firestore = (env: Env, token: string, path: string, init?: RequestInit) => fetch(documentUrl(env, path), { ...init, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(init?.headers ?? {}) } });

async function getServiceToken(env: Env) {
  const now = Math.floor(Date.now() / 1000); const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = base64Url(JSON.stringify({ iss: env.FIREBASE_SERVICE_ACCOUNT_EMAIL, scope: 'https://www.googleapis.com/auth/firebase.messaging https://www.googleapis.com/auth/datastore', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 }));
  const keyData = env.FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, '\n').replace(/-----[^-]+-----/g, '').replace(/\s/g, '');
  const key = await crypto.subtle.importKey('pkcs8', Uint8Array.from(atob(keyData), (c) => c.charCodeAt(0)), { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, text.encode(`${header}.${claim}`));
  const response = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${header}.${claim}.${base64Url(signature)}` }) });
  if (!response.ok) throw new Error('service-token'); return (await response.json() as { access_token: string }).access_token;
}

const readDer = (bytes: Uint8Array, start: number) => { let offset = start + 1; let length = bytes[offset++]; if (length & 0x80) { const count = length & 0x7f; length = 0; for (let index = 0; index < count; index += 1) length = (length << 8) | bytes[offset++]; } return { tag: bytes[start], start, contentStart: offset, end: offset + length }; };
const extractSpki = (certificate: string) => { const bytes = Uint8Array.from(atob(certificate.replace(/-----[^-]+-----/g, '').replace(/\s/g, '')), (c) => c.charCodeAt(0)); const root = readDer(bytes, 0); const tbs = readDer(bytes, root.contentStart); let offset = tbs.contentStart; let node = readDer(bytes, offset); if (node.tag === 0xa0) { offset = node.end; node = readDer(bytes, offset); } for (let index = 0; index < 5; index += 1) { offset = node.end; node = readDer(bytes, offset); } return bytes.slice(node.start, node.end); };
async function verifyIdToken(token: string, projectId: string) {
  const [header, payload, signature] = token.split('.'); if (!header || !payload || !signature) throw new Error('token'); const headerClaims = decode(header); const claims = decode(payload); const now = Math.floor(Date.now() / 1000);
  if (headerClaims.alg !== 'RS256' || !headerClaims.kid || claims.aud !== projectId || claims.iss !== `https://securetoken.google.com/${projectId}` || claims.exp <= now || claims.iat > now || claims.auth_time > now || typeof claims.sub !== 'string' || !claims.sub || claims.sub.length > 128) throw new Error('claims');
  const certificates = await (await fetch('https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com')).json() as Record<string, string>; const certificate = certificates[headerClaims.kid]; if (!certificate) throw new Error('key');
  const key = await crypto.subtle.importKey('spki', extractSpki(certificate), { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']); const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, decodeBytes(signature), text.encode(`${header}.${payload}`)); if (!valid) throw new Error('signature'); return claims.sub as string;
}

export const onRequestGet: PagesFunction<Env> = () => new Response(null, { status: 405, headers: { Allow: 'POST' } });

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const idToken = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, ''); if (!idToken) return new Response('Unauthorized', { status: 401 });
    const body = await request.json() as { requestId?: string; choreRequestId?: string }; const choreRequestId = body.requestId ?? body.choreRequestId; if (!choreRequestId) return new Response('Bad request', { status: 400 });
    const uid = await verifyIdToken(idToken, env.FIREBASE_PROJECT_ID); const access = await getServiceToken(env);
    const session = toObject((await (await firestore(env, access, `childSessions/${uid}`)).json()).fields); const chore = toObject((await (await firestore(env, access, `choreRequests/${choreRequestId}`)).json()).fields);
    if (session.childId !== chore.childId || session.familyId !== chore.familyId || chore.status !== 'pending') { console.error('[push:chore] forbidden', { hasSession: !!session.childId, choreStatus: chore.status }); return new Response('Forbidden', { status: 403 }); }
    const dedupe = await firestore(env, access, `pushDeliveries/${choreRequestId}?currentDocument.exists=false`, { method: 'PATCH', body: JSON.stringify({ fields: { familyId: { stringValue: chore.familyId }, childId: { stringValue: chore.childId } } }) }); if (dedupe.status === 409) return Response.json({ duplicate: true }); if (!dedupe.ok) throw new Error('dedupe');
    const child = toObject((await (await firestore(env, access, `children/${chore.childId}`)).json()).fields); const devices = await (await firestore(env, access, `pushDevices/${chore.familyId}/devices`)).json() as { documents?: Array<{ name: string; fields: Record<string, { stringValue?: string; booleanValue?: boolean }> }> };
    const data = { title: 'ChoreGarden', body: `${child.name || '아이'}님이 한 일 승인을 요청했어요.`, url: `/parent/chores?requestId=${encodeURIComponent(choreRequestId)}`, requestId: choreRequestId }; let delivered = 0;
    for (const device of devices.documents ?? []) { const value = toObject(device.fields); if (!value.installationId || (value.choreRequests !== true && !(value.choreRequests === undefined && value.enabled === true))) continue; const sent = await fetch(`https://fcm.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/messages:send`, { method: 'POST', headers: { Authorization: `Bearer ${access}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ message: { fid: value.installationId, data, notification: { title: data.title, body: data.body }, webpush: { notification: { title: data.title, body: data.body, icon: '/icon-192.png', badge: '/icon-192.png', tag: data.requestId }, fcm_options: { link: new URL(data.url, request.url).href } } } }) }); if (sent.ok) { delivered += 1; continue; } const error = await sent.json().catch(() => null) as { error?: { status?: string } } | null; console.error('[push:chore] FCM rejected device', { status: sent.status, code: error?.error?.status ?? 'unknown' }); if (error?.error?.status === 'UNREGISTERED' || error?.error?.status === 'INVALID_ARGUMENT' || error?.error?.status === 'NOT_FOUND') await firestore(env, access, device.name.split('/documents/')[1], { method: 'DELETE' }); }
    console.log('[push:chore] delivered', { delivered, devices: devices.documents?.length ?? 0 });
    return Response.json({ delivered });
  } catch (error) { console.error('[push:chore] delivery failed', error instanceof Error ? error.message : String(error)); return new Response('Notification delivery failed', { status: 500 }); }
};
