import { Hono } from 'hono';
import type { ReportsRepository } from '../storage/repository';
import type { CommentSentiment, PlaceFeatureCategory } from '../storage/types';
import { PlacesRegistry, defaultPlacesRegistry } from '../storage/places-registry';

export interface CommentsRouterOptions {
  repo: ReportsRepository;
  placesRegistry?: PlacesRegistry;
  isAdmin?: boolean;
}

const VALID_SENTIMENTS: CommentSentiment[] = ['positive', 'negative'];
const VALID_CATEGORIES: PlaceFeatureCategory[] = [
  'entrance',
  'inside',
  'toilet',
  'surroundings',
  'general',
];

export function createCommentsRouter(options: CommentsRouterOptions): Hono {
  const router = new Hono();
  const { repo, placesRegistry = defaultPlacesRegistry, isAdmin = false } = options;

  // 1. Query All Place Comments (Declared FIRST so "/comments" is not caught by "/:placeId")
  router.get('/comments', async (c) => {
    const bboxParam = c.req.query('bbox');
    const sentimentParam = c.req.query('sentiment');
    const limitParam = c.req.query('limit');

    let bbox: [number, number, number, number] | undefined = undefined;
    if (bboxParam) {
      const parts = bboxParam.split(',').map((p) => parseFloat(p.trim()));
      if (parts.length === 4 && parts.every((n) => !isNaN(n))) {
        bbox = [parts[0], parts[1], parts[2], parts[3]];
      }
    }

    let sentiment: CommentSentiment | undefined = undefined;
    if (sentimentParam && VALID_SENTIMENTS.includes(sentimentParam as CommentSentiment)) {
      sentiment = sentimentParam as CommentSentiment;
    }

    let limit: number | undefined = undefined;
    if (limitParam) {
      const parsed = parseInt(limitParam, 10);
      if (!isNaN(parsed) && parsed > 0) {
        limit = parsed;
      }
    }

    const items = await repo.listAllPlaceComments({
      bbox,
      sentiment,
      limit,
    });

    return c.json({ items, total: items.length }, 200);
  });

  // 2. Add Comment to Place
  router.post('/:placeId/comments', async (c) => {
    const placeId = c.req.param('placeId');

    let body: any;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'Invalid JSON request body.' }, 400);
    }

    if (!body || typeof body !== 'object') {
      return c.json({ error: 'Request body must be an object.' }, 400);
    }

    const sentiment = body.sentiment as CommentSentiment;
    if (!VALID_SENTIMENTS.includes(sentiment)) {
      return c.json(
        { error: "Fields 'sentiment' ('positive' | 'negative') and 'comment' are required." },
        400
      );
    }

    if (!body.comment || typeof body.comment !== 'string' || !body.comment.trim()) {
      return c.json(
        { error: "Fields 'sentiment' ('positive' | 'negative') and 'comment' are required." },
        400
      );
    }

    if (!isAdmin) {
      if (!body.email || typeof body.email !== 'string' || !body.email.trim()) {
        return c.json({ error: "Field 'email' is required for public place comments." }, 400);
      }
    }

    let category: PlaceFeatureCategory | undefined = undefined;
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

    const created = await repo.addPlaceComment({
      placeId,
      sentiment,
      comment: body.comment.trim(),
      category,
      email: body.email ? String(body.email).trim() : undefined,
    });

    if (!created) {
      return c.json(
        {
          error: `Place '${placeId}' does not exist in the system. Comments must be linked to a known place.`,
        },
        400
      );
    }

    return c.json(created, 201);
  });

  // 3. List Comments for a Specific Place
  router.get('/:placeId/comments', async (c) => {
    const placeId = c.req.param('placeId');
    const sentimentParam = c.req.query('sentiment');
    const limitParam = c.req.query('limit');
    const offsetParam = c.req.query('offset');

    let sentiment: CommentSentiment | undefined = undefined;
    if (sentimentParam && VALID_SENTIMENTS.includes(sentimentParam as CommentSentiment)) {
      sentiment = sentimentParam as CommentSentiment;
    }

    const limit = limitParam ? Math.max(1, parseInt(limitParam, 10) || 50) : 50;
    const offset = offsetParam ? Math.max(0, parseInt(offsetParam, 10) || 0) : 0;

    const allPlaceComments = await repo.listPlaceComments(placeId);
    const positiveCount = allPlaceComments.filter((c) => c.sentiment === 'positive').length;
    const negativeCount = allPlaceComments.filter((c) => c.sentiment === 'negative').length;
    const score = positiveCount - negativeCount;

    const items = await repo.listPlaceComments(placeId, sentiment, limit, offset);

    const placeInfo = placesRegistry.getPlace(placeId);
    const resolvedPlaceName = placeInfo ? placeInfo.name : placeId;
    const resolvedPlaceId = placeInfo ? placeInfo.id : placeId;

    return c.json(
      {
        placeId: resolvedPlaceId,
        placeName: resolvedPlaceName,
        stats: {
          positiveCount,
          negativeCount,
          score,
        },
        items,
      },
      200
    );
  });

  // 4. Delete Place Comment
  router.delete('/:placeId/comments/:commentId', async (c) => {
    const placeId = c.req.param('placeId');
    const commentId = c.req.param('commentId');

    let requesterEmail: string | undefined = undefined;

    if (!isAdmin) {
      let body: any = null;
      try {
        body = await c.req.json();
      } catch {
        // empty body or invalid json
      }

      if (!body || typeof body !== 'object' || !body.email || typeof body.email !== 'string' || !body.email.trim()) {
        return c.json(
          { error: "Field 'email' is required to verify comment authorship." },
          400
        );
      }
      requesterEmail = body.email.trim();
    }

    const result = await repo.deletePlaceComment(placeId, commentId, requesterEmail, isAdmin);

    if (result.notFound) {
      return c.json(
        { error: `Comment '${commentId}' not found for place '${placeId}'.` },
        404
      );
    }

    if (result.forbidden) {
      return c.json(
        { error: 'Forbidden: Provided email does not match the author of this comment.' },
        403
      );
    }

    return c.json({ success: true, deletedCommentId: commentId }, 200);
  });

  return router;
}
