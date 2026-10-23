# 上游构建样本

这里保留最初提供的两份游戏 JS，作为本项目规则提取和对照测试的依据，未修改内容：

- `index-kVDE62Ka.js`：核心规则、随机数派生和游戏状态操作。
- `ImpossiblePage-7YXHmM7h.js`：Impossible Room 页面及动画。

文件大小及 SHA-256 见 `manifest.json`。更新游戏版本时新增样本并核对提取入口，不直接把不同版本文件覆盖到旧名称上。

可读副本通过 `npm run format:samples` 生成到 `artifacts/formatted/`，不提交该副本。
