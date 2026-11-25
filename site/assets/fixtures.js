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
];

export const prompts = [
  { question: "无权图的最短路径用什么算法？", lesson: 2,
    answer: "使用广度优先搜索（BFS）。它按距离起点的边数逐层访问顶点，因此第一次到达目标时经过的边数最少。" },
  { question: "为什么二分查找的时间复杂度是 O(log n)？", lesson: 3,
    answer: "每次与中间元素比较，候选区间约减半。经过 k 轮后剩余规模约为 n / 2ᵏ，缩到常数规模需要 O(log n) 轮。" },
];

export const exercises = [
  {
    title: "无权图的最少边数路径", text: "从一个起点出发，要求找到无权图中经过边数最少的路径，应优先使用哪种算法？",
    options: ["深度优先搜索", "广度优先搜索", "插入排序", "哈希查找"], correct: 1,
    explanation: "BFS 按离起点的边数逐层访问，第一次抵达目标时的深度就是最少边数。",
  },
  {
    title: "二分查找的区间更新", text: "在升序表中，查找目标比当前中间元素大时，下一步应保留哪个区间？",
    options: ["中点左侧", "包含中点的整个区间", "中点右侧", "只保留中点"], correct: 2,
    explanation: "升序表中，所有位于中点左侧的元素均不大于中间元素，可以连同中点一起排除。",
  },
];

export const roster = [
  { label: "示例学员甲", group: "408 示例班", attempts: 8, progress: 75 },
  { label: "示例学员乙", group: "408 示例班", attempts: 5, progress: 50 },
  { label: "示例学员丙", group: "408 示例班", attempts: 3, progress: 25 },
];
