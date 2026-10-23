# Game of Chance · Impossible Predictor

通过事件 seed 重放 Impossible 规则的本地预测器，以及对应的油猴悬浮面板。

**安装脚本：[dist/goc-impossible-predictor.user.js](dist/goc-impossible-predictor.user.js)**。在油猴编辑器中粘贴完整文件、保存并刷新游戏。先打开一个 Impossible 事件，再点击右下角的 **Imp 预测**。

面板显示失败轮次、最终等级、来源及转盘结果；每个小游戏的最高 Mega 和结算方式、新卡获取方式；目标币种所需关闭的最少扇区组合。只读取和计算，不自动执行游戏操作或修改存档。

## 目录结构

```text
dist/                    可直接安装的单文件油猴脚本
src/
  core/                  预测器和结果摘要、最少关闭组合算法
  generated/             从上游样本提取的规则和符号表
  userscript/            页面状态读取及面板界面
scripts/
  lib/                   项目路径、运行环境适配及 Babel 插件
  build-userscript.cjs    合并源码生成发布脚本
  extract-rules.cjs       从上游主包提取规则
  format-samples.cjs      格式化上游样本，便于分析
tests/
  unit/                  规则、摘要和最少关闭组合验证
  integration/           原包回调对照与浏览器集成测试
  fixtures/              浏览器模拟页面
samples/upstream/        所解析版本的原始游戏 JS 与校验清单
examples/                可公开的构造输入示例
docs/                    机制解析、种子预测与面板使用说明
artifacts/               本地生成的报告、数据、截图和格式化源码
```

`samples/upstream/` 和 `src/generated/` 保留并纳入版本管理，以便对照原始构建与复现提取结果。`dist/*.user.js` 也保留，便于直接安装。`artifacts/` 可重新生成，由 `.gitignore` 排除；个人事件数据或存档请放入同样被忽略的 `local/`。

## 开发与验证

需要 Node.js 20 或以上版本。安装开发依赖：

```sh
npm install
npx playwright install chromium
```

常用命令：

| 命令 | 用途 |
| --- | --- |
| `npm run build` | 生成 `dist/goc-impossible-predictor.user.js`，无需浏览器或开发依赖 |
| `npm test` | 规则、最少关闭组合、原始回调一致性验证 |
| `npm run test:browser` | 测试面板、状态更新及只读行为，截图和报告写入 `artifacts/` |
| `npm run check` | 构建及全部测试 |
| `npm run extract` | 重新提取已收录构建的规则和符号表 |
| `npm run format:samples` | 输出可读源码到 `artifacts/formatted/` |

版本号以 `package.json` 为准，构建时注入油猴头部和面板诊断信息。修改 `src/` 后运行构建，不直接编辑 `dist/`。

各维护脚本通过项目根路径定位文件，不依赖终端当前目录。CLI 输入、输出路径则遵循调用者的当前目录，例如在项目根目录运行：

```sh
npm run predict -- examples/event.json artifacts/prediction-example-result.json
```

仅运行预测器或构建发布文件不需要 Playwright。提取和原包对照使用固定版本 Playwright 附带的 Babel；浏览器测试优先使用已安装的 Playwright Chromium，也可使用本机 Chrome/Edge。

可选环境变量：

- `PLAYWRIGHT_MODULE_PATH`：指定 Playwright 安装目录。
- `CODEX_BABEL_BUNDLE`：指定兼容的 Babel bundle 文件。
- `BROWSER_EXECUTABLE_PATH`：指定测试浏览器可执行文件。

在 Codex 已提供运行依赖的环境中，工具会尝试使用本机随附运行库，无需重复安装。

## 文档

- [面板安装和使用](docs/userscript.md)
- [Impossible 机制解析](docs/game-mechanics.md)
- [已知 seed 的预测原理](docs/seed-prediction.md)

当前规则对应 `index-kVDE62Ka.js`；版本变化后需要重新核对规则。浏览器测试使用构造数据，未连接个人存档。
