// Original, fictional examples authored for the public walkthrough.
export const lessons = [
  {
    title: "复杂度与线性表", type: "示例讲义", location: "第 1 节",
    summary: "理解时间复杂度，以及顺序表和链表的访问、插入特点。",
    quote: "顺序表的元素连续存储，可以用下标直接定位。单链表按指针连接，在已知前驱结点时可以用常数次指针修改完成插入。",
  },
  {
    title: "树与二叉树", type: "示例讲义", location: "第 2 节",
    summary: "用一棵小树理解先序、中序和后序遍历。",
    quote: "先序遍历先访问根结点，再遍历左子树和右子树。中序遍历将访问根结点的动作放在两次子树遍历之间。",
  },
  {
    title: "图的存储与遍历", type: "示例讲义", location: "第 3 节",
    summary: "对比广度优先与深度优先搜索，以及二者适用的问题。",
    quote: "广度优先搜索使用队列，按与起点的边数逐层展开。在无权图中，第一次到达某个顶点时，已找到按边数计算的最短路径。",
  },
  {
    title: "查找与散列", type: "示例讲义", location: "第 4 节",
    summary: "理解有序性如何帮助二分查找排除候选区间。",
    quote: "在有序顺序表中，如果目标大于中间元素，就可以排除中间元素及其左侧区间。每轮候选区间约减半，最坏需要 O(log n) 次比较。",
  },
  {
    title: "带权最短路径", type: "公开示例讲义", location: "第 5 节",
    summary: "比较按边数分层和按已知最短距离选择下一结点的差别。",
    quote: "所有边权非负时，Dijkstra 每轮确定当前距离估计最小的未确定顶点。沿它的出边尝试松弛，若新路径估计更小，则更新终点的估计。",
  },
];

export const profiles = {
  A: { name: "学员 A", stage: "零基础", goal: "tree", minutes: 12, preference: "通俗类比" },
  B: { name: "学员 B", stage: "强化", goal: "traversal", minutes: 25, preference: "分步辨析" },
  C: { name: "学员 C", stage: "冲刺", goal: "shortest", minutes: 40, preference: "考点反例" },
};

export const concepts = {
  tree: { title: "二叉树遍历", time: 12, prerequisite: null, lesson: 1, remediation: "先标根结点，再检查访问时机。" },
  traversal: { title: "图的 BFS / DFS", time: 18, prerequisite: null, lesson: 2, remediation: "画出逐层入队的次序，再和 DFS 对照。" },
  shortest: { title: "带权最短路径", time: 22, prerequisite: "traversal", lesson: 4, remediation: "分别比较经过的边数和总权重，再做一次松弛。" },
};

export const assessment = [
  { id: "t1", topic: "tree", diagnostic: true, difficulty: 1, stem: "先序遍历二叉树时，先访问哪个结点？",
    choices: ["最左叶结点", "根结点", "最右叶结点"], key: 1, explanation: "先序遍历的次序是根、左、右。" },
  { id: "t2", topic: "tree", difficulty: 2, stem: "根 A 的左孩子为 B、右孩子为 C。中序序列是什么？",
    choices: ["B、A、C", "A、B、C", "B、C、A"], key: 0, explanation: "中序把根结点放在左右子树之间。" },
  { id: "t3", topic: "tree", difficulty: 3, stem: "根为 A，左孩子 B 有右孩子 D，A 的右孩子为 C。先序序列是什么？",
    choices: ["B、D、A、C", "D、B、C、A", "A、B、D、C"], key: 2, explanation: "先访问根 A，再完整访问左子树 B、D，最后访问 C。" },
  { id: "g1", topic: "traversal", diagnostic: true, difficulty: 1, stem: "无权图要找经过边数最少的路径，优先选哪种算法？",
    choices: ["DFS", "BFS", "归并排序"], key: 1, explanation: "BFS 逐层访问，首次抵达终点时经过的边数最少。" },
  { id: "g2", topic: "traversal", difficulty: 2, stem: "BFS 从结点 A 开始，先把 B 和 C 加入队列。处理 B 时发现 D，此时队列是什么？",
    choices: ["D、C", "B、D", "C、D"], key: 2, explanation: "B 出队后，C 仍在队首。新发现的 D 排到队尾。" },
  { id: "g3", topic: "traversal", difficulty: 3, stem: "s→a→c→t 和 s→b→t 的每条边等价。按 a 优先走的 DFS 首次找到 t 后，如何确认最少边数？",
    choices: ["做 BFS，第二层可经 b 到 t", "第一次找到的路径必然最短", "数 DFS 遍历过的所有点"], key: 0,
    explanation: "DFS 可先找到 3 边的路径。BFS 会在第 2 层发现 t。" },
  { id: "w1", topic: "shortest", diagnostic: true, difficulty: 2, stem: "A→B 权值 7，A→C 权值 2，C→B 权值 3。从 A 到 B 的最短距离是多少？",
    choices: ["7", "5", "3"], key: 1, explanation: "经 C 的代价为 2 + 3 = 5，小于直接走的 7。" },
  { id: "w2", topic: "shortest", difficulty: 3, stem: "Dijkstra 能确定当前最小估计距离的前提是什么？",
    choices: ["图没有环", "每条边双向", "所有可达边非负权"], key: 2, explanation: "非负边权使得继续走时距离不会下降。" },
  { id: "w3", topic: "shortest", difficulty: 3, stem: "已知 d(C)=3、d(B)=9，C→B 权值 4。用 C 松弛后 d(B) 是多少？",
    choices: ["7", "9", "4"], key: 0, explanation: "比较 9 与 3 + 4，更新为 7。" },
];
