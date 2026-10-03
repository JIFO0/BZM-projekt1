import { createApp } from './server';
import { MemoryReportsRepository } from './storage';

describe('User Reports & Place Comments API', () => {
  let app: ReturnType<typeof createApp>;
  let repo: MemoryReportsRepository;

  beforeEach(() => {
    repo = new MemoryReportsRepository();
    app = createApp({ repo });
  });

  describe('Route Hazards API (/api/hazards & /admin/hazards)', () => {
    test('POST /api/hazards requires email for public submissions', async () => {
      const res = await app.request('/api/hazards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: 'Hole in the pavement',
          category: 'hole',
        }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toMatch(/email/i);
    });

    test('POST /admin/hazards allows submissions without email', async () => {
      const res = await app.request('/admin/hazards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: 'Municipal pothole report',
          category: 'hole',
          position: { lat: 50.062, lon: 19.938 },
        }),
      });

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.id).toMatch(/^hazard-/);
      expect(data.description).toBe('Municipal pothole report');
      expect(data.status).toBe('reported');
      expect(data.stillHereCount).toBe(0);
      expect(data.fixedCount).toBe(0);
      expect(data.position).toEqual({ lat: 50.062, lon: 19.938 });
    });

    test('POST /api/hazards validates description is non-empty', async () => {
      const res = await app.request('/api/hazards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: '   ',
          email: 'user@example.com',
        }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toMatch(/description/i);
    });

    test('POST /api/hazards successfully creates hazard with valid payload', async () => {
      const res = await app.request('/api/hazards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: 'Broken curb on Floriańska',
          category: 'obstacle',
          email: 'jan@example.com',
          position: { lat: 50.063, lon: 19.939 },
        }),
      });

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.id).toBeDefined();
      expect(data.email).toBe('jan@example.com');
      expect(data.category).toBe('obstacle');
      expect(data.stillHereCount).toBe(0);
      expect(data.fixedCount).toBe(0);
    });

    test('GET /api/hazards lists all hazards with filtering', async () => {
      // Create 2 hazards
      await repo.createHazard({
        description: 'Hole 1',
        category: 'hole',
        position: { lat: 50.06, lon: 19.93 },
      });
      await repo.createHazard({
        description: 'Obstacle 2',
        category: 'obstacle',
        position: { lat: 50.07, lon: 19.94 },
      });

      const resAll = await app.request('/api/hazards');
      expect(resAll.status).toBe(200);
      const allData = await resAll.json();
      expect(allData.total).toBe(2);
      expect(allData.items).toHaveLength(2);

      const resFiltered = await app.request('/api/hazards?category=hole');
      expect(resFiltered.status).toBe(200);
      const filteredData = await resFiltered.json();
      expect(filteredData.total).toBe(1);
      expect(filteredData.items[0].description).toBe('Hole 1');
    });

    test('GET /api/hazards/:id retrieves single hazard or 404', async () => {
      const created = await repo.createHazard({
        description: 'Temporary barrier',
      });

      const resFound = await app.request(`/api/hazards/${created.id}`);
      expect(resFound.status).toBe(200);
      const foundData = await resFound.json();
      expect(foundData.id).toBe(created.id);

      const resNotFound = await app.request('/api/hazards/non-existent-hazard');
      expect(resNotFound.status).toBe(404);
      const notFoundData = await resNotFound.json();
      expect(notFoundData.error).toMatch(/not found/i);
    });

    test('POST /api/hazards/:id/verify requires email for public votes', async () => {
      const hazard = await repo.createHazard({ description: 'Testing votes' });

      const res = await app.request(`/api/hazards/${hazard.id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'still_here' }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toMatch(/email/i);
    });

    test('POST /api/hazards/:id/verify rejects invalid action', async () => {
      const hazard = await repo.createHazard({ description: 'Testing votes' });

      const res = await app.request(`/api/hazards/${hazard.id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'bogus_action', email: 'voter@example.com' }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toMatch(/invalid action/i);
    });

    test('Verification vote state machine: vote, duplicate conflict, vote switch, and undo (unset)', async () => {
      const hazard = await repo.createHazard({ description: 'Pothole on Market Square' });
      const voterEmail = 'anna@example.com';

      // 1. Initial vote: still_here
      const res1 = await app.request(`/api/hazards/${hazard.id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'still_here', email: voterEmail }),
      });
      expect(res1.status).toBe(200);
      const data1 = await res1.json();
      expect(data1.action).toBe('still_here');
      expect(data1.userVote).toBe('still_here');
      expect(data1.stillHereCount).toBe(1);
      expect(data1.fixedCount).toBe(0);

      // 2. Duplicate vote: still_here again -> 409 Conflict
      const resDup = await app.request(`/api/hazards/${hazard.id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'still_here', email: voterEmail }),
      });
      expect(resDup.status).toBe(409);
      const dataDup = await resDup.json();
      expect(dataDup.error).toMatch(/already verified/i);

      // 3. Switch vote to: fixed -> stillHereCount decrements, fixedCount increments
      const resSwitch = await app.request(`/api/hazards/${hazard.id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'fixed', email: voterEmail }),
      });
      expect(resSwitch.status).toBe(200);
      const dataSwitch = await resSwitch.json();
      expect(dataSwitch.action).toBe('fixed');
      expect(dataSwitch.userVote).toBe('fixed');
      expect(dataSwitch.stillHereCount).toBe(0);
      expect(dataSwitch.fixedCount).toBe(1);

      // 4. Undo vote via action: 'unset' -> fixedCount decrements back to 0, userVote cleared
      const resUnset = await app.request(`/api/hazards/${hazard.id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unset', email: voterEmail }),
      });
      expect(resUnset.status).toBe(200);
      const dataUnset = await resUnset.json();
      expect(dataUnset.action).toBe('unset');
      expect(dataUnset.userVote).toBeNull();
      expect(dataUnset.stillHereCount).toBe(0);
      expect(dataUnset.fixedCount).toBe(0);

      // 5. Calling 'unset' with no prior vote returns 200 without negative counters
      const resUnsetAgain = await app.request(`/api/hazards/${hazard.id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unset', email: 'stranger@example.com' }),
      });
      expect(resUnsetAgain.status).toBe(200);
      const dataUnsetAgain = await resUnsetAgain.json();
      expect(dataUnsetAgain.stillHereCount).toBe(0);
      expect(dataUnsetAgain.fixedCount).toBe(0);
    });

    test('DELETE /api/hazards/:id is blocked (405 Method Not Allowed)', async () => {
      const hazard = await repo.createHazard({ description: 'To be removed' });

      const res = await app.request(`/api/hazards/${hazard.id}`, {
        method: 'DELETE',
      });

      expect(res.status).toBe(405);
      const data = await res.json();
      expect(data.error).toMatch(/restricted to administrative endpoints/i);

      // Verify hazard still exists
      const check = await repo.getHazard(hazard.id);
      expect(check).not.toBeNull();
    });

    test('DELETE /admin/hazards/:id deletes hazard successfully', async () => {
      const hazard = await repo.createHazard({ description: 'Admin removable hazard' });

      const res = await app.request(`/admin/hazards/${hazard.id}`, {
        method: 'DELETE',
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.deletedId).toBe(hazard.id);

      // Verify hazard is gone
      const check = await repo.getHazard(hazard.id);
      expect(check).toBeNull();
    });
  });

  describe('Place Comments API (/api/places & /admin/places)', () => {
    test('POST /api/places/:placeId/comments requires email for public submissions', async () => {
      const res = await app.request('/api/places/place-sukiennice/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sentiment: 'positive',
          comment: 'Ramp at the entrance',
        }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toMatch(/email/i);
    });

    test('POST /admin/places/:placeId/comments allows submissions without email', async () => {
      const res = await app.request('/admin/places/place-sukiennice/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sentiment: 'positive',
          comment: 'Verified accessible doorway',
          category: 'entrance',
        }),
      });

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.id).toMatch(/^comm-/);
      expect(data.sentiment).toBe('positive');
      expect(data.comment).toBe('Verified accessible doorway');
    });

    test('POST /api/places/:placeId/comments rejects non-existent placeId', async () => {
      const res = await app.request('/api/places/unknown-shop-12345/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sentiment: 'positive',
          comment: 'Nice place',
          email: 'tourist@example.com',
        }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toMatch(/does not exist/i);
    });

    test('POST /api/places/:placeId/comments strictly overrides spoofed coordinates with canonical place position', async () => {
      // User attempts to inject custom lat/lon
      const res = await app.request('/api/places/place-sukiennice/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sentiment: 'positive',
          comment: 'Wide automated doors',
          category: 'entrance',
          email: 'user@example.com',
          position: { lat: 10.0, lon: 20.0 }, // Fake coordinates
        }),
      });

      expect(res.status).toBe(201);
      const data = await res.json();
      // Must match Sukiennice canonical coordinates (50.0619, 19.9373)
      expect(data.position.lat).toBeCloseTo(50.0619, 3);
      expect(data.position.lon).toBeCloseTo(19.9373, 3);
      expect(data.placeName).toMatch(/Sukiennice/);
    });

    test('GET /api/places/:placeId/comments returns comments and sentiment stats', async () => {
      await repo.addPlaceComment({
        placeId: 'place-sukiennice',
        sentiment: 'positive',
        comment: 'Great ramp',
        email: 'u1@example.com',
      });
      await repo.addPlaceComment({
        placeId: 'place-sukiennice',
        sentiment: 'positive',
        comment: 'Spacious interior',
        email: 'u2@example.com',
      });
      await repo.addPlaceComment({
        placeId: 'place-sukiennice',
        sentiment: 'negative',
        comment: 'Heavy manual doors',
        email: 'u3@example.com',
      });

      const res = await app.request('/api/places/place-sukiennice/comments');
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.placeId).toBeDefined();
      expect(data.stats).toEqual({
        positiveCount: 2,
        negativeCount: 1,
        score: 1,
      });
      expect(data.items).toHaveLength(3);
    });

    test('GET /api/places/comments queries all comments across places', async () => {
      await repo.addPlaceComment({
        placeId: 'place-sukiennice',
        sentiment: 'positive',
        comment: 'Comment 1',
      });

      const res = await app.request('/api/places/comments');
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.total).toBe(1);
      expect(data.items[0].comment).toBe('Comment 1');
    });

    test('DELETE /api/places/:placeId/comments/:commentId enforces author email validation', async () => {
      const authorEmail = 'author@example.com';
      const comment = await repo.addPlaceComment({
        placeId: 'place-sukiennice',
        sentiment: 'positive',
        comment: 'Comment to be protected',
        email: authorEmail,
      });
      expect(comment).not.toBeNull();

      // 1. Missing email -> 400 Bad Request
      const resNoEmail = await app.request(
        `/api/places/place-sukiennice/comments/${comment!.id}`,
        {
          method: 'DELETE',
        }
      );
      expect(resNoEmail.status).toBe(400);

      // 2. Mismatched email -> 403 Forbidden
      const resForbidden = await app.request(
        `/api/places/place-sukiennice/comments/${comment!.id}`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'imposter@example.com' }),
        }
      );
      expect(resForbidden.status).toBe(403);
      const dataForbidden = await resForbidden.json();
      expect(dataForbidden.error).toMatch(/does not match/i);

      // 3. Matching author email -> 200 OK
      const resSuccess = await app.request(
        `/api/places/place-sukiennice/comments/${comment!.id}`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: authorEmail }),
        }
      );
      expect(resSuccess.status).toBe(200);
      const dataSuccess = await resSuccess.json();
      expect(dataSuccess.success).toBe(true);
      expect(dataSuccess.deletedCommentId).toBe(comment!.id);

      // 4. Repeated delete -> 404 Not Found
      const resRepeat = await app.request(
        `/api/places/place-sukiennice/comments/${comment!.id}`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: authorEmail }),
        }
      );
      expect(resRepeat.status).toBe(404);
    });

    test('DELETE /admin/places/:placeId/comments/:commentId deletes without email requirement', async () => {
      const comment = await repo.addPlaceComment({
        placeId: 'place-sukiennice',
        sentiment: 'negative',
        comment: 'Spam comment',
        email: 'spammer@example.com',
      });

      const res = await app.request(
        `/admin/places/place-sukiennice/comments/${comment!.id}`,
        {
          method: 'DELETE',
        }
      );

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.deletedCommentId).toBe(comment!.id);
    });
  });
});
