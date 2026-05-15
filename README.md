# 排班管理系统演示（シフト管理システム）

面向仓库现场的 **排班 / シフト管理** 纯前端演示。无后端服务，数据保存在浏览器 **IndexedDB**（通过 Dexie.js）。首次启动会从 `public/data/*.json` **一次性导入种子数据**，之后读写均在本地数据库完成。

## 项目介绍

演示完整的界面交互流程：首页入口 → 新建シフト（单日対象日、作业内容弹窗配置、希望班次表编辑）→ 结果汇总与作业轴 / 人员轴视图；并提供マスタ（类别・技能・人员）维护。

## 技术栈

| 类别 | 选型 |
|------|------|
| 构建 | Vite 5 |
| 框架 | React 18 + TypeScript（strict） |
| 路由 | React Router v6 |
| UI | Material UI v5、`@mui/icons-material` |
| 本地存储 | Dexie.js 4.x、`dexie-react-hooks` |
| E2E | Playwright |

未使用 Tailwind、Radix、recharts 等与既定栈冲突的库。

## 安装步骤

```bash
cd shift-management-demo
npm install
```

若运行 E2E 时提示缺少浏览器，执行：

```bash
npx playwright install chromium
```

## 使用方法

```bash
npm run dev          # 开发服务器，默认 http://localhost:5173
npm run build        # 类型检查 + 生产构建
npm run preview      # 预览构建产物
npm run typecheck    # 仅 TypeScript 检查
npm test             # Playwright 端到端测试
```

**主要路径**

- `/home`：トップ（新建 / 既存调整占位）
- `/shift/create`：新規シフト作成（作业内容设定以 **弹窗** 打开）
- `/shift/result`：シフト結果（演示数据来自既有 `shift_results`）
- `/master`：マスタ設定

## 注意事项

1. **数据位置**：IndexedDB 数据库名 `ShiftMgrDB`，随浏览器与用户配置隔离；调试可在开发者工具「应用程序」中删除站点数据。
2. **种子 JSON**：`public/data/` 下文件仅作初始导入，不会在运行时被程序改写。
3. **路由变更**：`/shift/settask` 独立页面已移除，作业内容设定请从新建页 **「作業内容を追加する」** 打开弹窗。
4. **设计规范**：界面颜色、边框与排版遵循仓库内 `skills/ui/SKILL.md`（Corporate Modern / 主色与 Signal Yellow 点缀等）。
5. **演示边界**：如「既存シフト調整」禁用、导出按钮仅提示等，不代表正式产品能力。

## 许可证

默认按内部演示使用；对外分发时请自行补充许可与合规说明。
