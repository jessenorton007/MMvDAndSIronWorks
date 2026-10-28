import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, rm, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:net';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

test('classes registration, privacy, waiver history, and capacity integration', async t => {
  const testRoot = fileURLToPath(new URL('../../../work/classes-tests/', import.meta.url));
  await mkdir(testRoot, { recursive: true });
  const dir = await mkdtemp(path.join(testRoot, 'run-'));
  const server = createServer(); await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port; await new Promise(resolve => server.close(resolve));
  const env = { ...process.env, NODE_ENV: 'development', PORT: String(port), ADMIN_PASSWORD: 'classes-integration-test', ADMIN_SESSION_SECRET: randomUUID(), IRONWORKS_DATA_DIR: dir, IRONWORKS_UPLOAD_DIR: path.join(dir, 'uploads'), IRONWORKS_ANALYTICS_FILE: path.join(dir, 'analytics.json'), IRONWORKS_APP_STORAGE: 'false' };
  delete env.DATABASE_URL;
  const mail = [];
  let rejectMail = false;
  const smtp = createServer(socket => {
    socket.write('220 localhost test SMTP\r\n');
    let buffer = '', data = false, lines = [];
    socket.on('data', chunk => {
      buffer += chunk;
      while (buffer.includes('\r\n')) {
        const end = buffer.indexOf('\r\n');
        const line = buffer.slice(0, end); buffer = buffer.slice(end + 2);
        if (data) {
          if (line === '.') { mail.push(lines.join('\n')); data = false; lines = []; socket.write('250 accepted\r\n'); }
          else lines.push(line);
        } else if (line === 'DATA') { data = true; socket.write('354 send data\r\n'); }
        else if (line === 'QUIT') socket.end('221 bye\r\n');
        else if (rejectMail && line.startsWith('MAIL FROM')) socket.write('550 test rejection\r\n');
        else socket.write('250 OK\r\n');
      }
    });
  });
  await new Promise(resolve => smtp.listen(0, '127.0.0.1', resolve));
  Object.assign(env, { SMTP_HOST: '127.0.0.1', SMTP_PORT: String(smtp.address().port), SMTP_FROM: 'test@example.com', SMTP_SECURE: 'false', SMTP_STARTTLS: 'false', SMTP_USER: '', SMTP_PASS: '', CLASS_NOTIFICATION_TO: 'owner@example.com', CLASSES_PREVIEW: 'false' });
  const cwd = fileURLToPath(new URL('..', import.meta.url));
  let child, logs = '', cookie = '';
  async function start() {
    child = spawn(process.execPath, ['dist/index.mjs'], { cwd, env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    child.stdout.on('data', b => logs += b); child.stderr.on('data', b => logs += b);
    for (let i = 0; i < 100; i++) {
      try { if ((await fetch(`http://127.0.0.1:${port}/api/healthz`)).status < 500) return; } catch {}
      if (child.exitCode !== null) throw new Error(logs);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    throw new Error('Server did not start: ' + logs);
  }
  async function stop() { if (child && child.exitCode === null) { child.kill(); await new Promise(resolve => child.once('exit', resolve)); } }
  async function api(url, body, method = 'POST', auth = false) {
    const response = await fetch(`http://127.0.0.1:${port}/api${url}`, { method: body === undefined ? 'GET' : method, headers: { 'Content-Type': 'application/json', ...(auth ? { Cookie: cookie } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    const result = await response.json(); return { status: response.status, result, response };
  }
  try {
    await start();
    const login = await api('/admin/login', { password: env.ADMIN_PASSWORD }); assert.equal(login.status, 200); cookie = login.response.headers.get('set-cookie').split(';')[0];
    const initial = await api('/admin/classes', undefined, 'GET', true); assert.equal(initial.result.classes.length, 0);
    const catalog = { revision: 0, classes: [{ id: 'test-class', slug: 'test-class', title: 'Test class', level: 'Beginner', description: 'Test project', duration: '2 hours', location: 'Test forge', priceCents: 10000, published: true, images: [], sessions: [{ id: 'test-session', startsAt: new Date(Date.now() + 7 * 86400000).toISOString(), capacity: 1, closed: false }] }], waiver: { version: 'test-v1', text: 'TEST ONLY — not a legal waiver.', enabled: true } };
    catalog.classes[0].paymentUrl = 'https://connect.intuit.com/pay/test/beginner';
    const invalidCatalog = structuredClone(catalog); invalidCatalog.classes[0].paymentUrl = 'https://connect.intuit.com.evil.example/pay/test';
    assert.equal((await api('/admin/classes', invalidCatalog, 'PUT', true)).status, 400);
    const saved = await api('/admin/classes', catalog, 'PUT', true); assert.equal(saved.status, 200, JSON.stringify(saved.result));
    assert.equal(saved.result.classes[0].paymentUrl, catalog.classes[0].paymentUrl);
    await t.test('private records and mutations require authentication', async () => {
      assert.equal((await api('/admin/classes')).status, 401);
      assert.equal((await api('/admin/classes', catalog, 'PUT')).status, 401);
      assert.equal((await api('/admin/content/private-classes-state')).status, 400);
      const pub = await api('/classes'); assert.equal(pub.result.classes.length, 1); assert.equal(pub.result.registrations, undefined);
    });
    await t.test('direct class links and existing routes render with correct HTTP status', async () => {
      for (const route of ['/classes', '/classes/test-class', '/', '/services']) assert.equal((await fetch(`http://127.0.0.1:${port}${route}`)).status, 200, route);
      assert.equal((await fetch(`http://127.0.0.1:${port}/classes/does-not-exist`)).status, 404);
      const sitemap = await (await fetch(`http://127.0.0.1:${port}/sitemap.xml`)).text(); assert.ok(sitemap.includes('/classes/test-class'));
    });
    const registration = name => ({ requestId: randomUUID(), classId: 'test-class', sessionId: 'test-session', name, email: name.toLowerCase() + '@example.com', phone: '', signature: name, consent: true, waiverVersion: 'test-v1' });
    let first, second;
    await t.test('signature, waiver version, retries, and duplicate checks', async () => {
      const body = registration('First');
      assert.equal((await api('/classes/registrations', { ...body, signature: 'Someone Else' })).status, 400);
      assert.equal((await api('/classes/registrations', { ...body, waiverVersion: 'old' })).status, 400);
      first = await api('/classes/registrations', body); assert.equal(first.status, 201);
      assert.equal(first.result.paymentUrl, catalog.classes[0].paymentUrl);
      assert.equal(mail.length, 2);
      assert.ok(mail.some(text => text.includes('To: owner@example.com') && text.includes('Reply-To: first@example.com')));
      assert.ok(mail.some(text => text.includes('To: first@example.com') && text.includes('Your place is not confirmed yet.')));
      assert.ok(mail.every(text => !text.includes('TEST ONLY — not a legal waiver.')));
      assert.equal((await api('/classes/registrations', body)).result.id, first.result.id);
      assert.equal((await api('/classes/registrations', { ...body, requestId: randomUUID() })).status, 400);
      assert.equal(mail.length, 2, 'Retries and rejected duplicates must not send email');
      rejectMail = true;
      second = await api('/classes/registrations', registration('Second')); assert.equal(second.status, 201);
      assert.equal(mail.length, 2, 'SMTP failure must not prevent saving registration');
      rejectMail = false;
    });
    await t.test('concurrent confirmations cannot overbook; cancellation frees capacity', async () => {
      const results = await Promise.all([first, second].map(r => api(`/admin/classes/registrations/${r.result.id}`, { status: 'confirmed' }, 'PATCH', true)));
      assert.deepEqual(results.map(r => r.status).sort(), [200, 400]);
      const state = (await api('/admin/classes', undefined, 'GET', true)).result;
      const confirmed = state.registrations.find(r => r.status === 'confirmed');
      assert.equal((await api('/classes')).result.classes[0].sessions[0].remaining, 0);
      assert.equal((await api('/classes/registrations', registration('Third'))).status, 400);
      assert.equal((await api(`/admin/classes/registrations/${confirmed.id}`, { status: 'cancelled' }, 'PATCH', true)).status, 200);
      assert.equal((await api('/classes')).result.classes[0].sessions[0].remaining, 1);
    });
    await t.test('catalog conflicts, immutable waiver snapshots, session protection', async () => {
      assert.equal((await api('/admin/classes', catalog, 'PUT', true)).status, 400);
      let state = (await api('/admin/classes', undefined, 'GET', true)).result;
      assert.equal((await api('/admin/classes', { ...state, classes: [] }, 'PUT', true)).status, 400);
      assert.equal((await api('/admin/classes', { ...state, waiver: { ...state.waiver, text: 'Changed text' } }, 'PUT', true)).status, 400);
      state.waiver = { text: 'TEST ONLY v2', version: 'test-v2', enabled: true };
      assert.equal((await api('/admin/classes', state, 'PUT', true)).status, 200);
      state = (await api('/admin/classes', undefined, 'GET', true)).result;
      assert.equal(state.registrations[0].waiverText, 'TEST ONLY — not a legal waiver.');
      assert.equal(state.registrations[0].paymentStatus, 'not_connected');
      state.classes[0].sessions[0].closed = true;
      assert.equal((await api('/admin/classes', state, 'PUT', true)).status, 200);
      assert.equal((await api('/classes/registrations', { ...registration('Closed'), waiverVersion: 'test-v2' })).status, 400);
    });
    await t.test('hidden classes and disabled waivers cannot accept signups', async () => {
      let state = (await api('/admin/classes', undefined, 'GET', true)).result;
      state.classes[0].sessions[0].closed = false; state.classes[0].published = false;
      assert.equal((await api('/admin/classes', state, 'PUT', true)).status, 200);
      assert.equal((await api('/classes')).result.classes.length, 0);
      assert.equal((await api('/classes/registrations', { ...registration('Hidden'), waiverVersion: 'test-v2' })).status, 400);
      state = (await api('/admin/classes', undefined, 'GET', true)).result;
      state.classes[0].published = true; state.waiver.enabled = false;
      assert.equal((await api('/admin/classes', state, 'PUT', true)).status, 200);
      assert.equal((await api('/classes/registrations', { ...registration('Disabled'), waiverVersion: 'test-v2' })).status, 400);
    });
    await t.test('records persist across restart and stay off public responses', async () => {
      await stop(); await start();
      const state = (await api('/admin/classes', undefined, 'GET', true)).result;
      assert.equal(state.registrations.length, 2);
      const publicText = JSON.stringify((await api('/classes')).result);
      assert.equal(publicText.includes('first@example.com'), false); assert.equal(publicText.includes('"signature":'), false);
    });
    await t.test('completion and manual approval enforce progression without accounts', async () => {
      let state = (await api('/admin/classes', undefined, 'GET', true)).result;
      state.waiver.enabled = true;
      const template = state.classes[0];
      for (const [id, level] of [['intermediate', 'Intermediate'], ['advanced', 'Advanced'], ['date-night', 'Date night']]) {
        state.classes.push({ ...template, id, slug: id, title: level, level, priceUnit: id === 'date-night' ? 'couple' : 'person', sessions: [{ ...template.sessions[0], id: id + '-session', capacity: 5, closed: false }] });
      }
      assert.equal((await api('/admin/classes', state, 'PUT', true)).status, 200);
      const request = (id, name = 'Second') => ({ ...registration(name), classId: id, sessionId: id + '-session', waiverVersion: 'test-v2' });
      const intermediate = await api('/classes/registrations', request('intermediate'));
      const advanced = await api('/classes/registrations', request('advanced'));
      const dateNight = await api('/classes/registrations', request('date-night', 'DateGuest'));
      assert.equal(intermediate.result.paymentUrl, undefined);
      assert.equal(advanced.result.paymentUrl, undefined);
      assert.equal(dateNight.result.paymentUrl, template.paymentUrl);
      assert.equal(JSON.stringify((await api('/classes')).result).includes('connect.intuit.com'), false, 'Catalog must not expose payment URLs');
      const update = (r, body) => api(`/admin/classes/registrations/${r.result.id}`, body, 'PATCH', true);
      assert.equal((await update(intermediate, { status: 'confirmed' })).status, 400);
      assert.equal((await update(intermediate, { action: 'approve', completionId: second.result.id })).status, 400);
      assert.equal((await update(dateNight, { status: 'confirmed' })).status, 200);
      const partnerBody = { ...request('date-night', 'PartnerGuest'), partnerRegistrationId: dateNight.result.id };
      const partner = await api('/classes/registrations', partnerBody);
      assert.equal(partner.status, 201);
      assert.equal(partner.result.paymentUrl, undefined, 'Partner must not get a second payment link');
      assert.equal((await api('/classes/registrations', partnerBody)).result.paymentUrl, undefined);
      assert.equal((await update(partner, { status: 'confirmed' })).status, 200);
      assert.equal((await api('/classes/registrations', { ...request('date-night', 'ThirdGuest'), partnerRegistrationId: dateNight.result.id })).status, 400);
      assert.equal((await api('/classes/registrations', { ...request('date-night', 'WrongRef'), partnerRegistrationId: 'missing' })).status, 400);
      const pairState = (await api('/admin/classes', undefined, 'GET', true)).result;
      assert.equal(pairState.registrations.find(r => r.id === partner.result.id).priceCents, 0);
      assert.equal((await update(dateNight, { status: 'completed' })).status, 400, 'Cannot complete a future session');
      // Advance a fixture session into the past, simulating the actual class date passing.
      const file = path.join(dir, 'classes.json');
      let fixture = JSON.parse(await readFile(file, 'utf8'));
      const beginner = fixture.registrations.find(r => r.id === second.result.id);
      beginner.status = 'confirmed'; beginner.startsAt = new Date(Date.now() - 86400000).toISOString();
      fixture.classes[0].sessions[0].startsAt = beginner.startsAt;
      await writeFile(file, JSON.stringify(fixture));
      assert.equal((await update(second, { status: 'completed' })).status, 200);
      assert.equal((await update(intermediate, { action: 'approve', completionId: second.result.id })).status, 200);
      assert.equal((await update(intermediate, { status: 'confirmed' })).status, 200);
      assert.equal((await update(advanced, { action: 'approve', completionId: second.result.id })).status, 400, 'Beginner cannot qualify for Advanced');
      assert.equal((await update(advanced, { action: 'approve', completionId: intermediate.result.id })).status, 400, 'Confirmed is not completed');
      fixture = JSON.parse(await readFile(file, 'utf8'));
      const attended = fixture.registrations.find(r => r.id === intermediate.result.id);
      attended.startsAt = new Date(Date.now() - 3600000).toISOString();
      fixture.classes.find(c => c.id === 'intermediate').sessions[0].startsAt = attended.startsAt;
      await writeFile(file, JSON.stringify(fixture));
      assert.equal((await update(intermediate, { status: 'completed' })).status, 200);
      assert.equal((await update(advanced, { action: 'approve', completionId: intermediate.result.id })).status, 200);
      assert.equal((await update(advanced, { status: 'confirmed' })).status, 200);
      const stranger = await api('/classes/registrations', request('advanced', 'SomeoneElse'));
      assert.equal(stranger.status, 201);
      assert.equal((await update(stranger, { action: 'approve', completionId: intermediate.result.id })).status, 400, 'Cannot reuse another participant attendance');
      await stop(); await start();
      const persisted = (await api('/admin/classes', undefined, 'GET', true)).result;
      assert.ok(persisted.registrations.find(r => r.id === advanced.result.id).approvedAt);
      assert.ok(persisted.registrations.find(r => r.id === second.result.id).completedAt);
      const publicData = JSON.stringify((await api('/classes')).result);
      assert.equal(publicData.includes('prerequisiteCompletionId'), false);
    });
  } finally { await stop(); await new Promise(resolve => smtp.close(resolve)); await rm(dir, { recursive: true, force: true }); }
});
