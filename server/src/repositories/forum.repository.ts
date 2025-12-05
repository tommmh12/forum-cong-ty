import { getPool } from '../config/database';
import { randomUUID } from 'crypto';
import { logger } from '../utils/logger';
import {
  ForumSpace,
  ForumSpaceMember,
  ForumPost,
  ForumVote,
  ForumComment,
  FeedPost,
  SpaceType,
  SpaceMemberRole,
  VoteTargetType,
  VoteType,
} from '../../../shared/types/forum.types';
import { updateUserKarma } from './user.repository';

// Row interfaces for database mapping
interface ForumSpaceRow {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  icon: string | null;
  type: SpaceType;
  creator_id: string;
  created_at: string;
  updated_at: string | null;
}

interface ForumPostRow {
  id: string;
  space_id: string;
  author_id: string;
  title: string;
  content: string;
  tags: string | null; // JSON string
  vote_score: number;
  created_at: string;
  updated_at: string | null;
}

interface ForumVoteRow {
  id: string;
  user_id: string;
  target_id: string;
  target_type: VoteTargetType;
  vote_type: VoteType;
  created_at: string;
}

interface ForumCommentRow {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  parent_id: string | null;
  vote_score: number;
  created_at: string;
  updated_at: string | null;
}

// Mapping functions
function mapRowToSpace(row: ForumSpaceRow): ForumSpace {
  return {
    id: row.id,
    name: row.name,
    displayName: row.display_name,
    description: row.description || undefined,
    icon: row.icon || undefined,
    type: row.type,
    creatorId: row.creator_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at || undefined,
  };
}

function mapRowToPost(row: ForumPostRow): ForumPost {
  let tags: string[] | undefined;
  let imageUrls: string[] | undefined;

  if (row.tags) {
    try {
      const parsed = JSON.parse(row.tags);
      // Support both old format (array) and new format (object with tags and imageUrls)
      if (Array.isArray(parsed)) {
        tags = parsed;
      } else if (typeof parsed === 'object') {
        tags = parsed.tags;
        imageUrls = parsed.imageUrls;
      }
    } catch (e) {
      logger.warn('Failed to parse tags JSON:', e);
    }
  }

  return {
    id: row.id,
    spaceId: row.space_id,
    authorId: row.author_id,
    title: row.title,
    content: row.content,
    tags,
    imageUrls,
    voteScore: row.vote_score,
    createdAt: row.created_at,
    updatedAt: row.updated_at || undefined,
  };
}

function mapRowToVote(row: ForumVoteRow): ForumVote {
  return {
    id: row.id,
    userId: row.user_id,
    targetId: row.target_id,
    targetType: row.target_type,
    voteType: row.vote_type,
    createdAt: row.created_at,
  };
}

function mapRowToComment(row: ForumCommentRow): ForumComment {
  return {
    id: row.id,
    postId: row.post_id,
    authorId: row.author_id,
    content: row.content,
    parentId: row.parent_id || undefined,
    voteScore: row.vote_score,
    createdAt: row.created_at,
    updatedAt: row.updated_at || undefined,
  };
}

// ==================== SPACES ====================

export async function findAllSpaces(): Promise<ForumSpace[]> {
  const rows = await getPool().execute<ForumSpaceRow[]>(
    'SELECT * FROM forum_spaces ORDER BY created_at DESC'
  );
  return (rows[0] as ForumSpaceRow[]).map(mapRowToSpace);
}

export async function findSpaceById(id: string): Promise<ForumSpace | null> {
  const rows = await getPool().execute<ForumSpaceRow[]>(
    'SELECT * FROM forum_spaces WHERE id = ?',
    [id]
  );
  if ((rows[0] as ForumSpaceRow[]).length === 0) return null;
  return mapRowToSpace((rows[0] as ForumSpaceRow[])[0]);
}

