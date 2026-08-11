/**
 * Readable message extraction for API errors.
 *
 * The API returns two different error shapes, and an endpoint switches from
 * one to the other the moment it gains Zod validation:
 *
 *   ad-hoc     { error: "Day name is required" }
 *   Zod        { message: "Validation failed",
 *                errors: [{ field: "name", message: "Day name is required" }] }
 *   plain      { message: "Invalid credentials" }
 *
 * Handlers that only read `data.error` silently fall back to a generic string
 * once an endpoint moves to Zod, hiding the field-level detail. Rather than
 * scattering `?? data.message` at every call site, resolve it once here.
 */

interface FieldIssue {
    field?: string;
    message?: string;
}

export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
    const data = (error as { response?: { data?: unknown } })?.response?.data as
        | { error?: unknown; message?: unknown; errors?: unknown }
        | undefined;

    if (data) {
        // Zod: prefer the field-level detail over the generic wrapper message
        if (Array.isArray(data.errors) && data.errors.length > 0) {
            const detail = (data.errors as FieldIssue[])
                .map((issue) => {
                    if (!issue?.message) return '';
                    return issue.field ? `${issue.field}: ${issue.message}` : issue.message;
                })
                .filter(Boolean)
                .join('; ');
            if (detail) return detail;
        }

        if (typeof data.error === 'string' && data.error) return data.error;
        if (typeof data.message === 'string' && data.message) return data.message;
    }

    // Network failure, or an Error thrown by the fetch-based services
    if (error instanceof Error && error.message) return error.message;

    return fallback;
}
