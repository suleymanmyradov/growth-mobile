import { ArticleReader } from '@/features/articles';
import { useLocalSearchParams } from 'expo-router';

/**
 * Article detail stack route (pushed content screen).
 *
 * Phase F: renders the ArticleReader (markdown style map, reading progress,
 * save, share, reader size, scroll restoration). The `id` is validated as a
 * UUID by the deep-link layer before routing; this wrapper stays thin and
 * contains no business logic.
 */
export default function ArticleRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ArticleReader id={id} />;
}
