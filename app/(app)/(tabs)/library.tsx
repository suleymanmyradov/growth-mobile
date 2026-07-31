import { LibraryScreen } from '@/features/library';

/**
 * Library tab route (thin wrapper).
 *
 * Phase F: renders the Library composition (Explore, Saved, Templates
 * segments, and search) which composes public surfaces from `features/articles`,
 * `features/saved`, `features/search`, and `features/templates` while those
 * domains keep separate feature ownership. This route file stays thin and
 * contains no business logic.
 */
export default function LibraryRoute() {
  return <LibraryScreen />;
}
