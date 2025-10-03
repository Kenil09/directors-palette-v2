import { SupabaseClient } from '@supabase/supabase-js';
import type {
  Database,
  ReferenceRow,
  ReferenceInsert,
  ReferenceUpdate,
  ReferenceFilters,
  RepositoryResult,
  RepositoryListResult,
} from '../types';
import { DatabaseErrorHandler } from '../error-handler';

export class ReferenceRepository {
  constructor(private client: SupabaseClient<Database>) { }

  async create(data: ReferenceInsert): Promise<RepositoryResult<ReferenceRow>> {
    try {
      const { data: reference, error } = await this.client
        .from('reference')
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
        data: reference,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: DatabaseErrorHandler.handle(error).message,
      };
    }
  }

  async get(filters: ReferenceFilters = {}): Promise<RepositoryListResult<ReferenceRow>> {
    try {
      let query = this.client.from('reference').select('*');

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (key === 'tags' && Array.isArray(value)) {
            query = query.overlaps('tags', value);
          } else if (Array.isArray(value)) {
            query = query.in(key, value);
          } else {
            query = query.eq(key, value);
          }
        }
      });

      const { data: references, error } = await query;

      if (error) {
        return {
          data: [],
          error: DatabaseErrorHandler.handle(error).message,
        };
      }

      return {
        data: references || [],
        error: null,
      };
    } catch (error) {
      return {
        data: [],
        error: DatabaseErrorHandler.handle(error).message,
      };
    }
  }

  async update(id: string, data: ReferenceUpdate): Promise<RepositoryResult<ReferenceRow>> {
    try {
      const { data: reference, error } = await this.client
        .from('reference')
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
        data: reference,
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
        .from('reference')
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