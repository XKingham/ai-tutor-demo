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
  "engine": "DeepTutor AgentLoop"
};

export const examReplay = {
  "engine": "DeepTutor AgentLoop",
  "question": "为什么 BFS 能找到无权图中边数最少的路径？",
  "personas": {
    "A": {
      "strategy": "反例辨析",
      "strategy_id": "contrast",
      "answer": "BFS 逐层扩展，每层保证边数递增，因此首次到达目标点时，路径边数最少；DFS 会深入分支，可能走更长路径才抵达目标，不保证最短。两者在无权图中，BFS 适合找最短路径，DFS 不保证。\n\n请问：在无权图中，若要找到从起点到终点的最少边数路径，应选择哪种遍历策略？  \nA. 深度优先搜索（DFS）  \nB. 广度优先搜索（BFS）  \nC. 两者均可  \nD. 两者均不可",
      "verified_example": "起点 A 为第 0 层。BFS 经 A→C→T 首次到达 T，走 2 条边，T 在第 2 层。若 DFS 优先走 B，可能先找到 A→B→D→T，走 3 条边。DFS 首次到达不保证最少边数。",
      "source": "存储与遍历"
    },
    "A-followup": {
      "strategy": "交互动画",
      "strategy_id": "animation",
      "answer": "BFS 能找到无权图中最短路径，因为它按层扩展，每层代表一条边的增量。  \n\n例如：从 A 出发，B 和 C 是第一层（1 条边），D 和 E 是第二层（2 条边），这样每层都比前一层多一条边，确保路径最短。  \n\n小练习：画出从起点 S 到终点 T 的无权图，用 BFS 方法标记每层节点，说明路径为何是边数最少的。",
      "verified_example": null,
      "source": "存储与遍历"
    },
    "B": {
      "strategy": "交互动画",
      "strategy_id": "animation",
      "answer": "BFS 可找到无权图中边数最少的路径，因为其按层扩展，每层代表一条边的增量。  \n\n例如：从 A 到 C，路径 A→B→C 边数为 2，若 A→D→E→C 边数为 3，则 BFS 会优先选择边数更少的路径。  \n\n小练习：画出一个 4 个点的无权图，从点 1 出发，用 BFS 找到到点 4 的最短边数路径，并标出每层节点。",
      "verified_example": null,
      "source": "存储与遍历"
    }
  }
};
