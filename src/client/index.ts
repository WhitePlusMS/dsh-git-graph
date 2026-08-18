/** Browser half: one independent Git Graph tab beside Chat and Trajectory. */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-api-gateway/client'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import { TYPERT_REMOTE } from '../typert.remote-client.ts'
import { GitGraphView } from './GitGraphView.tsx'
import { installGitGraphStyles } from './styles.ts'

export const inject = ['remote', 'slots']

export function apply(ctx: ClientContext): void {
  ctx.effect(installGitGraphStyles)
  const remoteReady = ctx.remote.$mount(TYPERT_REMOTE)
  ctx.effect(() => remoteReady, 'git-graph remote')
  ctx.slots.inject('conversation.view', () => ctx.slots.register({
    name: 'conversation.view',
    id: 'git-graph',
    order: 20,
    label: 'Git Graph',
    inject: sessionId => {
      const remote = async () => {
        await remoteReady
        return ctx.get('remote.gitGraph') as typeof ctx.remote.gitGraph
      }
      return {
        read: async request => (await remote()).read(sessionId, request),
        readCommit: async request => (await remote()).readCommit(sessionId, request),
        readFile: async request => (await remote()).readFile(sessionId, request),
        readFileDiff: async request => (await remote()).readFileDiff(sessionId, request),
        readWorkingTree: async () => (await remote()).readWorkingTree(sessionId, {}),
        readWorkingTreeFile: async request => (await remote()).readWorkingTreeFile(sessionId, request),
        compare: async request => (await remote()).compare(sessionId, request),
        metadata: async () => (await remote()).metadata(sessionId, {}),
      }
    },
  }, GitGraphView))
}
