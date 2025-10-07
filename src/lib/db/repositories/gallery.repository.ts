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
import { DatabaseErrorHandler } from '../error-handler';

export class GalleryRepository {
  constructor(private client: SupabaseClient<Database>) { }

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

  async getPaginated(
    filters: GalleryFilters = {},
    options: {
      page: number;
      pageSize: number;
      orderBy?: string;
      ascending?: boolean;
    }
  ): Promise<RepositoryListResult<GalleryRow> & { total: number; totalPages: number }> {
    try {
      const { page, pageSize, orderBy = 'created_at', ascending = false } = options;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      // Build count query
      let countQuery = this.client.from('gallery').select('*', { count: 'exact', head: true });
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            countQuery = countQuery.in(key, value);
          } else {
            countQuery = countQuery.eq(key, value);
          }
        }
      });

      // Build data query
      let dataQuery = this.client.from('gallery').select('*');
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            dataQuery = dataQuery.in(key, value);
          } else {
            dataQuery = dataQuery.eq(key, value);
          }
        }
      });

      // Apply ordering and pagination
      dataQuery = dataQuery.order(orderBy, { ascending }).range(from, to);

      // Execute both queries
      const [{ count, error: countError }, { data: galleries, error: dataError }] = await Promise.all([
        countQuery,
        dataQuery,
      ]);

      if (countError || dataError) {
        return {
          data: [],
          error: DatabaseErrorHandler.handle(countError || dataError).message,
          total: 0,
          totalPages: 0,
        };
      }

      const total = count || 0;
      const totalPages = Math.ceil(total / pageSize);

      return {
        data: galleries || [],
        error: null,
        total,
        totalPages,
      };
    } catch (error) {
      return {
        data: [],
        error: DatabaseErrorHandler.handle(error).message,
        total: 0,
        totalPages: 0,
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

  async findByPredictionId(predictionId: string): Promise<RepositoryResult<GalleryRow>> {
    try {
      const { data: gallery, error } = await this.client
        .from('gallery')
        .select('*')
        .eq('prediction_id', predictionId)
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

  async updateByPredictionId(predictionId: string, data: GalleryUpdate): Promise<RepositoryResult<GalleryRow>> {
    try {
      const { data: gallery, error } = await this.client
        .from('gallery')
        .update(data)
        .eq('prediction_id', predictionId)
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
}