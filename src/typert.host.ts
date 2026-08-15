import { z } from 'zod'
import { MAX_COMMITS } from './domain.ts'
import { createGitGraphInvocation, TYPERT_PACKAGE } from './typert.shared.ts'

/** Host-only zod codecs required by dsh-typert-loader for RPC registration. */
const hostRefSchema = z.object({
  kind: z.enum(['head', 'remote', 'tag']),
  name: z.string(),
}).strict()

const hostCommitSchema = z.object({
  hash: z.string(),
  parents: z.array(z.string()),
  author: z.string(),
  email: z.string(),
  date: z.string(),
  subject: z.string(),
  refs: z.array(hostRefSchema),
  isHead: z.boolean(),
}).strict()

const hostInputSchema = z.object({
  path: z.string().optional(),
  maxCommits: z.number().int().min(1).max(MAX_COMMITS).optional(),
  all: z.boolean().optional(),
  firstParent: z.boolean().optional(),
}).strict()

const hostSnapshotSchema = z.object({
  path: z.string(),
  branch: z.string().nullable(),
  head: z.string().nullable(),
  workingTree: z.object({
    changed: z.boolean(),
    summary: z.string(),
  }).strict(),
  commits: z.array(hostCommitSchema),
}).strict()

export const gitGraphHostDescriptors = [createGitGraphInvocation({
  input: hostInputSchema,
  snapshot: hostSnapshotSchema,
  sessionId: z.string(),
})] as const

/** Host contract discovered automatically by dsh-typert-loader. */
export const TYPERT = {
  package: TYPERT_PACKAGE,
  face: 'host',
  schemas: [],
  invocations: gitGraphHostDescriptors,
  model: {
    services: [],
    events: [],
    objects: [],
  },
}

export default TYPERT
