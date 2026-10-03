import { Hono } from 'hono';
import type { ReportsRepository } from '../storage/repository';
import type { HazardCategory, HazardStatus, HazardVoteAction } from '../storage/types';

export interface HazardsRouterOptions {
  repo: ReportsRepository;
  isAdmin?: boolean;
}

const VALID_CATEGORIES: HazardCategory[] = ['hole', 'obstacle', 'flood', 'surface', 'other'];
const VALID_ACTIONS: HazardVoteAction[] = ['still_here', 'fixed', 'unset'];

export function createHazardsRouter(options: HazardsRouterOptions): Hono {
  const router = new Hono();
  const { repo, isAdmin = false } = options;

  // 1. Create Hazard
  router.post('/', async (c) => {
    let body: any;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'Invalid JSON request body.' }, 400);
    }

    if (!body || typeof body !== 'object') {
      return c.json({ error: 'Request body must be an object.' }, 400);
    }

    if (!body.description || typeof body.description !== 'string' || !body.description.trim()) {
      return c.json({ error: "Field 'description' is required and cannot be empty." }, 400);
    }

    if (!isAdmin) {
      if (!body.email || typeof body.email !== 'string' || !body.email.trim()) {
        return c.json({ error: "Field 'email' is required for public submissions." }, 400);
      }
    }

    let category: HazardCategory | undefined = undefined;
    if (body.category) {
      if (!VALID_CATEGORIES.includes(body.category)) {
        return c.json(
          {
            error: `Invalid category '${body.category}'. Allowed categories: ${VALID_CATEGORIES.join(', ')}.`,
          },
          400
        );
      }
      category = body.category;
    }

    let position: { lat: number; lon: number } | undefined = undefined;
    if (body.position) {
      if (typeof body.position.lat !== 'number' || typeof body.position.lon !== 'number') {
        return c.json({ error: "Field 'position' must contain numeric 'lat' and 'lon'." }, 400);
      }
      position = {
        lat: body.position.lat,
        lon: body.position.lon,
      };
    }

    const hazard = await repo.createHazard({
      description: body.description.trim(),
      email: body.email ? String(body.email).trim() : undefined,
      category,
      position,
    });

    return c.json(hazard, 201);
  });

  // 2. List Hazards
  router.get('/', async (c) => {
    const bboxParam = c.req.query('bbox');
    const statusParam = c.req.query('status');
    const categoryParam = c.req.query('category');

    let bbox: [number, number, number, number] | undefined = undefined;
    if (bboxParam) {
      const parts = bboxParam.split(',').map((p) => parseFloat(p.trim()));
      if (parts.length === 4 && parts.every((n) => !isNaN(n))) {
        bbox = [parts[0], parts[1], parts[2], parts[3]];
      }
    }

    let status: HazardStatus | 'all' = 'all';
    if (statusParam && ['reported', 'confirmed', 'resolved', 'all'].includes(statusParam)) {
      status = statusParam as HazardStatus | 'all';
    }

    let category: HazardCategory | undefined = undefined;
    if (categoryParam && VALID_CATEGORIES.includes(categoryParam as HazardCategory)) {
      category = categoryParam as HazardCategory;
    }

    const items = await repo.listHazards({
      bbox,
      status,
      category,
    });

    return c.json({ items, total: items.length }, 200);
  });

  // 3. Get Hazard by ID
  router.get('/:id', async (c) => {
    const id = c.req.param('id');
    const hazard = await repo.getHazard(id);
    if (!hazard) {
      return c.json({ error: `Hazard '${id}' not found.` }, 404);
    }
    return c.json(hazard, 200);
  });

  // 4. Verify Hazard ("still_here" / "fixed" / "unset")
  router.post('/:id/verify', async (c) => {
    const id = c.req.param('id');

    let body: any;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'Invalid JSON request body.' }, 400);
    }

    if (!body || typeof body !== 'object') {
      return c.json({ error: 'Request body must be an object.' }, 400);
    }

    const action = body.action as HazardVoteAction;
    if (!VALID_ACTIONS.includes(action)) {
      return c.json(
        {
          error: `Invalid action '${action}'. Allowed actions are: ${VALID_ACTIONS.map((a) => `'${a}'`).join(', ')}.`,
        },
        400
      );
    }

    if (!isAdmin) {
      if (!body.email || typeof body.email !== 'string' || !body.email.trim()) {
        return c.json({ error: "Field 'email' is required for public verification votes." }, 400);
      }
    }

    const voterKey = isAdmin ? (body.email?.trim() || 'admin') : body.email.trim();

    const result = await repo.verifyHazard(id, action, voterKey);

    if (result.error === 'not_found') {
      return c.json({ error: `Hazard '${id}' not found.` }, 404);
    }

    if (result.error === 'already_voted') {
      return c.json(
        {
          error: `User '${voterKey}' has already verified this hazard as '${action}'. Use action 'unset' to undo.`,
        },
        409
      );
    }

    return c.json(
      {
        hazardId: result.hazard.id,
        action,
        userVote: result.userVote,
        stillHereCount: result.hazard.stillHereCount,
        fixedCount: result.hazard.fixedCount,
        status: result.hazard.status,
        updatedAt: result.hazard.updatedAt,
      },
      200
    );
  });

  // 5. Delete Hazard
  router.delete('/:id', async (c) => {
    const id = c.req.param('id');

    if (!isAdmin) {
      return c.json(
        {
          error: 'Hazard deletion is restricted to administrative endpoints (/admin/hazards/:id).',
        },
        405
      );
    }

    const deleted = await repo.deleteHazard(id);
    if (!deleted) {
      return c.json({ error: `Hazard '${id}' not found.` }, 404);
    }

    return c.json({ success: true, deletedId: id }, 200);
  });

  return router;
}
