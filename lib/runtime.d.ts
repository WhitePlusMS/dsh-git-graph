/** Host half of the DSH Git Graph plugin. */
import type { Context } from '@deepseek-ai/cordis';
export declare const GRAPH_OUTPUT_SCHEMA: {
    readonly type: "object";
    readonly additionalProperties: false;
    readonly properties: {
        readonly path: {
            readonly type: "string";
            readonly required: true;
        };
        readonly state: {
            readonly type: "string";
            readonly required: true;
            readonly enum: readonly ["not-git", "empty", "ready"];
        };
        readonly branch: {
            readonly oneOf: readonly [{
                readonly type: "string";
            }, {
                readonly type: "null";
            }];
            readonly required: true;
        };
        readonly head: {
            readonly oneOf: readonly [{
                readonly type: "string";
            }, {
                readonly type: "null";
            }];
            readonly required: true;
        };
        readonly remotes: {
            readonly type: "array";
            readonly required: true;
            readonly items: {
                readonly type: "string";
            };
        };
        readonly branches: {
            readonly type: "array";
            readonly required: true;
            readonly items: {
                readonly type: "object";
                readonly additionalProperties: false;
                readonly properties: {
                    readonly name: {
                        readonly type: "string";
                        readonly required: true;
                    };
                    readonly hash: {
                        readonly type: "string";
                        readonly required: true;
                    };
                    readonly kind: {
                        readonly type: "string";
                        readonly required: true;
                        readonly enum: readonly ["local", "remote"];
                    };
                    readonly isCurrent: {
                        readonly type: "boolean";
                        readonly required: true;
                    };
                };
            };
        };
        readonly workingTree: {
            readonly type: "object";
            readonly additionalProperties: false;
            readonly required: true;
            readonly properties: {
                readonly changed: {
                    readonly type: "boolean";
                    readonly required: true;
                };
                readonly summary: {
                    readonly type: "string";
                    readonly required: true;
                };
            };
        };
        readonly commits: {
            readonly type: "array";
            readonly required: true;
            readonly items: {
                readonly type: "object";
                readonly additionalProperties: false;
                readonly properties: {
                    readonly hash: {
                        readonly type: "string";
                        readonly required: true;
                    };
                    readonly parents: {
                        readonly type: "array";
                        readonly required: true;
                        readonly items: {
                            readonly type: "string";
                        };
                    };
                    readonly author: {
                        readonly type: "string";
                        readonly required: true;
                    };
                    readonly email: {
                        readonly type: "string";
                        readonly required: true;
                    };
                    readonly date: {
                        readonly type: "string";
                        readonly required: true;
                    };
                    readonly committerDate: {
                        readonly type: "string";
                        readonly required: true;
                    };
                    readonly subject: {
                        readonly type: "string";
                        readonly required: true;
                    };
                    readonly refs: {
                        readonly type: "array";
                        readonly required: true;
                        readonly items: {
                            readonly type: "object";
                            readonly additionalProperties: false;
                            readonly properties: {
                                readonly kind: {
                                    readonly type: "string";
                                    readonly required: true;
                                    readonly enum: readonly ["head", "remote", "tag"];
                                };
                                readonly name: {
                                    readonly type: "string";
                                    readonly required: true;
                                };
                            };
                        };
                    };
                    readonly isHead: {
                        readonly type: "boolean";
                        readonly required: true;
                    };
                };
            };
        };
        readonly hasMore: {
            readonly type: "boolean";
            readonly required: true;
        };
        readonly searchTruncated: {
            readonly type: "boolean";
            readonly required: true;
        };
    };
};
/** Register the single read-only Git graph tool. */
export declare function apply(ctx: Context): void;
