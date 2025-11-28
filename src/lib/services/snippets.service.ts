import type { SupabaseClient } from "@supabase/supabase-js";
import type { CreateSnippetDto, UpdateSnippetDto, SnippetResponseDto, SnippetLanguage } from "../../types";

/**
 * Snippets service
 * Handles all snippet-related business logic
 * RLS automatically filters by user_id
 */
export class SnippetsService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Create a new snippet
   * RLS automatically sets user_id from JWT
   */
  async create(dto: CreateSnippetDto): Promise<SnippetResponseDto> {
    const { data, error } = await this.supabase
      .from("snippets")
      .insert({
        title: dto.title,
        content: dto.content,
        language: dto.language,
        description: dto.description || null,
        tags: dto.tags || [],
      })
      .select()
      .single();

    if (error) {
      console.error("[SnippetsService] Create error:", error);
      throw this.mapError(error);
    }

    return data;
  }

  /**
   * Get all snippets for current user
   * Sorted by newest first
   */
  async getAll(): Promise<SnippetResponseDto[]> {
    const { data, error } = await this.supabase.from("snippets").select("*").order("created_at", { ascending: false });

    if (error) {
      console.error("[SnippetsService] GetAll error:", error);
      throw this.mapError(error);
    }

    return data || [];
  }

  /**
   * Get single snippet by ID
   * RLS ensures user can only access their own
   */
  async getById(id: string): Promise<SnippetResponseDto | null> {
    const { data, error } = await this.supabase.from("snippets").select("*").eq("id", id).single();

    if (error) {
      // 404 if not found or belongs to another user
      if (error.code === "PGRST116") {
        return null;
      }
      console.error("[SnippetsService] GetById error:", error);
      throw this.mapError(error);
    }

    return data;
  }

  /**
   * Update snippet
   * RLS ensures only owner can update
   */
  async update(id: string, dto: UpdateSnippetDto): Promise<SnippetResponseDto> {
    const { data, error } = await this.supabase
      .from("snippets")
      .update({
        ...dto,
        // updated_at set automatically by DB trigger
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[SnippetsService] Update error:", error);
      throw this.mapError(error);
    }

    return data;
  }

  /**
   * Delete snippet
   * RLS ensures only owner can delete
   */
  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.from("snippets").delete().eq("id", id);

    if (error) {
      console.error("[SnippetsService] Delete error:", error);
      throw this.mapError(error);
    }
  }

  /**
   * Search snippets by query
   * Full-text search in title and content
   */
  async search(query: string): Promise<SnippetResponseDto[]> {
    // Using textSearch for full-text search
    const { data, error } = await this.supabase
      .from("snippets")
      .select("*")
      .textSearch("title,content", query, {
        type: "websearch",
        config: "english",
      })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[SnippetsService] Search error:", error);
      throw this.mapError(error);
    }

    return data || [];
  }

  /**
   * Filter snippets by language
   */
  async filterByLanguage(language: SnippetLanguage): Promise<SnippetResponseDto[]> {
    const { data, error } = await this.supabase
      .from("snippets")
      .select("*")
      .eq("language", language)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[SnippetsService] FilterByLanguage error:", error);
      throw this.mapError(error);
    }

    return data || [];
  }

  /**
   * Combined search and filter
   */
  async searchAndFilter(query?: string, language?: SnippetLanguage): Promise<SnippetResponseDto[]> {
    let supabaseQuery = this.supabase.from("snippets").select("*");

    // Apply search if provided
    if (query && query.trim()) {
      supabaseQuery = supabaseQuery.textSearch("title,content", query, {
        type: "websearch",
        config: "english",
      });
    }

    // Apply language filter if provided
    if (language) {
      supabaseQuery = supabaseQuery.eq("language", language);
    }

    // Always sort by newest first
    supabaseQuery = supabaseQuery.order("created_at", { ascending: false });

    const { data, error } = await supabaseQuery;

    if (error) {
      console.error("[SnippetsService] SearchAndFilter error:", error);
      throw this.mapError(error);
    }

    return data || [];
  }

  /**
   * Map Supabase errors to user-friendly messages
   */
  private mapError(error: any): Error {
    const errorMessages: Record<string, string> = {
      "23505": "A snippet with this title already exists",
      "23514": "Invalid data. Please check your input.",
      "42501": "You don't have permission to perform this action",
      PGRST116: "Snippet not found",
    };

    const message = errorMessages[error.code] || error.message || "An error occurred. Please try again.";
    return new Error(message);
  }
}
