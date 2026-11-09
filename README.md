# Pricing Evaluator（定价评估器）

[![npm version](https://img.shields.io/npm/v/@alcoholl/pricing-evaluator)](https://www.npmjs.com/package/@alcoholl/pricing-evaluator)
[![license](https://img.shields.io/npm/l/@alcoholl/pricing-evaluator)](./LICENSE)

DeepSeek Harness (DSH) 客户端插件：互动式定价评估工具。选择**线上 / 线下**经营模式，输入成本与渠道参数，实时得出贴合实际、在合理区间内收益最大化的具体定价，并用折线图展示「价格 → 销量」「价格 → 利润」的关系。

A DeepSeek Harness (DSH) client plugin: an interactive pricing evaluator. Pick an online / offline business mode, enter costs, and get a realistic, profit-maximizing price together with price–volume and price–profit charts. Bilingual UI (中文 / English).

## 功能特性 / Features

- **经营模式**：线下（实体门店）与线上（电商）一键切换，两套输入互相独立保留。
- **经营画像**：10 种产品类型（餐饮、饮品、快消、服装、数码、家居、文创、美妆、手工、服务）、5 种销售模式（常规零售、薄利多销、高端溢价、会员订阅、套餐捆绑）、按模式切换的销售渠道（线下：核心商圈 / 社区店 / 商场专柜 / 街边店 / 批发市场；线上：淘宝、拼多多、京东、抖音、小红书、私域、跨境），全部图标化点选。
- **成本参数**：
  - 线下：单位成本、月销量、市场参考价、**地段房价（元/㎡/月）× 面积**、水电费、员工人数与人均月薪（社保 +35%）、人力物力杂费；
  - 线上：单位成本、月销量、市场参考价、**单均运费、单均包装**、月推广费、员工与杂费（平台佣金 + 支付手续费按渠道自动计入）。
- **实时评估**：每次输入即时重算——建议售价（支持"好记价格"心理取整）、数学最优价、月利润、月收入、月销量、贡献毛利率、保本价与保本销量、合理定价区间（利润 ≥ 最优 85% 的价格带）。
- **互动图表**：价格→销量、价格→利润两张 SVG 折线图（悬停十字线 + 数据提示 + 建议价标记）、定价区间条、关键数据对比表、±5% 敏感性行。
- **智能补全**：市场参考价留空时按"成本 × 行业加价率"推算；月销量留空时按渠道特征估算；成本结构无法盈利时给出明确诊断与调整建议。
- 深色 / 浅色主题自适应（`--dsw-alias-*` 主题令牌），中英文界面随 DSH 界面语言切换。

## 定价模型 / Pricing model

需求以市场参考价 p₀ 为中心遵循**线性价格弹性**：

```
Q(p) = Q₀ × clamp(1 − E × (p − p₀)/p₀, 0.02, 2.2)
利润 π(p) = Q(p) × (p × (1 − 渠道费率) − 单位变动成本) − 月固定成本
```

其中弹性 `E = 产品类型弹性 × 渠道系数 × 销售模式系数`。工具在 `[保本区、市场价 ×1.9]` 的合理区间内逐点扫描利润曲线，取最大值作为最优价，再在其 ±3%~6% 邻域内挑选利润损失 <1.5% 的"好记价格"（9 结尾 / 整数 / .5）作为建议售价。固定成本线下 = 房租（地段房价 × 面积）+ 水电 + 员工工资 ×1.35 + 杂费；线上 = 员工工资 ×1.2 + 推广费 + 杂费；变动成本线上另含单均运费与包装，渠道佣金与支付手续费按售价比例计入。

## 安装 / Install

### 在 DSH 中 / In DSH

1. 将本目录安装为本地插件（插件页 → 添加插件 → 本地目录），或在 profile 的 `package.json` 中加入：

   ```json
   "@local/pricing-evaluator": "link:<本目录绝对路径>"
   ```

   并把 `"@local/pricing-evaluator"` 加入 `dsh.profile.bundles`，然后在 profile 目录执行 `pnpm install`。
2. 激活后，左侧栏出现 **定价评估** 入口；若未出现，重启 DSH。

### 引擎自测 / Engine self-test

```sh
node test-engine.mjs
```

## 文件结构 / Files

| 文件 | 说明 |
|---|---|
| `index.js` | Host 半部（无操作；全部计算在浏览器端） |
| `client.js` | 客户端模块：引擎 + UI + 图表 + 样式 |
| `cordis.patch.yml` | Loader patch（插入插件行） |
| `locale/{en,zh}.json` | 插件显示元信息 |
| `icon.svg` | 插件图标 |
| `test-engine.mjs` | Node 端引擎测试（9 个场景） |

## 许可 / License

MIT
