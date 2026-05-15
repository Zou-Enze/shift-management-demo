# シフト管理システム — AI Agent 代码生成 Prompt

你是一个资深前端工程 AI agent。请实现一个「シフト管理システム」纯前端演示应用，面向仓库现场排班管理。目标是生成一个可运行、可构建、可端到端测试的 React + TypeScript 项目。

## 1. 技术栈与约束

- 使用 Vite 5 + React 18 + TypeScript strict。
- 使用 React Router v6。
- 使用 Material UI v5 与 `@mui/icons-material`。
- 使用 Dexie.js 4 + `dexie-react-hooks`，把业务数据持久化到浏览器 IndexedDB。
- 使用 Playwright 编写基础导航测试。
- 禁止引入 Tailwind、Radix、lucide-react、recharts 或其他图表库。
- 所有面向用户的 UI 文案使用日语。
- 项目是纯前端演示，无后端、无服务器 API。
- `public/data/*.json` 只作为首次启动种子数据，运行时所有读写走 IndexedDB，不修改 JSON 文件。

## 2. 应用路径

实现以下路由：

- `/` 自动跳转 `/home`
- `/home`：トップ画面
- `/shift/create`：新規シフト作成
- `/shift/result`：シフト結果
- `/master`：マスタ設定
- 其他路径跳转 `/home`

注意：不要实现独立 `/shift/settask` 页面。作業内容設定必须作为 `/shift/create` 页面内的 MUI Dialog 弹窗实现。

## 3. 主题与设计规范

创建 `src/theme.ts`，并在 `src/main.tsx` 使用 `ThemeProvider` + `CssBaseline` 包裹 `<App />`。

主题基准：

- `primary.main`: `#3B3377`
- `primary.dark`: `#180D54`
- `primary.light`: `#524B90`
- `secondary.main`: `#F2E300`
- `background.default`: `#FBF9F8`
- `background.paper`: `#FFFFFF`
- `text.primary`: `#1B1C1C`
- `text.secondary`: `#474550`
- `divider`: `#E0E0E0`
- `error.main`: `#BA1A1A`
- `error.light`: `#FFDAD6`
- `error.dark`: `#93000A`
- 字体：标题使用 Montserrat + Noto Sans JP，正文使用 Hanken Grotesk + Noto Sans JP。
- 按钮 4px radius，卡片 8px radius，Paper 不使用默认背景图。
- UI 风格：企业级、清晰、低阴影、以边框和色块建立层级。

## 4. 数据模型

在 `src/types/index.ts` 定义：

```ts
export interface SubCategory {
  id: string;
  name: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  sub_categories: SubCategory[];
}

export interface Skill {
  id: string;
  name: string;
}

export interface Mode {
  id: string;
  name: string;
}

export interface Employee {
  id: string;
  name: string;
  skills: string[];
}

export interface ShiftRequest {
  id: string;
  date: string;
  employee_id: string;
  employee_name: string;
  preferred_start: string;
  preferred_end: string;
}

export interface AssignedEmployee {
  employee_id: string;
  employee_name: string;
}

export interface Assignment {
  task_id: string;
  category_large_id: string;
  category_large: string;
  category_small_id: string;
  category_small: string;
  start_time: string;
  end_time: string;
  task_name: string;
  skill_id: string;
  skill: string;
  required_count: number;
  assigned_count: number;
  shortage: number;
  assigned_employees: AssignedEmployee[];
}

export interface ShiftSummary {
  total_assigned: number;
  total_hours: number;
  shortage_hours: number;
}

export interface ShiftResult {
  id: string;
  period_start: string;
  period_end: string;
  mode: string;
  summary: ShiftSummary;
  assignments: Assignment[];
}

export interface TaskRow {
  id: string;
  category_large_id: string;
  category_small_id: string;
  /** yyyy/mm/dd */
  task_date?: string;
  start_time: string;
  end_time: string;
  task_name: string;
  skill_id: string;
  required_count: number;
}
```

## 5. IndexedDB

创建 Dexie 数据库 `ShiftMgrDB`，表如下：

```ts
categories: '&id, name'
skills: '&id, name'
modes: '&id, name'
employees: '&id, name'
shift_requests: '&id, date, employee_id'
shift_results: '&id'
task_rows: '&id, category_large_id'
```