export async function createSpace(data: {
  name: string;
  displayName: string;
  description?: string;
  icon?: string;
  type?: SpaceType;
  creatorId: string;
}): Promise<ForumSpace> {
  const id = randomUUID();
  const pool = getPool();

  await pool.execute(
    `INSERT INTO forum_spaces (id, name, display_name, description, icon, type, creator_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.name,
      data.displayName,
      data.description || null,
      data.icon || null,
      data.type || 'PUBLIC',
      data.creatorId,
    ]
  );

  // Add creator as ADMIN member
  await joinSpace(id, data.creatorId, 'ADMIN');

  const space = await findSpaceById(id);
  if (!space) throw new Error('Failed to create space');
  return space;
}

// ==================== SPACE MEMBERS ====================

export async function joinSpace(
  spaceId: string,
  userId: string,
  role: SpaceMemberRole = 'MEMBER'
): Promise<void> {
  const pool = getPool();
  try {
    await pool.execute(
      `INSERT INTO forum_space_members (user_id, space_id, role)
       VALUES (?, ?, ?)`,
      [userId, spaceId, role]
    );
  } catch (error: any) {
    // If already a member, update role
    if (error.code === 'ER_DUP_ENTRY') {
      await pool.execute(
        'UPDATE forum_space_members SET role = ? WHERE user_id = ? AND space_id = ?',
        [role, userId, spaceId]
      );
    } else {
      throw error;
    }
  }
}

export async function isMemberOfSpace(spaceId: string, userId: string): Promise<boolean> {
  const rows = await getPool().execute<any[]>(
    'SELECT 1 FROM forum_space_members WHERE space_id = ? AND user_id = ?',
    [spaceId, userId]
  );
  return (rows[0] as any[]).length > 0;
}

export async function getUserJoinedSpaces(userId: string): Promise<ForumSpace[]> {
  const rows = await getPool().execute<ForumSpaceRow[]>(
    `SELECT s.* FROM forum_spaces s
     INNER JOIN forum_space_members sm ON s.id = sm.space_id
     WHERE sm.user_id = ?
     ORDER BY sm.joined_at DESC`,
    [userId]
  );
  return (rows[0] as ForumSpaceRow[]).map(mapRowToSpace);
}

// ==================== POSTS ====================

export async function createPost(data: {
  spaceId: string;
  authorId: string;
  title: string;
  content: string;
  tags?: string[];
  imageUrls?: string[];
}): Promise<ForumPost> {
  const id = randomUUID();
  const pool = getPool();

  // Store tags and imageUrls in tags JSON field
  // Format: { tags: [...], imageUrls: [...] }
  const tagsData: any = {};
  if (data.tags && data.tags.length > 0) {
    tagsData.tags = data.tags;
  }
  if (data.imageUrls && data.imageUrls.length > 0) {
    tagsData.imageUrls = data.imageUrls;
  }
  const tagsJson = Object.keys(tagsData).length > 0 ? JSON.stringify(tagsData) : null;

  await pool.execute(
    `INSERT INTO forum_posts (id, space_id, author_id, title, content, tags)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, data.spaceId, data.authorId, data.title, data.content, tagsJson]
  );

  const post = await findPostById(id);
  if (!post) throw new Error('Failed to create post');
  return post;
}

export async function findPostById(id: string): Promise<ForumPost | null> {
  const rows = await getPool().execute<ForumPostRow[]>(
    `SELECT 
      p.*,
      u.id as author_id, u.full_name as author_name, u.avatar_url as author_avatar,
      COALESCE(u.karma_points, 0) as author_karma,
      s.id as space_id, s.name as space_name, s.display_name as space_display_name, s.icon as space_icon
    FROM forum_posts p
    INNER JOIN users u ON p.author_id = u.id COLLATE utf8mb4_unicode_ci
    INNER JOIN forum_spaces s ON p.space_id = s.id
    WHERE p.id = ?`,
    [id]
  );
  if ((rows[0] as ForumPostRow[]).length === 0) return null;
  return mapRowToPost((rows[0] as ForumPostRow[])[0]);
}

// ==================== FEED ====================

