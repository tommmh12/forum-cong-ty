import { useState, useEffect, useCallback } from 'react';
import { get, post } from '../../../services/api';
import {
  ForumSpace,
  FeedPost,
  CreatePostRequest,
  CreateCommentRequest,
} from '../../../../shared/types/forum.types';

interface PaginatedPostsResponse {
  posts: FeedPost[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

interface UseForumResult {
  // Spaces
  spaces: ForumSpace[];
  spacesLoading: boolean;
  spacesError: string | null;
  refreshSpaces: () => void;

  // Posts
  posts: FeedPost[];
  postsLoading: boolean;
  postsError: string | null;
  page: number;
  hasMore: boolean;
  loadMorePosts: () => void;
  refreshPosts: () => void;
  createPost: (data: CreatePostRequest) => Promise<FeedPost>;

  // Comments
  createComment: (data: CreateCommentRequest) => Promise<void>;
}

/**
 * Main hook for forum functionality
 * Manages spaces, posts, and comments
 */
export function useForum(): UseForumResult {
  // Spaces state
  const [spaces, setSpaces] = useState<ForumSpace[]>([]);
  const [spacesLoading, setSpacesLoading] = useState(true);
  const [spacesError, setSpacesError] = useState<string | null>(null);

  // Posts state
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsError, setPostsError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Fetch spaces
  const fetchSpaces = useCallback(async () => {
    setSpacesLoading(true);
    setSpacesError(null);
    try {
      const data = await get<ForumSpace[]>('/forum/spaces');
      setSpaces(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch spaces';
      setSpacesError(errorMessage);
    } finally {
      setSpacesLoading(false);
    }
  }, []);

  // Fetch posts with pagination
  const fetchPosts = useCallback(async (pageNum: number, append: boolean = false) => {
    setPostsLoading(true);
    setPostsError(null);
    try {
      const response = await get<PaginatedPostsResponse>(
        `/forum/posts?page=${pageNum}&limit=10`
      );
      
      if (append) {
        setPosts(prev => [...prev, ...response.posts]);
      } else {
        setPosts(response.posts);
      }
      
      setPage(response.page);
      setHasMore(response.hasMore);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch posts';
      setPostsError(errorMessage);
    } finally {
      setPostsLoading(false);
    }
  }, []);

  // Load more posts
  const loadMorePosts = useCallback(() => {
    if (!postsLoading && hasMore) {
      fetchPosts(page + 1, true);
    }
  }, [page, hasMore, postsLoading, fetchPosts]);

  // Refresh posts (reload from page 1)
  const refreshPosts = useCallback(() => {
    setPage(1);
    fetchPosts(1, false);
  }, [fetchPosts]);

  // Create post
  const createPost = useCallback(async (data: CreatePostRequest): Promise<FeedPost> => {
    try {
      const newPost = await post<FeedPost>('/forum/posts', data);
      // Refresh posts to show the new post
      refreshPosts();
      return newPost;
    } catch (error) {
      throw error;
    }
  }, [refreshPosts]);

  // Create comment
  const createComment = useCallback(async (data: CreateCommentRequest): Promise<void> => {
    try {
      await post('/forum/comments', data);
      // Optionally refresh posts to update comment counts
      // refreshPosts();
    } catch (error) {
      throw error;
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchSpaces();
    fetchPosts(1, false);
  }, [fetchSpaces, fetchPosts]);

  return {
    // Spaces
    spaces,
    spacesLoading,
    spacesError,
    refreshSpaces: fetchSpaces,

    // Posts
    posts,
    postsLoading,
    postsError,
    page,
    hasMore,
    loadMorePosts,
    refreshPosts,
    createPost,

    // Comments
    createComment,
  };
}

