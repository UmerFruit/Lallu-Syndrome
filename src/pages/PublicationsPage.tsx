import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Plus, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageContainer } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
    createPublication,
    deletePublication,
    getMyPublications,
} from '@/services/publicationService';
import type { Publication } from '@/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Textarea } from '@/components/ui/Textarea';

const publicationSchema = z.object({
    name: z.string().min(1, 'Publication name is required.'),
    description: z.string().optional(),
});

type PublicationForm = z.infer<typeof publicationSchema>;


export function PublicationsPage() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const { register, handleSubmit, reset, formState: { errors: formErrors } } = useForm<PublicationForm>({
        resolver: zodResolver(publicationSchema),
    });

    const onFormSubmit = (data: PublicationForm) => {
        if (!user) return;
        createMutation.mutate(
            { name: data.name.trim(), description: data.description?.trim() || undefined },
            { onSuccess: () => reset() }
        );
    };

    const [publicationToDelete, setPublicationToDelete] = useState<Publication | null>(null);

    const { data: publications = [], isLoading: loading } = useQuery({
        queryKey: ['my-publications', user?.id],
        queryFn: () => getMyPublications(user!.id),
        enabled: Boolean(user),
    });

    const createMutation = useMutation({
        mutationFn: (input: { name: string; description?: string }) =>
            createPublication(user!.id, input),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-publications', user?.id] });
            toast.success('Publication created.');
        },
        onError: (error) => {
            console.error(error);
            toast.error('Failed to create publication.');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deletePublication,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-publications', user?.id] });
            toast.success('Publication deleted.');
            setPublicationToDelete(null);
        },
        onError: (error) => {
            console.error(error);
            toast.error('Cannot delete publication. It may still contain articles.');
            setPublicationToDelete(null);
        },
    });

    const handleDeleteClick = (publication: Publication) => {
        if (publication.isDefault) return;
        setPublicationToDelete(publication);
    };

    let publicationsContent;

    if (loading) {
        publicationsContent = (
            <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div
                        key={i}
                        className="h-16 animate-pulse rounded border border-border-subtle bg-surface"
                    />
                ))}
            </div>
        );
    } else if (publications.length === 0) {
        publicationsContent = (
            <p className="py-12 text-center text-text-muted">No publications yet.</p>
        );
    } else {
        publicationsContent = (
            <div className="space-y-2">
                {publications.map((publication) => (
                    <div
                        key={publication.id}
                        className="flex items-center gap-4 rounded border border-border-subtle bg-surface p-4"
                    >
                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <p className="truncate text-sm font-medium text-text-primary">
                                    {publication.name}
                                </p>
                                {publication.isDefault && (
                                    <Badge variant="accent">default</Badge>
                                )}
                            </div>
                            {publication.description && (
                                <p className="mt-1 truncate text-xs text-text-secondary">
                                    {publication.description}
                                </p>
                            )}
                        </div>
                        <Link
                            to={`/p/${publication.slug}`}
                            className="inline-flex items-center gap-1 text-xs text-text-muted transition-colors hover:text-text-primary"
                        >
                            View
                            <ExternalLink size={12} />
                        </Link>
                        {!publication.isDefault && (
                            <button
                                type="button"
                                onClick={() => handleDeleteClick(publication)}
                                className="rounded p-2 text-text-muted transition-colors hover:bg-elevated hover:text-accent"
                                aria-label={`Delete ${publication.name}`}
                            >
                                <Trash2 size={16} />
                            </button>
                        )}
                    </div>
                ))}
            </div>
        );
    }

    return (
        <PageContainer className="py-8 md:py-12">
            <div className="mb-8">
                <h1 className="font-serif text-3xl font-semibold tracking-tight text-text-primary">
                    Publications
                </h1>

                <p className="mt-1 text-sm text-text-secondary">
                    Organize your articles into separate blogs or publications.
                </p>
            </div>

            <div className="mb-10 rounded border border-border-subtle bg-surface p-5">
                <h2 className="mb-4 font-mono text-xs uppercase tracking-wider text-text-muted">
                    New publication
                </h2>

                <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
                    <Input label="Name" placeholder="My Tech Blog" {...register('name')} error={formErrors.name?.message} />
                    <div>
                        <label htmlFor="publication-description" className="mb-1.5 block text-sm font-medium text-text-secondary">Description</label>
                        <Textarea
                            id="publication-description"
                            label="Description"
                            placeholder="Optional description"
                            rows={3}
                            {...register('description')}
                        />
                    </div>
                    <Button type="submit" loading={createMutation.isPending}>
                        <Plus size={16} />
                        Create publication
                    </Button>
                </form>
            </div>

            {publicationsContent}

            <div className="mt-12">
                <Link
                    to="/dashboard"
                    className="inline-flex items-center gap-1.5 text-sm text-text-secondary transition-colors hover:text-text-primary"
                >
                    <ArrowLeft size={16} />
                    Back to dashboard
                </Link>
            </div>

            <ConfirmationModal
                isOpen={Boolean(publicationToDelete)}
                title="Delete Publication"
                message={`Are you sure you want to delete "${publicationToDelete?.name}"? This action cannot be undone.`}
                isLoading={deleteMutation.isPending}
                onConfirm={() => publicationToDelete && deleteMutation.mutate(publicationToDelete.id)}
                onClose={() => !deleteMutation.isPending && setPublicationToDelete(null)}
            />
        </PageContainer>
    );
}