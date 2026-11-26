// Reviewed excerpts from three real DeepTutor AgentLoop calls. The verified example is course-authored.
export const replay = {
  "question": "无权图中，如何用 BFS 找到经过边数最少的路径？",
  "personas": {
    "A": {
      "stage": "零基础",
      "strategy": "生活类比 + 小步跟练",
      "answer": "【生活类比】\n想象一栋楼，你住在第0层，想找到某住户。每层住户是“节点”，相邻住户之间有走廊（边）。你从第0层出发，先去第1层所有住户，再逐个访问第2层，这样走的步数最少。\n\n验证例子：城市A想拜访B、C，B与A相邻，C与B相邻，A→B→C是唯一路径。BFS会先访问B，再访问C，路径长度为2，符合最少边数要求。",
      "section": "存储与遍历"
    },
    "B": {
      "stage": "强化",
      "strategy": "辨析误区 + 对照验证",
      "answer": "BFS 逐层扩展，每层保证边数递增，因此首次到达目标点时，路径边数最少；DFS 会深入分支，可能走远路径才抵达目标，无法保证边数最短。两者在“边数最短”条件下的表现差异，源于访问顺序的不同。\n\n请问：在无权图中，若需找到从起点到终点的最少边路径，应选择 BFS 还是 DFS？（选项：A. BFS；B. DFS）",
      "section": "存储与遍历",
      "verified_example": "起点 A 为第 0 层。BFS 经 A→C→T 首次到达 T，走 2 条边，T 在第 2 层。若 DFS 优先走 B，可能先找到 A→B→D→T，走 3 条边。DFS 首次到达不保证最少边数。"
    },
    "C": {
      "stage": "冲刺",
      "strategy": "边界反例 + 限时迁移",
      "answer": "例如：A→B 权 4、A→C 权 1、C→B 权 2，BFS 会误判 A→B 为最短路径（权 4），而实际最小总权为 3（A→C→B）。\n\n【迁移题】（限时 5 分钟）\n已知 A→B 权 3，A→C 权 2，C→D 权 1，B→D 权 4。求 A 到 D 的最小总权值，并说明使用哪种算法。",
      "section": "存储与遍历"
    }
  },
  "model": "Qwen3-4B-Instruct-2507 · Q4_K_M",
  "engine": "DeepTutor AgentLoop"
};
