import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Plus, Trash2 } from 'lucide-react';
import { PageContainer } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
    createPublication,
    deletePublication,
    getMyPublications,
} from '@/services/publicationService';
import type { Publication } from '@/types';

export function PublicationsPage() {
    const { user } = useAuth();
    const [publications, setPublications] = useState<Publication[]>([]);
    const [loading, setLoading] = useState(true);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [creating, setCreating] = useState(false);

    const load = useCallback(async () => {
        if (!user) return;

        try {
            const data = await getMyPublications(user.id);
            setPublications(data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load publications.');
        } finally {
            setLoading(false);
        }
    }, [user, toast]);

    useEffect(() => {
        load();
    }, [load]);

    const handleCreate = async (event: FormEvent) => {
        event.preventDefault();

        if (!user) return;

        const trimmedName = name.trim();

        if (!trimmedName) {
            toast.error('Publication name is required.');
            return;
        }

        setCreating(true);

        try {
            await createPublication(user.id, {
                name: trimmedName,
                description: description.trim() || undefined,
            });

            setName('');
            setDescription('');

            await load();

            toast.success('Publication created.');
        } catch (error) {
            console.error(error);
            toast.error('Failed to create publication.');
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (publication: Publication) => {
        if (publication.isDefault) return;

        if (!confirm(`Delete "${publication.name}"? This cannot be undone.`)) {
            return;
        }

        try {
            await deletePublication(publication.id);
            await load();
            toast.success('Publication deleted.');
        } catch (error) {
            console.error(error);
            toast.error('Cannot delete publication. It may still contain articles.');
        }
    };

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

                <form onSubmit={handleCreate} className="space-y-4">
                    <Input
                        label="Name"
                        placeholder="My Tech Blog"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />

                    <div>
                        <label
                            htmlFor="publication-description"
                            className="mb-1.5 block text-sm font-medium text-text-secondary"
                        >
                            Description
                        </label>

                        <textarea
                            id="publication-description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Optional description"
                            rows={3}
                            className="w-full resize-y rounded border border-border bg-surface px-3.5 py-2.5 text-base text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none sm:text-sm"
                        />
                    </div>

                    <Button type="submit" loading={creating}>
                        <Plus size={16} />
                        Create publication
                    </Button>
                </form>
            </div>

            {loading ? (
                <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div
                            key={i}
                            className="h-16 animate-pulse rounded border border-border-subtle bg-surface"
                        />
                    ))}
                </div>
            ) : publications.length === 0 ? (
                <p className="py-12 text-center text-text-muted">
                    No publications yet.
                </p>
            ) : (
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
                                    onClick={() => handleDelete(publication)}
                                    className="rounded p-2 text-text-muted transition-colors hover:bg-elevated hover:text-accent"
                                    aria-label={`Delete ${publication.name}`}
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <div className="mt-12">
                <Link
                    to="/dashboard"
                    className="inline-flex items-center gap-1.5 text-sm text-text-secondary transition-colors hover:text-text-primary"
                >
                    <ArrowLeft size={16} />
                    Back to dashboard
                </Link>
            </div>
        </PageContainer>
    );
}