/**
 * Articles API — list, featured, detail, author, like, share.
 *
 * List/featured/detail/author are public gateway endpoints (no auth required,
 * but the authenticated client is used so `isSaved`/`isLiked` reflect the
 * signed-in user when present). Like/share require auth.
 */
import { apiRequest } from '@/core/api/client';
import { articleEndpoints } from '@/core/api/endpoints';
import {
  ArticleResponseSchema,
  ArticlesResponseSchema,
  LikeArticleResponseSchema,
  ShareArticleResponseSchema,
  type Article,
  type ArticleResponse,
  type ArticlesResponse,
  type LikeArticleResponse,
  type ShareArticleResponse,
} from '@/core/api/schemas';

export type {
  Article,
  ArticleResponse,
  ArticlesResponse,
  LikeArticleResponse,
  ShareArticleResponse,
};

export async function listArticles(params?: {
  categorySlug?: string;
  page?: number;
  limit?: number;
}): Promise<ArticlesResponse> {
  const response = await apiRequest<unknown>({
    method: 'GET',
    url: articleEndpoints.list,
    params: { page: 1, limit: 20, ...params },
  });
  return ArticlesResponseSchema.parse(response);
}

export async function getFeaturedArticle(): Promise<ArticleResponse> {
  const response = await apiRequest<unknown>({
    method: 'GET',
    url: articleEndpoints.featured,
  });
  return ArticleResponseSchema.parse(response);
}

export async function getArticle(id: string): Promise<ArticleResponse> {
  const response = await apiRequest<unknown>({
    method: 'GET',
    url: articleEndpoints.detail(encodeURIComponent(id)),
  });
  return ArticleResponseSchema.parse(response);
}

export async function getAuthorArticles(
  authorId: string,
  params?: { page?: number; limit?: number },
): Promise<ArticlesResponse> {
  const response = await apiRequest<unknown>({
    method: 'GET',
    url: articleEndpoints.author(encodeURIComponent(authorId)),
    params: { page: 1, limit: 20, ...params },
  });
  return ArticlesResponseSchema.parse(response);
}

export async function likeArticle(id: string): Promise<LikeArticleResponse> {
  const response = await apiRequest<unknown>({
    method: 'POST',
    url: articleEndpoints.like(encodeURIComponent(id)),
  });
  return LikeArticleResponseSchema.parse(response);
}

export async function shareArticle(id: string, platform: string): Promise<ShareArticleResponse> {
  const response = await apiRequest<unknown>({
    method: 'POST',
    url: articleEndpoints.share(encodeURIComponent(id)),
    data: { platform },
  });
  return ShareArticleResponseSchema.parse(response);
}
