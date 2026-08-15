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
      inject: sessionId => ({
        read: async request => {
          await remoteReady
          const gitGraph = ctx.get('remote.gitGraph') as typeof ctx.remote.gitGraph
          return gitGraph.read(sessionId, request)
        },
      }),
  }, GitGraphView))
}
