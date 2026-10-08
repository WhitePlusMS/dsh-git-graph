/** Browser half: a session-bound Git Graph page in the native right sidebar. */
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-api-gateway/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar-right/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-session/client'
import { TYPERT_REMOTE } from '../typert.remote-client.ts'
import { GitGraphView, type GitGraphViewInjected } from './GitGraphView.tsx'
import { installGitGraphStyles } from './styles.ts'
import { en, NS, zh } from './locales.ts'

export const inject = ['remote', 'slots', 'locale', 'sidebarRightTabs']

export function apply(ctx: Context): void {
  ctx.effect(installGitGraphStyles)
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'git-graph dictionaries')
  const t = ctx.locale.bind(NS)
  const remoteReady = ctx.remote.$mount(TYPERT_REMOTE)
  ctx.effect(() => remoteReady, 'git-graph remote')
  ctx.effect(() => ctx.sidebarRightTabs.register({
    id: 'dsh-git-graph',
    kind: 'git-graph',
    title: () => t('view.title'),
    guide: [{ id: 'git-graph', order: 20, title: () => t('view.title'), description: () => t('guide.description') }],
  }), 'git-graph tab type')
  ctx.effect(() => ctx.slots.inject('sidebar.right.pane.tab', () => ctx.slots.register({
    name: 'sidebar.right.pane.tab',
    key: 'dsh-git-graph',
    locale: NS,
    inject: (sessionId): GitGraphViewInjected => {
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
  }, GitGraphView)), 'git-graph tab body')
  console.info('[git-graph] Native sidebar registered')
}