export async function getFeedPosts(
  currentUserId: string,
  limit: number = 20,
  offset: number = 0
): Promise<FeedPost[]> {
  const pool = getPool();
  const rows = await pool.execute<any[]>(
    `SELECT 
      p.id, p.space_id, p.author_id, p.title, p.content, p.tags, 
      p.vote_score, p.created_at, p.updated_at,
      u.id as author_id, u.full_name as author_name, u.avatar_url as author_avatar, 
      COALESCE(u.karma_points, 0) as author_karma,
      s.id as space_id, s.name as space_name, s.display_name as space_display_name, s.icon as space_icon,
      v.vote_type as current_user_vote_status
    FROM forum_posts p
    INNER JOIN forum_space_members sm ON p.space_id = sm.space_id AND sm.user_id = ?
    INNER JOIN users u ON p.author_id = u.id COLLATE utf8mb4_unicode_ci
    INNER JOIN forum_spaces s ON p.space_id = s.id
    LEFT JOIN forum_votes v 
      ON p.id = v.target_id 
      AND v.user_id = ?
      AND v.target_type = 'POST'
    ORDER BY (
        (p.vote_score + 10) / 
        POW((TIMESTAMPDIFF(HOUR, p.created_at, NOW()) + 2), 1.8)
      ) DESC
    LIMIT ? OFFSET ?`,
    [currentUserId, currentUserId, limit, offset]
  );

  return (rows[0] as any[]).map((row: any) => {
    let tags: string[] | undefined;
    let imageUrls: string[] | undefined;

    if (row.tags) {
      try {
        const parsed = JSON.parse(row.tags);
        // Support both old format (array) and new format (object with tags and imageUrls)
        if (Array.isArray(parsed)) {
          tags = parsed;
        } else if (typeof parsed === 'object') {
          tags = parsed.tags;
          imageUrls = parsed.imageUrls;
        }
      } catch (e) {
        logger.warn('Failed to parse tags JSON:', e);
      }
    }

    return {
      id: row.id,
      spaceId: row.space_id,
      authorId: row.author_id,
      title: row.title,
      content: row.content,
      tags,
      imageUrls,
      voteScore: row.vote_score,
      createdAt: row.created_at,
      updatedAt: row.updated_at || undefined,
      author: {
        id: row.author_id,
        name: row.author_name,
        avatarUrl: row.author_avatar || '',
        karmaPoints: row.author_karma || 0,
      },
      space: {
        id: row.space_id,
        name: row.space_name,
        displayName: row.space_display_name,
        icon: row.space_icon || undefined,
      },
      currentUserVote: row.current_user_vote_status || null,
    };
  });
}

export async function getFeedPostsCount(currentUserId: string): Promise<number> {
  const pool = getPool();
  const rows = await pool.execute<any[]>(
    `SELECT COUNT(DISTINCT p.id) as total
     FROM forum_posts p
     INNER JOIN forum_space_members sm ON p.space_id = sm.space_id AND sm.user_id = ?`,
    [currentUserId]
  );
  return (rows[0] as any[])[0]?.total || 0;
}

// ==================== VOTES ====================

/**
 * Vote on a target (POST or COMMENT) with ACID transaction and row locking
 */
