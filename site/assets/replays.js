// Reviewed excerpts from three real replay calls. Local account details and raw prompts are excluded.
export const replay = {
  "question": "无权图中，如何用 BFS 找到经过边数最少的路径？",
  "personas": {
    "A": {
      "stage": "零基础",
      "strategy": "生活类比 + 小步跟练",
      "answer": "【生活类比】\n想象一栋楼，从一楼开始，你只能一层一层往上走，每走一步都算一条边。你想知道从底层到某住户的最短路径，就必须逐层访问，不跳层、不绕路，这样走的步数最少。\n\n【三点例子】\nA→B→C：从A出发，先到B（第1层），再从B到C（第2层）。队列里先放A，A出队后，把B加入队列；B出队后，把C加入队列。每一步都“出队”后，立刻“进队”邻居，确保不漏、不重复，路径边数最少。",
      "section": "存储与遍历"
    },
    "B": {
      "stage": "强化",
      "strategy": "辨析误区 + 对照验证",
      "answer": "【误区对照】\nBFS 用于找最短路径，必须按层扩展，每层确保边数最少；DFS 会深入分支，可能先到非最短路径。\n\n【辨析题】\n若图中 A→B→D→T 和 A→C→T，BFS 先到 T，是否说明路径最短？为什么？",
      "section": "存储与遍历"
    },
    "C": {
      "stage": "冲刺",
      "strategy": "边界反例 + 限时迁移",
      "answer": "【边界反例】\n例如：A→C 权 1、C→B 权 2，A→B 实际最短权值为 3，BFS 误认为路径为 A→B 权 4，总权 4 > 3，错误。\n\n【迁移题】（限时 5 分钟）\n图中 A→B 权 3，A→C 权 2，C→B 权  1，求 A 到 B 的最小总权值。答案写在纸上，用 Dijkstra 方法逐步推导。",
      "section": "存储与遍历"
    }
  },
  "model": "Qwen3-4B-Instruct-2507 · Q4_K_M"
};
