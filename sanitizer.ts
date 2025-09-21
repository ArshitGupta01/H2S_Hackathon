/**
 * A simple utility to sanitize strings by removing HTML tags.
 * This helps prevent XSS vulnerabilities when rendering content from external sources.
 * @param str The input string to sanitize.
 * @returns The sanitized string with HTML tags removed.
 */
export const sanitizeHTML = (str: string | undefined | null): string => {
    if (!str) return '';
    // This regex replaces any character between < and > with an empty string.
    return str.replace(/<[^>]*>?/gm, '');
};
