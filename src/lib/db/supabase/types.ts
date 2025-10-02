export type { Database, Tables, TablesInsert, TablesUpdate } from '../../../../supabase/database.types';

export type GalleryRow = Tables<'gallery'>;
export type ReferenceRow = Tables<'reference'>;
export type GalleryInsert = TablesInsert<'gallery'>;
export type GalleryUpdate = TablesUpdate<'gallery'>;
export type ReferenceInsert = TablesInsert<'reference'>;
export type ReferenceUpdate = TablesUpdate<'reference'>;

export interface RepositoryResult<T> {
  data: T | null;
  error: string | null;
}

export interface RepositoryListResult<T> {
  data: T[];
  error: string | null;
}

export type GalleryFilters = Partial<GalleryRow>;
export type ReferenceFilters = Partial<ReferenceRow>;