export function extractAtTags(text: string): string[] {
    const matches = text.match(/@\w+/g);
    return matches || [];
}

export async function urlToFile(url: string, filename: string): Promise<File> {
    const response = await fetch(url);
    const blob = await response.blob();
    return new File([blob], filename, { type: blob.type || 'image/jpeg' });
}