import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error(
    "Missing Supabase environment variables. Please define SUPABASE_URL and SUPABASE_KEY in .env.local"
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export interface GeoAbbreviation {
  _id: string;
  abbreviation: string;
  full_name: string;
  copied_count: number;
  created_at: string;
  updated_at: string;
}

export class GeoAbbreviationDB {
  private static readonly TABLE_NAME = "geo_abbreviations";

  // 根据简写搜索
  static async search(queries: string[]): Promise<GeoAbbreviation[]> {
    if (queries.length === 0) {
      return [];
    }

    const orConditions = queries.map(query => `abbreviation.ilike.%${query}%,full_name.ilike.%${query}%`).join(',');

    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .select("*")
      .or(orConditions)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error searching:", error);
      return [];
    }

    return data.map((item) => ({
      _id: item.id, // Supabase uses 'id' by default for primary key
      abbreviation: item.abbreviation,
      full_name: item.full_name,
      copied_count: item.copied_count,
      created_at: item.created_at,
      updated_at: item.updated_at,
    }));
  }

  // 获取所有记录
  static async getAll(): Promise<GeoAbbreviation[]> {
    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error getting all records:", error);
      return [];
    }

    return data.map((item) => ({
      _id: item.id,
      abbreviation: item.abbreviation,
      full_name: item.full_name,
      copied_count: item.copied_count,
      created_at: item.created_at,
      updated_at: item.updated_at,
    }));
  }

  // 添加新记录
  static async add(
    abbreviation: string,
    fullName: string
  ): Promise<GeoAbbreviation | null> {
    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .insert({ abbreviation: abbreviation.toUpperCase(), full_name: fullName })
      .select();

    if (error) {
      console.error("Error adding record:", error);
      return null;
    }
    if (!data || data.length === 0) {
      return null;
    }

    const newItem = data[0];
    return {
      _id: newItem.id,
      abbreviation: newItem.abbreviation,
      full_name: newItem.full_name,
      copied_count: newItem.copied_count,
      created_at: newItem.created_at,
      updated_at: newItem.updated_at,
    };
  }

  // 更新记录
  static async update(
    id: string,
    abbreviation: string,
    fullName: string
  ): Promise<GeoAbbreviation | null> {
    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .update({
        abbreviation: abbreviation.toUpperCase(),
        full_name: fullName,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select();

    if (error) {
      console.error("Error updating record:", error);
      return null;
    }
    if (!data || data.length === 0) {
      return null;
    }

    const updatedItem = data[0];
    return {
      _id: updatedItem.id,
      abbreviation: updatedItem.abbreviation,
      full_name: updatedItem.full_name,
      copied_count: updatedItem.copied_count,
      created_at: updatedItem.created_at,
      updated_at: updatedItem.updated_at,
    };
  }

  // 删除记录
  static async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from(this.TABLE_NAME)
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting record:", error);
      return false;
    }
    return true;
  }

  // 根据ID获取记录
  static async getById(id: string): Promise<GeoAbbreviation | null> {
    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error getting record by ID:", error);
      return null;
    }

    return {
      _id: data.id,
      abbreviation: data.abbreviation,
      full_name: data.full_name,
      copied_count: data.copied_count,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  }

  // 获取复制量最高的N条
  static async getMostCopied(limit: number): Promise<GeoAbbreviation[]> {
    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .select("*")
      .order("copied_count", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error getting most copied records:", error);
      return [];
    }

    return data.map((item) => ({
      _id: item.id,
      abbreviation: item.abbreviation,
      full_name: item.full_name,
      copied_count: item.copied_count,
      created_at: item.created_at,
      updated_at: item.updated_at,
    }));
  }

  static async incrementCopiedCount(id: string): Promise<void> {
    const { error } = await supabase.rpc("increment_copied_count", {
      row_id: id,
    });
    if (error) {
      console.error("Error incrementing copied count:", error);
    }
  }

  // 获取分页记录和总数
  static async getPaginated(
    page: number,
    pageSize: number,
    searchQuery?: string
  ): Promise<{ data: GeoAbbreviation[]; total: number }> {
    let query = supabase
      .from(this.TABLE_NAME)
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (searchQuery) {
      query = query.or(
        `abbreviation.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`
      );
    }

    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize - 1;

    const { data, error, count } = await query.range(startIndex, endIndex);

    if (error) {
      console.error("Error getting paginated records:", error);
      return { data: [], total: 0 };
    }

    return {
      data: data.map((item) => ({
        _id: item.id,
        abbreviation: item.abbreviation,
        full_name: item.full_name,
        copied_count: item.copied_count,
        created_at: item.created_at,
        updated_at: item.updated_at,
      })),
      total: count || 0,
    };
  }
}
