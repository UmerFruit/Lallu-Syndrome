function randomSlugSuffix(length = 6): string {
    return Math.random().toString(36).substring(2, 2 + length).padEnd(length, '0'); // NOSONAR
}

export function slugify(text: string, appendRandomSuffix = true): string {
	const baseSlug = text
		.toString()
		.normalize('NFD') // Split accented characters into base character + diacritic
		.replace(/[\u0300-\u036f]/g, '') // Remove the diacritics
		.toLowerCase()
		.trim()
		.replace(/\s+/g, '-') // Replace spaces with hyphens
		.replace(/[^a-z0-9\s-]/g, '') // Remove remaining non-ASCII characters
		.replace(/-+/g, '-') // Replace multiple hyphens with a single hyphen
		.replace(/^-|-$/g, ''); // Remove leading/trailing hyphens

	if (!appendRandomSuffix) return baseSlug;

	const suffix = randomSlugSuffix();
	return baseSlug ? `${baseSlug}-${suffix}` : suffix;
}
