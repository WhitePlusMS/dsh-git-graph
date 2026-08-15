import type { GitGraphCommit } from '../domain.ts'

const NULL_VERTEX = -1

interface Point {
  readonly lane: number
  readonly row: number
}

interface Connection {
  readonly target: number
  readonly branch: number
}

interface VertexState {
  readonly id: number
  readonly commit: GitGraphCommit
  readonly parents: number[]
  readonly children: number[]
  readonly connections: Array<Connection | undefined>
  branch: number | undefined
  lane: number
  nextLane: number
  nextParent: number
}

interface BranchState {
  readonly colour: number
  readonly edges: GraphEdge[]
  end: number
}

export interface GraphEdge {
  readonly fromLane: number
  readonly toLane: number
  readonly row: number
  readonly colour: number
  readonly lockedFirst: boolean
}

export interface GraphNode {
  readonly commit: GitGraphCommit
  readonly lane: number
  readonly row: number
  readonly colour: number
}

export interface GraphLayout {
  readonly nodes: readonly GraphNode[]
  readonly edges: readonly GraphEdge[]
  readonly laneCount: number
}

function pointOf(vertex: VertexState): Point {
  return { lane: vertex.lane, row: vertex.id }
}

function nextPointOf(vertex: VertexState): Point {
  return { lane: vertex.nextLane, row: vertex.id }
}

function connectPoint(vertex: VertexState, target: number, branch: number): Point | undefined {
  for (let lane = 0; lane < vertex.connections.length; lane += 1) {
    const connection = vertex.connections[lane]
    if (connection?.target === target && connection.branch === branch) {
      return { lane, row: vertex.id }
    }
  }
  return undefined
}

function reservePoint(vertex: VertexState, lane: number, target: number, branch: number): void {
  if (lane !== vertex.nextLane) return
  vertex.nextLane += 1
  vertex.connections[lane] = { target, branch }
}

function addEdge(branch: BranchState, from: Point, to: Point, lockedFirst: boolean): void {
  branch.edges.push({
    fromLane: from.lane,
    toLane: to.lane,
    row: from.row,
    colour: branch.colour,
    lockedFirst,
  })
}

function availableColour(startAt: number, branchEnds: number[]): number {
  for (let colour = 0; colour < branchEnds.length; colour += 1) {
    const end = branchEnds[colour]
    if (end !== undefined && startAt > end) return colour
  }
  branchEnds.push(0)
  return branchEnds.length - 1
}

function determinePath(startAt: number, vertices: VertexState[], branches: BranchState[], branchEnds: number[]): void {
  let row = startAt
  let vertex = vertices[row]
  if (vertex === undefined) return

  let parent = vertex.parents[vertex.nextParent]
  let lastPoint = vertex.branch === undefined ? nextPointOf(vertex) : pointOf(vertex)

  // A merge can connect two branches that have already been laid out. Follow
  // the existing parent branch until its reserved connection point appears.
  if (
    parent !== undefined
    && parent !== NULL_VERTEX
    && vertex.parents.length > 1
    && vertex.branch !== undefined
    && vertices[parent]?.branch !== undefined
  ) {
    const parentBranch = vertices[parent]?.branch
    if (parentBranch === undefined) return
    const targetBranch = branches[parentBranch]
    if (targetBranch === undefined) return
    let foundParentPoint = false
    for (row = startAt + 1; row < vertices.length; row += 1) {
      const current = vertices[row]
      if (current === undefined) continue
      const connectedPoint = connectPoint(current, parent, parentBranch)
      const currentPoint = connectedPoint ?? nextPointOf(current)
      foundParentPoint = connectedPoint !== undefined
      addEdge(targetBranch, lastPoint, currentPoint, !foundParentPoint && current.id !== parent ? lastPoint.lane < currentPoint.lane : true)
      reservePoint(current, currentPoint.lane, parent, parentBranch)
      lastPoint = currentPoint
      if (foundParentPoint) {
        vertex.nextParent += 1
        break
      }
    }
    if (!foundParentPoint) vertex.nextParent += 1
    return
  }

  const branch: BranchState = {
    colour: availableColour(startAt, branchEnds),
    edges: [],
    end: row,
  }
  branches.push(branch)

  if (vertex.branch === undefined) {
    vertex.branch = branch.colour
    vertex.lane = lastPoint.lane
  }
  reservePoint(vertex, lastPoint.lane, vertex.id, branch.colour)

  for (row = startAt + 1; row < vertices.length; row += 1) {
    const current = vertices[row]
    if (current === undefined) continue
    const currentPoint = parent === current.id && current.branch !== undefined
      ? pointOf(current)
      : nextPointOf(current)
    addEdge(branch, lastPoint, currentPoint, lastPoint.lane < currentPoint.lane)
    reservePoint(current, currentPoint.lane, parent ?? NULL_VERTEX, branch.colour)
    lastPoint = currentPoint

    if (parent === current.id) {
      vertex.nextParent += 1
      const parentAlreadyOnBranch = current.branch !== undefined
      if (!parentAlreadyOnBranch) {
        current.branch = branch.colour
        current.lane = currentPoint.lane
      }
      vertex = current
      parent = vertex.parents[vertex.nextParent]
      if (parent === undefined || parentAlreadyOnBranch) break
    }
  }

  // A missing parent is represented by the end of the visible graph. Mark it
  // processed so the outer pass cannot try to lay out the same branch again.
  if (row === vertices.length && parent === NULL_VERTEX) vertex.nextParent += 1
  branch.end = row
  branchEnds[branch.colour] = row
}

function createVertices(commits: readonly GitGraphCommit[]): VertexState[] {
  const lookup = new Map<string, number>()
  commits.forEach((commit, index) => lookup.set(commit.hash, index))
  return commits.map((commit, id) => ({
    id,
    commit,
    parents: commit.parents.map(parent => lookup.get(parent) ?? NULL_VERTEX),
    children: [],
    connections: [],
    branch: undefined,
    lane: 0,
    nextLane: 0,
    nextParent: 0,
  }))
}

/**
 * Lay out commits using the same reserved-point strategy as VS Code Git
 * Graph: a branch owns a continuous path, while merge paths reuse the
 * already-reserved point of their target parent branch. This keeps unrelated
 * lanes from shifting diagonally on every following row.
 */
export function layoutGraph(commits: readonly GitGraphCommit[]): GraphLayout {
  const vertices = createVertices(commits)
  const branches: BranchState[] = []
  const branchEnds: number[] = []

  for (const vertex of vertices) {
    for (const parent of vertex.parents) {
      if (parent !== NULL_VERTEX) vertices[parent]?.children.push(vertex.id)
    }
  }

  let row = 0
  while (row < vertices.length) {
    const vertex = vertices[row]
    if (vertex !== undefined && (vertex.branch === undefined || vertex.nextParent < vertex.parents.length)) {
      determinePath(row, vertices, branches, branchEnds)
    } else {
      row += 1
    }
  }

  const nodes = vertices.map(vertex => ({
    commit: vertex.commit,
    lane: vertex.lane,
    row: vertex.id,
    colour: vertex.branch ?? 0,
  }))
  const edges = branches.flatMap(branch => branch.edges)
  const highestLane = Math.max(
    0,
    ...nodes.map(node => node.lane),
    ...edges.map(edge => Math.max(edge.fromLane, edge.toLane)),
  )
  return { nodes, edges, laneCount: highestLane + 1 }
}
