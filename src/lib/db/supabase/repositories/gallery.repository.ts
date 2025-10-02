import { SupabaseClient } from '@supabase/supabase-js';
import type {
  Database,
  GalleryRow,
  GalleryInsert,
  GalleryUpdate,
  GalleryFilters,
  RepositoryResult,
  RepositoryListResult,
} from '../types';
import { DatabaseErrorHandler } from '../utils/error-handler';

export class GalleryRepository {
  constructor(private client: SupabaseClient<Database>) {}

  async create(data: GalleryInsert): Promise<RepositoryResult<GalleryRow>> {
    try {
      const { data: gallery, error } = await this.client
        .from('gallery')
        .insert(data)
        .select()
        .single();

      if (error) {
        return {
          data: null,
          error: DatabaseErrorHandler.handle(error).message,
        };
      }

      return {
        data: gallery,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: DatabaseErrorHandler.handle(error).message,
      };
    }
  }

  async get(filters: GalleryFilters = {}): Promise<RepositoryListResult<GalleryRow>> {
    try {
      let query = this.client.from('gallery').select('*');

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            query = query.in(key, value);
          } else {
            query = query.eq(key, value);
          }
        }
      });

      const { data: galleries, error } = await query;

      if (error) {
        return {
          data: [],
          error: DatabaseErrorHandler.handle(error).message,
        };
      }

      return {
        data: galleries || [],
        error: null,
      };
    } catch (error) {
      return {
        data: [],
        error: DatabaseErrorHandler.handle(error).message,
      };
    }
  }

  async update(id: string, data: GalleryUpdate): Promise<RepositoryResult<GalleryRow>> {
    try {
      const { data: gallery, error } = await this.client
        .from('gallery')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return {
          data: null,
          error: DatabaseErrorHandler.handle(error).message,
        };
      }

      return {
        data: gallery,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: DatabaseErrorHandler.handle(error).message,
      };
    }
  }

  async delete(id: string): Promise<RepositoryResult<boolean>> {
    try {
      const { error } = await this.client
        .from('gallery')
        .delete()
        .eq('id', id);

      if (error) {
        return {
          data: null,
          error: DatabaseErrorHandler.handle(error).message,
        };
      }

      return {
        data: true,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: DatabaseErrorHandler.handle(error).message,
      };
    }
  }
}