实现 `seedIfEmpty()`：

- 只检查 `db.categories.count()`。
- 若 count > 0，跳过导入。
- 首次启动从以下文件导入：
  - `/data/categories.json`
  - `/data/skills.json`
  - `/data/modes.json`
  - `/data/employees.json`
  - `/data/shift_requests.json`
  - `/data/shift_result.json`
- 导入 `categories`、`skills`、`modes`、`employees`、`shift_requests`、`shift_results`。
- 不需要从 JSON 初始化 `task_rows`。

`App.tsx` 启动时调用 `seedIfEmpty()`，导入完成前显示居中的 `CircularProgress`。

## 6. 公共布局

实现 `Layout`：

- 顶部固定 AppBar，高度 64px，白底，底部细边框。
- 左侧 Home Icon，点击 `/home`。
- 中间标题根据当前路径显示：
  - `/home`：トップ画面
  - `/shift/create`：新規シフト作成
  - `/shift/result`：シフト結果
  - `/master`：マスタ設定
- 右侧 Settings Icon，点击 `/master`。
- 主内容使用 `<Outlet />`。
- 不使用侧边 Drawer。

## 7. トップ画面 `/home`

- 页面居中展示两个卡片按钮。
- 「新規シフト作成」点击跳转 `/shift/create`。
- 「既存シフト調整」禁用置灰。
- 使用 MUI `Card` / `CardActionArea`、`AddIcon`、`EditOutlinedIcon`。

## 8. 新規シフト作成 `/shift/create`

从 IndexedDB 使用 `useLiveQuery` 读取：

- `categories`
- `skills`
- `employees`
- `shift_requests`
- `task_rows`

页面状态：

- `targetDate` 默认今天，格式 `yyyy-mm-dd`。
- 作業内容設定弹窗开关。
- シフト作成 loading 状态。

页面结构：

1. 标题「新規シフト作成」
2. 対象日：`TextField type="date"`
3. 作業内容入力：
   - Table 列：カテゴリ小 / 開始時間 / 終了時間 / 作業内容 / スキル / 必要人数
   - 若 `task_rows` 为空，显示「まだ作業内容が登録されていません。下のボタンから追加してください。」
   - 每行カテゴリ小左边框颜色来自 `getCategorySmallColor(category_small_id)`。
   - 開始/終了时间用 `formatTaskDateTime(row.task_date, row.start_time, targetDate)` 格式化。
   - 底部按钮「作業内容を追加する」打开 `SetTaskDialog`。
4. シフト希望表入力：
   - Table 列：日付 / 要員ID / 要員名 / 希望開始時間 / 希望終了時間 / 操作
   - 要員ID 用 Select 选择 employees，选中后同步 `employee_id` 与 `employee_name`。
   - 日付、希望開始時間、希望終了時間可行内编辑，直接 update IndexedDB。
   - 支持添加默认希望行和删除行。
5. 右下角固定 `Fab variant="extended"`：
   - 文案「シフト作成」
   - 点击后显示 Backdrop + CircularProgress +「シフトを作成しています...」
   - 1.5 秒后跳转 `/shift/result`

## 9. 作業内容設定弹窗 `SetTaskDialog`

必须作为 `src/components/SetTaskDialog.tsx` 实现，而不是页面路由。

Props：

```ts
interface SetTaskDialogProps {
  open: boolean;
  onClose: () => void;
  onApplied?: (dateIso: string) => void;
}
```

读取：

- `categories`
- `skills`
- `modes`
- existing `task_rows`

弹窗行为：

- 打开时从既有 `db.task_rows` 反向 hydrate 内部 state。
- 若没有既有 `task_rows`，対象日默认为今天。
- 维护内部状态：
  - `selectedLargeIds: string[]`
  - `taskConfig: Record<string, SmallConfig[]>`
  - `taskModeId`，默认 `MODE-01` 或 `modes[0]`
  - `taskTargetDateIso`

弹窗 UI：

