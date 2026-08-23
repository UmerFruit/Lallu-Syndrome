// src/services/articleDeletionService.ts

import { supabase } from '@/lib/supabase';
import { FunctionsHttpError } from '@supabase/supabase-js';

export async function deleteArticleById(articleId: string): Promise<void> {
  const { error } = await supabase.functions.invoke('delete-article', {
    body: { articleId },
  });

  if (error) {
    let message = 'Failed to delete article.';

    if (error instanceof FunctionsHttpError) {
      try {
        const body = await error.context.json();

        if (body?.error) {
          message = body.error;
        }
      } catch {
        // Keep default message.
      }
    }

    throw new Error(message);
  }
}