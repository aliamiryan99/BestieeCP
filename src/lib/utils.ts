/**
 * Sanitizes error messages from the backend (specifically Convex server errors)
 * to prevent technical implementation details from being shown to the user.
 */
export function sanitizeError(error: any): string {
    if (!error) return "مشکلی پیش آمد. لطفا دوباره تلاش کنید.";
    
    let message = typeof error === 'string' ? error : error.message || "مشکلی پیش آمد.";

    // Remove the "Uncaught Error: " prefix often added by Convex
    message = message.replace(/^Uncaught Error:\s*/, "");
    
    // If it's a "Server Error" with metadata, try to extract the base message
    // Usually it looks like: "Server Error Uncaught Error [ID] [Metadata] Actual Message"
    // Or sometimes "Actual Message: Server Error ..."
    if (message.includes("Server Error")) {
        // Look for the part before or after technical markers
        const parts = message.split(/:\s*Server Error|Server Error\s*/);
        if (parts[0] && parts[0].trim() && !parts[0].includes("Error [")) {
            return parts[0].trim();
        }
        
        // Fallback for technical errors that don't match our friendly strings
        return "خطایی در سیستم رخ داد. لطفا بعدا تلاش کنید.";
    }

    return message;
}
