/**
 * Identifies the bundle that is actually running in the page.
 *
 * `scripts/build.mjs` replaces the placeholder below with the build timestamp
 * on every build. Without this, "which build am I looking at" has to be
 * inferred from behaviour, and a hot-swap that silently failed looks exactly
 * like a logic bug in freshly shipped code.
 */
declare const __GIT_GRAPH_BUILD_ID__: string | undefined

/** Timestamp of the build that produced this bundle, or `dev` when unbundled. */
export const BUILD_ID: string = typeof __GIT_GRAPH_BUILD_ID__ === 'string' ? __GIT_GRAPH_BUILD_ID__ : 'dev'

