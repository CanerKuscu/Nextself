// Minimal ambient module declaration so TypeScript in VS Code can resolve the remote Deno std import
// This avoids the "Cannot find module 'https://deno.land/std@...'/..." diagnostics in editors that aren't Deno-aware.

declare module 'https://deno.land/std@0.168.0/http/server.ts' {
    // Very small surface area - use `any` to avoid strict coupling to DOM/Fetch libs in the workspace
    export function serve(handler: (req: any) => Promise<any> | any): void;
}

declare module 'https://esm.sh/@supabase/supabase-js@2.39.3' {
    export function createClient(...args: any[]): any;
}

declare module 'https://esm.sh/@supabase/supabase-js@2' {
    export function createClient(...args: any[]): any;
}
