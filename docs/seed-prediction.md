# Impossible：已知种子能否预测结局

可以。这份构建使用完全在客户端可复现的伪随机数流程；已知输入后，只需要正向重放，不需要破解或统计猜测。不同结算选择产生不同分支，所以应预测“每个选择下的结果”，而不是把事件理解成只有一个最终结果。

## 能预测什么、还缺什么

| 目标 | 必需输入 |
| --- | --- |
| 从第几次开始会失败、之前有多少次成功 | seed；预测当前之后的结果还需 `chain.flips.length` |
| 最终等级 | 上项 + 初始等级或事件概率；若主动停止，还需停止位置 |
| 四种小游戏每一步的 Mega | seed + 初始等级 + 小游戏；已有进度需当前 chain，尤其 bonus、board |
| 硬币正反、Deal 具体牌面、Plinko 具体路径 | 上项 + 每局猜测；猜测不影响本构建的成功与否及数值收益 |
| 新事件的抽卡 ID，最终等级 0～7 | seed + 小游戏 + 最终等级 |
| ≥8 级抽卡 ID | seed + 最终等级 + 打开奖励时的持有卡牌状态 |
| 是否重复、发几个 token | 上项 + 持有卡牌状态 |
| 转盘币种 | seed + 当时可用扇区 + 本次删除扇区；顺序按游戏固定顺序 |
| 能否实际执行该转盘 | 上项 + 已解锁转盘 + 足够的 token；可用模式还须满足动作数条件 |

事件来源 `source` 影响不转盘时领取哪种 Mega，但不参与胜负随机流。仅有 seed 时，不能无条件给出完整卡牌和轮盘结果；缺失状态必须明确保留为条件。

## 1. 存档 seed 实际只有 32 位随机状态

现代事件保存的 seed 看起来是一个很大的整数，编码形式为：

```text
storedSeed = 2^48 + rawSeed * 2^16 + checksum16(rawSeed)
```

其中 rawSeed 是 uint32，尾部是 16 位校验值。编码有效时可恢复：

```js
rawSeed = Math.floor((storedSeed - 2 ** 48) / 2 ** 16) >>> 0;
```

不要直接对整个 storedSeed 使用 `>>> 0` 作为 rawSeed，那样会把编码的低位误当作随机状态。预测脚本自动识别有效编码，也接受显式给出的原始 uint32。

对于旧事件，游戏的 `readEventSeed` 还兼容旧 uint32 或从旧事件 ID 生成种子。现代 seedVersion=1 的事件若 seed 无效，游戏会拒绝解析，而不是随便重抽；脚本传入完整 event 时遵守这条规则。

## 2. 胜负序列只依赖 seed 和步数

原始派生为：

```js
outcomeRng = seededRandom(seed, i, 0);
won = outcomeRng() < 0.5;
```

i 从 0 开始，使用 `chain.flips.length`，不是等级，也不是事件的 actionNumber。每一步重新派生 RNG，然后取第一次输出。

这里没有小游戏 ID、猜测、事件概率、当前 Mega、时间、已有卡牌。因此：

- 四种小游戏从同一 seed 开始，成功/失败序列一致。
- 改猜正反面/红黑不改变成功与否。
- 初始等级只影响最终等级，不影响自然连胜长度。
- 动画速度、等待多久、刷新恢复，不改变对应步骤的结果。
- 一旦第一次失败就结束，所以自然结局取第一次 `<0.5` 不成立的位置；后续数学上存在的随机数不会在该 chain 中继续使用。

初始等级为 L0，前 K 步成功，第 K+1 步失败，则自然最终等级是 L0+K；可以在此前任何成功后的状态主动停下。

## 3. 各小游戏的细节也全部可重放

原始主包的 `yB` 操作顺序是：

1. 按 seed、步数决定成功/失败，并执行成功升级。
2. 按 seed、步数、小游戏 ID 派生结果随机流。
3. 生成符合预定结果的路径/牌面/老虎机盘面。
4. 计算附加 bonus，执行限幅并累计。
5. 未失败时，按独立随机流生成下一块棋盘。

预测脚本逐项复用了已提取的原函数，并按这个顺序连接，因此能给出每一步：升降情况、Mega、bonus、Plinko 桶和路径、Deal 所有牌、Slots 九格图案与效果。

如果猜测相反，硬币 face 会相反；Deal 颜色会反转但差值绝对值不变；Plinko 路径会镜像而桶值左右对称。因此对本构建的标准生成棋盘，改变猜测也不改变数值收益。Slots 无须猜测。

已有进度时，应提供完整 event。不能只用 seed 和当前等级当作一条新 chain：步数、累积 bonus 和已经显示的 board 都可能不同，旧存档保留的 board 尤其应以现存数据为准。

## 4. 抽卡是固定随机数映射到当时的卡池

卡牌随机流固定为：

```js
cardRng = seededRandom(seed, 51837, 1067064189);
```

每次真正打开奖励，重新从该随机流开头取值，不会接着小游戏的随机数流往后取。

0～7 级先取 u1：若 u1<0.05，得到该小游戏、该档位的 Shiny；否则取 u2，以 `floor(u2*11)` 选普通卡目标模式。因此同一 seed 在普通等级中：

- 是否为 deck Shiny 固定，不因多赢几局改变。
- 普通卡目标模式固定。
- 停止等级改变档位，小游戏改变卡组。例如同一 seed 停在 5、6、7 级属于同档，得到同一 ID。

≥8 级改为按持有卡牌选择高等级/回退池，再用 u1 选 `pool[floor(u1*pool.length)]`。因此：

