# Game of Chance · Impossible Predictor

通过事件 seed 预测 Impossible 结果的油猴面板，当前版本 **v1.0.0**。

**安装脚本：[goc-impossible-predictor.user.js](dist/goc-impossible-predictor.user.js)**。在油猴中新建脚本，粘贴完整文件、保存并刷新游戏。先打开一个 Impossible 事件，再点击右下角的 **Imp 预测**。

面板显示失败轮次、最终等级、来源及转盘结果；每个小游戏的最高 Mega 和结算方式、新卡获取方式；目标币种所需关闭的最少扇区组合。只读取和计算，不自动执行游戏操作或修改存档。

## 目录结构

```text
src/core/              事件预测、结果摘要和最少关闭组合算法
src/userscript/        页面状态读取及面板界面
src/generated/         提取出的完整规则和符号映射
scripts/               构建、规则提取、样本格式化及运行环境适配
tests/                 单元测试、规则对照测试和浏览器模拟测试
samples/upstream/      规则提取及对照测试所用的游戏样本
examples/              CLI 示例输入
dist/                  可直接安装的独立油猴脚本
docs/                  使用说明、机制解析、预测原理和面板预览
artifacts/             本地生成的报告与截图，不纳入版本管理
```

安装用的油猴脚本自包含，无外部依赖。开发时修改 `src/`，再运行构建更新 `dist/`。

## 开发与验证

需要 Node.js 20 或以上版本。安装开发依赖和测试浏览器：

```sh
npm install
npx playwright install chromium
```

| 命令 | 用途 |
| --- | --- |
| `npm run build` | 按实际引用裁剪规则，生成油猴脚本 |
| `npm test` | 验证规则、摘要、转盘最少关闭组合及完整/裁剪版一致性 |
| `npm run test:browser` | 验证面板交互、状态更新和只读行为 |
| `npm run check` | 构建并运行全部测试 |
| `npm run extract` | 从游戏样本重新提取完整规则和符号映射 |
| `npm run format:samples` | 生成便于分析的格式化副本 |

CLI 示例：

```sh
npm run predict -- examples/event.json artifacts/prediction-example-result.json
```

版本号以 `package.json` 为准。构建按预测器、摘要和界面实际访问的入口递归保留规则依赖，并精简展示无关的数据字段；完整规则用于 CLI 和对照测试。构建报告、测试报告及截图写入 `artifacts/`。

工具可通过 `PLAYWRIGHT_MODULE_PATH`、`CODEX_BABEL_BUNDLE` 和 `BROWSER_EXECUTABLE_PATH` 分别指定 Playwright、Babel bundle 和浏览器路径；也会尝试使用本机随附运行库。

## 文档

- [面板安装和使用](docs/userscript.md)
- [Impossible 机制解析](docs/game-mechanics.md)
- [已知 seed 的预测原理](docs/seed-prediction.md)

游戏版本与内置规则版本不一致时，脚本默认停止预测并提示核对。使用构造数据进行了验证，尚未在用户真实游戏存档上实测。