- Dialog `maxWidth="lg"`，全宽，最高约 92vh。
- 标题「作業内容設定」，右上角关闭按钮。
- 対象日：date input。
- モード：Select，从 `db.modes` 动态生成。
- 「大カテゴリ追加」按钮：
  - 打开大カテゴリ選択 Dialog。
  - 只展示还未添加的大カテゴリ。
- 每个大カテゴリ区块：
  - 显示大カテゴリ色块与名称。
  - 「小カテゴリ追加」按钮，打开该大カテゴリ下未添加小カテゴリ列表。
  - 「削除」可移除整个大カテゴリ。
- 每个小カテゴリ区块：
  - 左边框颜色使用 `getCategorySmallColor`。
  - 「シフト追加」打开技能配置 Dialog。
  - 删除图标可移除该小カテゴリ。
- シフト追加 Dialog：
  - スキル Select
  - 開始時間 time input，默认 09:00
  - 終了時間 time input，默认 17:00
  - 必要人数 number input，最小 1
  - `task_name` 使用选中 skill 的名称
- スキル卡片：
  - 显示スキル名、時間帯、必要人数
  - 编辑图标切换必要人数输入
  - 保存图标提交
  - 删除图标移除
- 反映按钮：
  - 将 `taskConfig` 展开成 `TaskRow[]`
  - `await db.task_rows.clear()`
  - 非空时 `await db.task_rows.bulkPut(rows)`
  - `onApplied?.(taskTargetDateIso)`
  - 关闭弹窗
- キャンセル按钮只关闭弹窗，不写入 IndexedDB。

## 10. カテゴリ小颜色

创建 `src/constants/categoryColors.ts`：

```ts
export const CATEGORY_SMALL_COLORS: Record<string, string> = {
  'CAT-01-01': '#378ADD',
  'CAT-01-02': '#1D9E75',
  'CAT-01-03': '#85B7EB',
  'CAT-01-04': '#534AB7',
  'CAT-02-01': '#EF9F27',
  'CAT-02-02': '#D85A30',
  'CAT-02-03': '#D4537E',
  'CAT-03-01': '#888780',
  'CAT-03-02': '#5F5E5A',
  'CAT-03-03': '#444441',
  'CAT-03-04': '#7F77DD',
};

export const DEFAULT_CATEGORY_SMALL_COLOR = '#CCCCCC';

export function getCategorySmallColor(id: string): string {
  return CATEGORY_SMALL_COLORS[id] ?? DEFAULT_CATEGORY_SMALL_COLOR;
}
```

## 11. シフト結果 `/shift/result`

读取：

- `shift_results`
- `categories`

若数据加载中，显示 CircularProgress。
若没有结果，显示「シフト結果がまだ作成されていません。」和「入力に戻る」。

有结果时：

1. サマリ
   - 三张卡片：
     - シフト割当人数：`total_assigned` 名
     - 合計工数：`total_hours` 時間
     - 不足工数：`shortage_hours` 時間・人
   - 数字用 `useCountUp(value, 1000)` 动画。
   - `shortage_hours > 0` 时使用 `error.light` / `error.main` / `error.dark`。

2. Tabs
   - 作業軸
   - 人員軸

3. 作業軸表格
   - 按 `category_large_id` 分组。
   - 分组 header 背景使用大カテゴリ color。
   - 列：カテゴリ大 / カテゴリ小 / 開始時間 / 終了時間 / 作業内容 / スキル / 必要人数 / 割当要員
   - `shortage > 0` 的行使用 `error.light`。
   - 必要人数显示 `assigned_count/required_count名`，不足时显示 `不足N`。
   - 割当要員显示 `employee_id employee_name` 逗号拼接。

4. 人員軸甘特图
   - 禁止图表库，用 CSS Grid + absolute Box 实现。
   - 时间范围为 0:00〜24:00，表头显示 0時 到 23時。
   - 左侧固定要員列宽 160px。
   - 每个员工一行。
   - 色条按 `assignment.start_time` / `assignment.end_time` 计算 `left` / `width`。
   - 色条颜色使用大カテゴリ color。
   - Tooltip：`作業内容 開始〜終了`。
   - 横向可滚动。

5. 底部按钮
   - 「入力に戻る」跳转 `/shift/create`
   - 「Excelエクスポート」alert `導出機能は実装予定です`
   - 「PDFエクスポート」alert `導出機能は実装予定です`