- 同一最终等级、同一收藏快照下，四种小游戏得到相同高等级 Shiny。
- ≥10 级使用同一组等级规则；若收藏不变，同一 seed 停在 10、11、12……级会得到相同卡牌。
- 在打开这个事件的卡牌前，先完成别的事件、改变收藏，可能触发不同的池子回退，从而改变本事件抽卡结果。
- 卡池内有新卡不等于一定抽到新卡。
- 已经存在 `chain.card` 时，不应重新预测抽卡，直接读取已确定的 ID。

## 5. 转盘也是固定分位点

转盘随机流：

```js
wheelRng = seededRandom(seed, 16097, 2135567385);
u = wheelRng();
result = remaining[Math.floor(u * remaining.length)];
```

remaining 是已达资格的扇区删除本次选择后的有序数组。游戏顺序固定为：

```text
coin, dice, card, d20, roulette, lottery,
dart, rocket, element, animal, plant
```

同一 seed 的 u 不因小游戏、最终等级或 Mega 改变；同样的剩余扇区便会得到同一币种。删除扇区会改变数组长度/位置映射，因此结果可能改变。已知 seed 后可以枚举预算内的删除组合，精确计算每种组合落在哪里；是否能选到某个目标仍受候选扇区和 token 预算约束。

如果事件已经转过，直接读取 `spunSegment/payoutSource`；脚本会返回 `already_spun`，不再生成第二次结果。

## 6. 已运行的构造示例

此例是演示输入，不是从你的真实存档读取：

```text
storedSeed = 281474978986060
rawSeed = 34
初始等级 = 5
收藏 = 空
转盘 = 已解锁，全部 11 个模式已满足资格，不删除扇区
```

胜负序列为 `WWWWWWL`：连胜六次，第七次失败。

| 游戏 | 自然最终等级 | 自然最终 Mega | 不再进行第七局、主动停止的 Mega |
| --- | --- | --- | --- |
| Coin | 11 | 860 | 860 |
| The Deal | 11 | 869 | 870 |
| Plinko | 11 | 857 | 857 |
| Slots | 11 | 680 | 680 |

在这个空收藏示例里，最终四种游戏都会抽到 `unique:5:global`，即 Stackjelly。如果改为六张 Unique 全持有、最高档 deck Shiny 未收齐，则同一个 seed、同一个 11 级会回退到 10 张卡的池，得到重复的 Chromavyrm，并发四个 token。

转盘 u 为 `0.47672108514234424`：

| 删除组合 | 对应币种 | token 成本 |
| --- | --- | --- |
| 不删除 | lottery | 0 |
| 删除 coin、dice | dart | 2 |
| 删除 lottery | roulette | 1 |

后两行是满足 token 预算时的条件结果；示例配置 token=0 且卡牌为新卡，不能直接执行需花 token 的组合。

## 7. 使用预测脚本

预测器位于 `src/core/predict-event.cjs`，构造输入位于 `examples/event.json`。在项目根目录运行，生成输出到被 Git 忽略的 `artifacts/`：

```powershell
npm run predict -- examples/event.json artifacts/prediction-example-result.json
```

新的预测输入可用：

```json
{
  "seed": 281474978986060,
  "startLevel": 5,
  "source": "coin",
  "heldCards": {},
  "availableSources": ["coin", "dice", "card"],
  "removedSources": [],
  "wheelUnlocked": true,
  "spinCurrency": 0
}
```

`startLevel` 也可换成 `probabilityPercent`，使用游戏数据里的百分数数值。`heldCards: {}` 明确表示空收藏；**不知道收藏时应省略 heldCards，不能把未知状态写成空集合**。缺少收藏时，低等级返回确定卡 ID，但不声称新卡/重复；高等级列出各可能回退池的候选结果。缺少可用扇区时，返回转盘随机数，标明尚需 availableSources。

若有完整事件，可改用：

```json
{
  "event": {"id": "这里放完整事件对象", "seed": 281474978986060, "seedVersion": 1},
  "heldCards": {},
  "availableSources": ["coin", "dice", "card"]
}
```

这只是形状示意，event 应替换为实际完整数据，包含 probability 和已有 chain（如有）。不要同时提供 startLevel。已有 chain 只预测它实际选定的小游戏；新事件则比较四种分支，不自动假设四种游戏都已经解锁。

输出包括每种游戏的逐局结果、每个可停止点的卡牌与 Mega、自然失败结局，以及按 Mega 最大值选出的停止点。不同停止点是互斥的假设分支，使用同一收藏快照，不会把各分支的卡牌累计计入。默认猜测全为 true；需要具体相反牌面/路径时可提供从第 0 步起的布尔数组 `calls`。

默认最多模拟未来 256 局，若仍未失败则 `complete=false`，不会假称已找到自然结局。转盘预测的可执行性仍以实际解锁、资格、余额为准；脚本不读取或改写游戏存档。

## 8. 验证范围

`tests/integration/prediction.test.cjs` 从原始 index 文件中定位、读取并执行未经改写的 `yB` 回调，只替换外部状态容器以捕获结果。对 200 个 seed、四种游戏，共 1,604 个回合逐项比较了 chain 状态、bonus、具体牌面/路径/盘面，与预测器完全一致。另验证相反猜测不改变收益、未知输入不冒充确定结果、以及从已有 chain 快照继续预测。

```powershell
node tests/integration/prediction.test.cjs
```

结论适用于当前提供的 `index-kVDE62Ka.js` 构建。没有对真实浏览器存档做实测；换版本或外部状态在开奖前发生变化时，应重新取状态并验证规则。
