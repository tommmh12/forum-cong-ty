import { Router, Request, Response } from 'express';
import * as forumRepo from '../repositories/forum.repository';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.middleware';
import { logger } from '../utils/logger';
import {
  CreatePostRequest,
  CreateCommentRequest,
  VoteRequest,
} from '../../../shared/types/forum.types';

const router = Router();

// ==================== SPACES ====================

/**
 * GET /api/forum/spaces
 * Get all spaces (public + user's joined spaces)
 */
router.get('/spaces', optionalAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const spaces = await forumRepo.findAllSpaces();
    res.json(spaces);
  } catch (error) {
    logger.error('Error fetching spaces:', error);
    res.status(500).json({ error: 'Failed to fetch spaces' });
  }
});

/**
 * GET /api/forum/spaces/:id
 * Get space by ID
 */
router.get('/spaces/:id', optionalAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const space = await forumRepo.findSpaceById(req.params.id);
    if (!space) {
      return res.status(404).json({ error: 'Space not found' });
    }
    res.json(space);
  } catch (error) {
    logger.error('Error fetching space:', error);
    res.status(500).json({ error: 'Failed to fetch space' });
  }
});

/**
 * POST /api/forum/spaces
 * Create a new space (requires auth)
 */
router.post('/spaces', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { name, displayName, description, icon, type } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!name || !displayName) {
      return res.status(400).json({ error: 'Name and displayName are required' });
    }

    const space = await forumRepo.createSpace({
      name,
      displayName,
      description,
      icon,
      type: type || 'PUBLIC',
      creatorId: userId,
    });

    res.status(201).json(space);
  } catch (error) {
    logger.error('Error creating space:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create space';
    res.status(500).json({ error: errorMessage });
  }
});

/**
 * POST /api/forum/spaces/:id/join
 * Join a space (requires auth)
 */
router.post('/spaces/:id/join', authMiddleware, async (req: Request, res: Response) => {
  try {
    const spaceId = req.params.id;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    await forumRepo.joinSpace(spaceId, userId);
    res.json({ message: 'Successfully joined space' });
  } catch (error) {
    logger.error('Error joining space:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to join space';
    res.status(500).json({ error: errorMessage });
  }
});

// ==================== POSTS ====================

/**
 * GET /api/forum/posts?page=1&limit=10
 * Get feed posts with pagination (requires auth to see user's spaces)
 */
router.get('/posts', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    // Validate pagination params
    if (page < 1 || limit < 1 || limit > 100) {
      return res.status(400).json({ error: 'Invalid pagination parameters' });
    }

    const [posts, total] = await Promise.all([
      forumRepo.getFeedPosts(userId, limit, offset),
      forumRepo.getFeedPostsCount(userId),
    ]);

    const hasMore = offset + limit < total;

    res.json({
      posts,
      total,
      page,
      limit,
      hasMore,
    });
  } catch (error: any) {
    logger.error('Error fetching posts:', error);
    logger.error('Error details:', error?.message, error?.code, error?.sqlMessage);
    res.status(500).json({ error: 'Failed to fetch posts', details: error?.message });
  }
});

/**
 * GET /api/forum/posts/:id
 * Get post by ID
 */
router.get('/posts/:id', optionalAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const post = await forumRepo.findPostById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.json(post);
  } catch (error) {
    logger.error('Error fetching post:', error);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

/**
 * POST /api/forum/posts
 * Create a new post (requires auth)
 */
router.post('/posts', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { spaceId, title, content, tags, imageUrls }: CreatePostRequest = req.body;

    if (!spaceId || !title || !content) {
      return res.status(400).json({ error: 'SpaceId, title, and content are required' });
    }

    // Check if user is member of the space
    const isMember = await forumRepo.isMemberOfSpace(spaceId, userId);
    if (!isMember) {
      return res.status(403).json({ error: 'You must be a member of this space to post' });
    }

    const post = await forumRepo.createPost({
      spaceId,
      authorId: userId,
      title,
      content,
      tags,
      imageUrls,
    });

    res.status(201).json(post);
  } catch (error) {
    logger.error('Error creating post:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create post';
    res.status(500).json({ error: errorMessage });
  }
});

/**
 * POST /api/forum/posts/:id/vote
 * Vote on a post (requires auth)
 */
router.post('/posts/:id/vote', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const postId = req.params.id;
    const { voteType }: VoteRequest = req.body;

    if (voteType !== null && voteType !== 1 && voteType !== -1) {
      return res.status(400).json({ error: 'Invalid voteType. Must be 1, -1, or null' });
    }

    await forumRepo.voteTarget(userId, postId, 'POST', voteType);
    res.json({ message: 'Vote recorded successfully' });
  } catch (error) {
    logger.error('Error voting on post:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to vote on post';
    res.status(500).json({ error: errorMessage });
  }
});

// ==================== COMMENTS ====================

/**
 * GET /api/forum/posts/:id/comments
 * Get comments for a post
 */
router.get('/posts/:id/comments', optionalAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const comments = await forumRepo.getPostComments(req.params.id);
    res.json(comments);
  } catch (error) {
    logger.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

/**
 * POST /api/forum/comments
 * Create a new comment (requires auth)
 */
router.post('/comments', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { postId, content, parentId }: CreateCommentRequest = req.body;

    if (!postId || !content) {
      return res.status(400).json({ error: 'PostId and content are required' });
    }

    // Verify post exists
    const post = await forumRepo.findPostById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // If parentId is provided, verify it exists
    if (parentId) {
      const parentComment = await forumRepo.findCommentById(parentId);
      if (!parentComment) {
        return res.status(404).json({ error: 'Parent comment not found' });
      }
      if (parentComment.postId !== postId) {
        return res.status(400).json({ error: 'Parent comment does not belong to this post' });
      }
    }

    const comment = await forumRepo.createComment({
      postId,
      authorId: userId,
      content,
      parentId,
    });

    res.status(201).json(comment);
  } catch (error) {
    logger.error('Error creating comment:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create comment';
    res.status(500).json({ error: errorMessage });
  }
});

/**
 * POST /api/forum/comments/:id/vote
 * Vote on a comment (requires auth)
 */
router.post('/comments/:id/vote', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const commentId = req.params.id;
    const { voteType }: VoteRequest = req.body;

    if (voteType !== null && voteType !== 1 && voteType !== -1) {
      return res.status(400).json({ error: 'Invalid voteType. Must be 1, -1, or null' });
    }

    await forumRepo.voteTarget(userId, commentId, 'COMMENT', voteType);
    res.json({ message: 'Vote recorded successfully' });
  } catch (error) {
    logger.error('Error voting on comment:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to vote on comment';
    res.status(500).json({ error: errorMessage });
  }
});

export default router;
