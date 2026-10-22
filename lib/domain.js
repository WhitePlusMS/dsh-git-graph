/** Upper bound for persisted graph metadata in one tool result. */
export const MAX_COMMITS = 500;
/** Search resource budget, independent of the number of matches displayed. */
export const MAX_SEARCH_COMMITS = MAX_COMMITS * 4;
/** Upper bound on exact branch names accepted in one query. */
export const MAX_BRANCH_FILTER = 64;
/** Avatar reads are bound to actual commit authors in the current workspace. */
export const MAX_AVATAR_BATCH = 24;
