import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { FunctionsHttpError } from '@supabase/supabase-js';

const feedbackSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required.'),
  lastName: z.string().trim().min(1, 'Last name is required.'),
  email: z.union([
    z.literal(''),
    z.string().trim().pipe(z.email({ message: 'Please enter a valid email address.' })),
  ]),
  category: z.enum(['bug', 'feature']),
  message: z
    .string()
    .trim()
    .min(10, 'Please add a little more detail (min 10 characters).')
    .max(2000, 'Please keep it under 2000 characters.'),
  website: z.string().optional(), // honeypot
});

type FeedbackForm = z.infer<typeof feedbackSchema>;

type FeedbackModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function FeedbackModal({ open, onOpenChange }: Readonly<FeedbackModalProps>) {
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<FeedbackForm>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      category: 'bug',
      message: '',
      website: '',
    },
  });

  const onSubmit = async (data: FeedbackForm) => {
    setSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke('feedback-email', {
        body: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email || null,
          category: data.category,
          message: data.message,
          website: data.website || '',
        },
      });
      if (error) {
        let message = 'Failed to send feedback. Please try again.';
        if (error instanceof FunctionsHttpError) {
          try {
            const body = await error.context.json();
            if (body?.error) message = body.error;
          } catch {
            // keep default message
          }
        }
        throw new Error(message);
      }
      toast.success('Thanks! Your feedback has been sent.');
      reset();
      onOpenChange(false);
    } catch (err) {
      setError('root', {
        message: err instanceof Error ? err.message : 'Something went wrong.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(value) => { if (!submitting) onOpenChange(value); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm animate-fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border border-border bg-elevated p-6 shadow-xl">
          <Dialog.Title className="text-lg font-semibold text-text-primary">
            Send feedback
          </Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-text-secondary">
            Found a bug or have an idea? Let me know.
          </Dialog.Description>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4" noValidate>
            {errors.root && (
              <div className="rounded border border-accent/30 bg-accent/5 px-3.5 py-2.5 text-sm text-accent">
                {errors.root.message}
              </div>
            )}

            {/* Honeypot — humans never see or fill this */}
            <input
              type="text"
              aria-hidden="true"
              tabIndex={-1}
              autoComplete="off"
              className="absolute h-0 w-0 opacity-0"
              {...register('website')}
            />

            <div className="grid grid-cols-2 gap-3">
              <Input label="First name" placeholder="First" autoComplete="given-name" {...register('firstName')} error={errors.firstName?.message} />
              <Input label="Last name" placeholder="Last" autoComplete="family-name" {...register('lastName')} error={errors.lastName?.message} />
            </div>

            <Input
              label="Email (optional)"
              type="email"
              placeholder="So I can reply to you"
              autoComplete="email"
              {...register('email')}
              error={errors.email?.message}
            />

            <div>
              <label htmlFor="feedback-category" className="mb-1.5 block text-sm font-medium text-text-secondary">
                Category
              </label>
              <select
                id="feedback-category"
                {...register('category')}
                className="w-full rounded border border-border bg-surface px-3.5 py-2.5 text-sm text-text-primary transition-colors focus:border-accent focus:outline-none"
              >
                <option value="bug">Bug report</option>
                <option value="feature">Feature request</option>
              </select>
            </div>

            <Textarea
              label="What's up?"
              placeholder="Describe the bug or the idea..."
              rows={5}
              maxLength={2000}
              {...register('message')}
              error={errors.message?.message}
            />

            <Button type="submit" className="w-full" loading={submitting}>
              Send feedback
            </Button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