## 12. マスタ設定 `/master`

Tabs：

- カテゴリ管理
- スキル管理
- 要員管理

### カテゴリ管理

- 显示カテゴリ大列表：展开列 / ID / 名称 / 色 / カテゴリ小件数 / 操作。
- 每个大カテゴリ可展开查看小カテゴリ。
- 大カテゴリ支持追加、編集、削除。
- 小カテゴリ支持追加、編集、削除。
- 删除均使用通用 `ConfirmDialog` 二次确认。
- 大カテゴリ删除时直接删除该カテゴリ对象，配下小カテゴリ随对象消失。
- 色编辑使用 `<input type="color">` + hex TextField。

### スキル管理

- 列表：ID / 名称 / 操作。
- 支持追加、編集、削除。
- 删除前检查 employees 中是否引用该 skill id。
- 若被引用，显示 warning Dialog：
  - 「削除できません」
  - `このスキルはN名の要員に使用されています。`

### 要員管理

- 列表：ID / 姓名 / 保有スキル / 操作。
- 保有スキル用 Chip 展示。
- 支持追加、編集、削除。
- 编辑 Dialog 包含姓名 TextField 与技能 Checkbox 列表。
- 删除使用 `ConfirmDialog`。

## 13. 通用组件与 Hook

- `ConfirmDialog`：通用确认弹窗，props 包含 `open` / `title` / `message` / `onClose` / `onConfirm`。
- `useCountUp(target, duration)`：使用 `requestAnimationFrame` 从 0 动画到目标值。
- 可实现 `useTable` 通用 CRUD hook，但当前页面可直接使用 `useLiveQuery` + db 操作。

## 14. 日期工具

实现 `src/utils/taskDateTime.ts`：

- `todayIsoDate()`: `yyyy-mm-dd`
- `isoDateToSlash(yyyy-mm-dd)`: `yyyy/mm/dd`
- `slashDateToIso(yyyy/mm/dd)`: `yyyy-mm-dd`
- `formatTaskDateTime(taskDate, time, fallbackIsoDate)`: 把日期与时间组合成页面展示格式；若 `taskDate` 缺失，用 `fallbackIsoDate`。

## 15. Playwright 验收测试

创建 `tests/navigation.spec.ts`，每个测试前：

- `goto('/')`
- 删除 IndexedDB `ShiftMgrDB`
- reload 等待重新 seed

至少覆盖：

1. `/home` 点击「新規シフト作成」后 URL 为 `/shift/create`
2. `/shift/create` 点击「シフト作成」后显示 loading，并最终跳转 `/shift/result`
3. `/shift/create` 点击「作業内容を追加する」后弹出 `data-testid="set-task-dialog"`，点击 `data-testid="set-task-cancel"` 后关闭

## 16. 验收命令

实现完成后必须通过：

```bash
npm run typecheck
npm run build
npm test
```

若 Playwright 缺少浏览器，提示用户执行：

```bash
npx playwright install chromium
```

## 17. 相比旧版 PROMPT.md 的改善点

1. 纠正了作業内容設定的形态：旧 prompt 要求 `/shift/settask` 独立页面，但当前代码实际是 `SetTaskDialog` 弹窗，且没有 `/shift/settask` 路由。
2. 纠正了日期模型：旧 prompt 写开始日/结束日，当前实现是单一「対象日」，并通过 `TaskRow.task_date` 保存。
3. 纠正了 `TaskRow` 类型：旧 prompt 有 `mode_id`，当前代码没有；当前代码有 `task_date?: string`。
4. 纠正了 Layout 描述：旧 prompt 提到 Drawer/sidebar，当前实现是固定顶部 AppBar。
5. 纠正了主题色：旧 prompt 示例主题与当前 `theme.ts` 不一致；当前主色是 `#3B3377`，点缀色是 `#F2E300`。
6. 纠正了甘特图时间范围：旧 prompt 是 06:00〜21:00，当前实现是 0:00〜24:00。
7. 补充了现有测试约束：明确 IndexedDB reset、弹窗 test id、导航测试。
8. 把“产品需求”改成“复刻现状”：减少 agent 生成一套和当前仓库冲突的新架构。
