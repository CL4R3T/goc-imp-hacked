# Game of Chance · Impossible Predictor

通过事件 seed 预测 Impossible 结果的油猴面板，当前版本 **v1.0.0**。

**安装脚本：[下载最新发布版](https://github.com/CL4R3T/goc-imp-hacker/releases/latest/download/goc-impossible-predictor.user.js)**。下载后在油猴中新建脚本，粘贴完整文件、保存并刷新游戏。平时隐藏入口；打开 Impossible 事件时自动展开预测面板，关闭面板后右下角保留 **Imp 预测** 按钮，点击可重新展开。

面板显示失败轮次、最终等级、来源及转盘结果；每个小游戏的最高 Mega 和结算方式；所有可获得的新卡及其加成模式、加成大小、对应最高 Mega 和结算方式；目标币种所需关闭的最少扇区组合。只读取和计算，不自动执行游戏操作或修改存档。

## 目录结构

```text
.github/   main 分支自动构建与发布
src/       预测逻辑、规则和面板源码
scripts/   构建和 CLI 入口
tests/     规则、预测及浏览器测试
examples/  CLI 示例输入
docs/      使用说明、机制解析和预览
```

安装用的油猴脚本自包含，无外部依赖。本地运行构建后生成到 `dist/`，该目录不纳入版本管理。

`main` 每次推送后，GitHub Actions 自动构建并运行规则、预测测试，通过后发布 Release。某版本首次发布使用 `v版本号` 标签，同版本后续提交使用 SHA 标签。最新下载入口自动更新，也可在 Actions 中选择 `main` 手动运行发布；脚本版本号仍取自 `package.json`。

## 开发与验证

需要 Node.js 20 或以上版本。构建、CLI 和 `npm test` 只使用 Node.js；运行浏览器测试时安装开发依赖和测试浏览器：

```sh
npm install
npx playwright install chromium
```

| 命令 | 用途 |
| --- | --- |
| `npm run build` | 合并规则、预测器、摘要和面板，生成油猴脚本 |
| `npm test` | 验证规则、预测结果、摘要及转盘最少关闭组合 |
| `npm run test:browser` | 验证面板交互、状态更新和只读行为 |
| `npm run check` | 构建并运行全部测试 |

CLI 示例：

```sh
npm run predict -- examples/event.json artifacts/prediction-example-result.json
```

版本号以 `package.json` 为准。`src/rules/` 直接维护预测所需的精简规则；面板和 CLI 共用同一份规则。构建仅适配模块引用、合并文件并注入版本号。浏览器测试的报告与截图、CLI 指定的输出可放入 `artifacts/`，该目录不纳入版本管理。

浏览器测试可通过 `PLAYWRIGHT_MODULE_PATH` 和 `BROWSER_EXECUTABLE_PATH` 分别指定 Playwright 和浏览器路径；也会尝试使用本机随附运行库。

## 文档

- [面板安装和使用](docs/userscript.md)
- [Impossible 机制解析](docs/game-mechanics.md)
- [已知 seed 的预测原理](docs/seed-prediction.md)

游戏版本与内置规则版本不一致时，脚本默认停止预测并提示核对。使用构造数据进行了验证，尚未在用户真实游戏存档上实测。