export async function voteTarget(
  userId: string,
  targetId: string,
  targetType: VoteTargetType,
  voteValue: VoteType | null
): Promise<void> {
  const pool = getPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Check existing vote with FOR UPDATE (row lock)
    const [existingVotes] = await connection.execute<ForumVoteRow[]>(
      `SELECT * FROM forum_votes 
       WHERE user_id = ? AND target_id = ? AND target_type = ? 
       FOR UPDATE`,
      [userId, targetId, targetType]
    );

    const existingVote = (existingVotes as ForumVoteRow[])[0];

    // 2. Get author_id with FOR UPDATE (row lock)
    let authorId: string | null = null;
    if (targetType === 'POST') {
      const [postRows] = await connection.execute<any[]>(
        'SELECT author_id FROM forum_posts WHERE id = ? FOR UPDATE',
        [targetId]
      );
      if ((postRows as any[]).length > 0) {
        authorId = (postRows as any[])[0].author_id;
      }
    } else if (targetType === 'COMMENT') {
      const [commentRows] = await connection.execute<any[]>(
        'SELECT author_id FROM forum_comments WHERE id = ? FOR UPDATE',
        [targetId]
      );
      if ((commentRows as any[]).length > 0) {
        authorId = (commentRows as any[])[0].author_id;
      }
    }

    if (!authorId) {
      throw new Error(`Target ${targetType} with id ${targetId} not found`);
    }

    // 3. Lock user row before updating karma
    await connection.execute(
      'SELECT id FROM users WHERE id = ? FOR UPDATE',
      [authorId]
    );

    // 4. Determine vote delta
    let voteDelta = 0;
    let karmaDelta = 0;

    if (!existingVote && voteValue !== null) {
      // New Vote
      const voteId = randomUUID();
      await connection.execute(
        `INSERT INTO forum_votes (id, user_id, target_id, target_type, vote_type)
         VALUES (?, ?, ?, ?, ?)`,
        [voteId, userId, targetId, targetType, voteValue]
      );
      voteDelta = voteValue;
      karmaDelta = voteValue;
    } else if (existingVote && voteValue === null) {
      // Toggle (Remove vote)
      await connection.execute(
        'DELETE FROM forum_votes WHERE id = ?',
        [existingVote.id]
      );
      voteDelta = -existingVote.vote_type;
      karmaDelta = -existingVote.vote_type;
    } else if (existingVote && voteValue !== null && existingVote.vote_type !== voteValue) {
      // Change (Flip vote)
      await connection.execute(
        'UPDATE forum_votes SET vote_type = ? WHERE id = ?',
        [voteValue, existingVote.id]
      );
      voteDelta = voteValue - existingVote.vote_type; // 2x delta
      karmaDelta = voteValue - existingVote.vote_type; // 2x delta
    }
    // If existing vote and same value, do nothing

    // 5. Update target vote_score
    if (voteDelta !== 0) {
      if (targetType === 'POST') {
        await connection.execute(
          'UPDATE forum_posts SET vote_score = vote_score + ? WHERE id = ?',
          [voteDelta, targetId]
        );
      } else if (targetType === 'COMMENT') {
        await connection.execute(
          'UPDATE forum_comments SET vote_score = vote_score + ? WHERE id = ?',
          [voteDelta, targetId]
        );
      }
    }

    // 6. Update author karma_points
    if (karmaDelta !== 0) {
      await connection.execute(
        'UPDATE users SET karma_points = karma_points + ? WHERE id = ?',
        [karmaDelta, authorId]
      );
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    logger.error('Error in voteTarget transaction:', error);
    throw error;
  } finally {
    connection.release();
  }
}

// ==================== COMMENTS ====================

export async function createComment(data: {
  postId: string;
  authorId: string;
  content: string;
  parentId?: string;
}): Promise<ForumComment> {
  const id = randomUUID();
  const pool = getPool();

  await pool.execute(
    `INSERT INTO forum_comments (id, post_id, author_id, content, parent_id)
     VALUES (?, ?, ?, ?, ?)`,
    [id, data.postId, data.authorId, data.content, data.parentId || null]
  );

  const comment = await findCommentById(id);
  if (!comment) throw new Error('Failed to create comment');
  return comment;
}

export async function findCommentById(id: string): Promise<ForumComment | null> {
  const rows = await getPool().execute<ForumCommentRow[]>(
    'SELECT * FROM forum_comments WHERE id = ?',
    [id]
  );
  if ((rows[0] as ForumCommentRow[]).length === 0) return null;
  return mapRowToComment((rows[0] as ForumCommentRow[])[0]);
}

export async function getPostComments(postId: string): Promise<ForumComment[]> {
  const rows = await getPool().execute<ForumCommentRow[]>(
    `SELECT 
      c.*,
      u.id as author_id, u.full_name as author_name, u.avatar_url as author_avatar,
      COALESCE(u.karma_points, 0) as author_karma
    FROM forum_comments c
    INNER JOIN users u ON c.author_id = u.id COLLATE utf8mb4_unicode_ci
    WHERE c.post_id = ?
    ORDER BY c.created_at ASC`,
    [postId]
  );
  return (rows[0] as ForumCommentRow[]).map(mapRowToComment);
}

export default {
  findAllSpaces,
  findSpaceById,
  createSpace,
  joinSpace,
  isMemberOfSpace,
  getUserJoinedSpaces,
  createPost,
  findPostById,
  getFeedPosts,
  getFeedPostsCount,
  voteTarget,
  createComment,
  findCommentById,
  getPostComments,
};

