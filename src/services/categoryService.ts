import { supabase } from "@/lib/supabase"
import type { Category } from "@/types";
export async function getCategories(): Promise<Category[]> {
    const { data: results, error } = await supabase.from("categories").select("*")
    if (error) { throw error }

    return results;
}

export async function getCategoryBySlug(slug: string): Promise<Category> {
    const { data: results, error } = await supabase.from("categories").select("*").eq('slug', slug).single();
    if (error) { throw error }

    return results;
}

export async function getCategoryById(id: number): Promise<Category>{
    const { data: results, error } = await supabase.from("categories").select("*").eq('id', id).single();
    if (error) { throw error }
    return results;
}


