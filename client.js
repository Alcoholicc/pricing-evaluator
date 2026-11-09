/**
 * Client half of the pricing-evaluator bundle.
 *
 * Adds a sidebar panel ("Pricing Evaluator") with an interactive pricing
 * tool: the user picks an online / offline business mode, product type,
 * sales mode and channel, enters costs, and the panel continuously
 * recomputes a realistic, profit-maximizing price together with
 * price–volume and price–profit charts.
 *
 * All computation runs in the browser; the Host half is a no-op.
 */
window.__ModuleLoader__.load({
  id: '@alcoholl/pricing-evaluator',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const { useState, useEffect, useMemo, useRef } = React;

    /* ============================ i18n ================================= */

    const NS = 'pricing-evaluator';

    const EN = {
      sidebarLabel: 'Pricing',
      panelTitle: 'Pricing Evaluator',
      modeOffline: 'Offline',
      modeOnline: 'Online',
      modeHintOffline: 'Brick-and-mortar store: rent, utilities, staff…',
      modeHintOnline: 'E-commerce: shipping, promotion, platform fees…',
      profile: 'Business profile',
      productType: 'Product type',
      salesMode: 'Sales model',
      channel: 'Sales channel',
      costs: 'Cost inputs',
      unitCost: 'Unit cost',
      unitCostHint: 'Variable cost per item (materials / purchase price)',
      monthlyQty: 'Monthly volume',
      monthlyQtyHint: 'Expected units sold per month at the market price',
      marketPrice: 'Market price',
      marketPriceHint: 'Competitor / street price. Auto-filled from cost × industry markup.',
      autoFill: 'Auto',
      rentPerSqm: 'Location rent',
      rentPerSqmHint: '¥ / m² / month for this area',
      area: 'Floor area',
      areaHint: 'm²',
      utilities: 'Utilities',
      utilitiesHint: 'Water, electricity, gas per month',
      staff: 'Staff',
      staffHint: 'Headcount',
      salary: 'Monthly salary',
      salaryHint: 'Per person, gross; social insurance ≈ +35%',
      laborMisc: 'Labor & supplies',
      laborMiscHint: 'Other manpower / material costs per month',
      shipping: 'Shipping per order',
      shippingHint: 'Average delivery cost per order',
      packing: 'Packing per order',
      packingHint: 'Box, filler, tape per order',
      promo: 'Promotion',
      promoHint: 'Ads, traffic, live-stream budget per month',
      staffOnline: 'Staff',
      staffOnlineHint: 'Ops / customer service headcount',
      salaryOnline: 'Monthly salary',
      salaryOnlineHint: 'Per person; social insurance ≈ +20%',
      rentSummary: 'Monthly rent ≈',
      fixedCost: 'Fixed costs / month',
      results: 'Evaluation results',
      kpiPrice: 'Suggested price',
      kpiProfit: 'Monthly profit',
      kpiRevenue: 'Monthly revenue',
      kpiQty: 'Monthly sales',
      kpiMargin: 'Contribution margin',
      kpiBreakEven: 'Break-even sales',
      chartQty: 'Price → volume',
      chartProfit: 'Price → profit',
      axisPrice: 'Price (¥)',
      axisQty: 'Volume',
      axisProfit: 'Profit (¥)',
      breakEvenLabel: 'Break-even',
      optimalLabel: 'Optimal',
      suggestedLabel: 'Suggested',
      rangeTitle: 'Reasonable price range',
      rangeNote: 'Green zone keeps ≥85% of the best profit',
      detailTitle: 'Key figures',
      detailPrice: 'Price',
      detailQty: 'Volume',
      detailRevenue: 'Revenue',
      detailProfit: 'Profit',
      detailRowBePrice: 'Break-even price (at expected volume)',
      detailRowBeQty: 'Break-even volume (at suggested price)',
      detailRowOptimal: 'Mathematical optimum',
      detailRowPsych: 'Suggested (consumer-friendly rounding)',
      detailRowHigh: 'Suggested +5%',
      detailRowLow: 'Suggested −5%',
      loadSample: 'Load sample',
      reset: 'Reset',
      warnAllLoss: 'No price breaks even with these inputs: total costs exceed revenue at every price. Cut fixed or unit costs, or raise the market reference price.',
      warnNoQty: 'Monthly volume missing — using a channel-based estimate.',
      warnAutoMarket: 'Market price missing — estimated as unit cost × industry markup.',
      warnCliff: 'Profit keeps rising at the scan edge: demand is very price-insensitive. Verify the elasticity assumption for your product.',
      warnAutoQty: 'Estimated volume used; enter your own forecast for a more precise result.',
      errCost: 'Unit cost must be a positive number.',
      errQty: 'Monthly volume must be a positive number.',
      errMarket: 'Market price must be a positive number.',
      errRent: 'Rent input must be a non-negative number.',
      errNum: 'Check the highlighted numeric inputs.',
      psyMode: 'Round price',
      psyOff: 'Exact',
      psyNice: 'Nice price',
      stepTitle: 'How it works',
      stepBody: 'Demand follows a linear price-elasticity curve around the market price; the tool scans prices and picks the one that maximizes monthly profit within the reasonable range.',
    };

    const ZH = {
      sidebarLabel: '定价评估',
      panelTitle: '定价评估器',
      modeOffline: '线下',
      modeOnline: '线上',
      modeHintOffline: '实体门店：房租、水电、员工……',
      modeHintOnline: '电商网店：运费、推广、平台佣金……',
      profile: '经营画像',
      productType: '产品类型',
      salesMode: '销售模式',
      channel: '销售渠道',
      costs: '成本参数',
      unitCost: '单位成本',
      unitCostHint: '每件产品的变动成本（原料 / 进货价）',
      monthlyQty: '月销量',
      monthlyQtyHint: '按市场价预计的每月销量（件 / 杯 / 单）',
      marketPrice: '市场参考价',
      marketPriceHint: '竞品 / 市面售价；留空则按 成本 × 行业加价率 推算',
      autoFill: '自动推算',
      rentPerSqm: '地段房价',
      rentPerSqmHint: '该地段租金（元 / ㎡ / 月）',
      area: '经营面积',
      areaHint: '平方米',
      utilities: '水电费',
      utilitiesHint: '每月水电燃气费用',
      staff: '员工人数',
      staffHint: '雇佣人数',
      salary: '人均月薪',
      salaryHint: '税前月薪；社保公积金约 +35%',
      laborMisc: '人力物力',
      laborMiscHint: '每月其他人力 / 物料杂费',
      shipping: '单均运费',
      shippingHint: '每单平均配送费用',
      packing: '单均包装',
      packingHint: '每单纸箱、填充、胶带费用',
      promo: '月推广费',
      promoHint: '每月投流 / 广告 / 直播预算',
      staffOnline: '员工人数',
      staffOnlineHint: '运营 / 客服人数',
      salaryOnline: '人均月薪',
      salaryOnlineHint: '税前月薪；社保约 +20%',
      rentSummary: '月租金约',
      fixedCost: '月固定成本',
      results: '评估结果',
      kpiPrice: '建议售价',
      kpiProfit: '月利润',
      kpiRevenue: '月收入',
      kpiQty: '月销量',
      kpiMargin: '贡献毛利率',
      kpiBreakEven: '保本销量',
      chartQty: '价格 → 销量',
      chartProfit: '价格 → 利润',
      axisPrice: '价格（元）',
      axisQty: '销量',
      axisProfit: '利润（元）',
      breakEvenLabel: '保本点',
      optimalLabel: '最优价',
      suggestedLabel: '建议价',
      rangeTitle: '合理定价区间',
      rangeNote: '绿色区间利润保持在最优的 85% 以上',
      detailTitle: '关键数据',
      detailPrice: '价格',
      detailQty: '销量',
      detailRevenue: '收入',
      detailProfit: '利润',
      detailRowBePrice: '保本价（按预期销量）',
      detailRowBeQty: '保本销量（按建议价）',
      detailRowOptimal: '数学最优价',
      detailRowPsych: '建议售价（利于成交的取整）',
      detailRowHigh: '建议价 +5%',
      detailRowLow: '建议价 −5%',
      loadSample: '载入示例',
      reset: '重置',
      warnAllLoss: '当前成本结构下任何价格都无法盈利：请降低固定 / 单位成本，或提高市场参考价。',
      warnNoQty: '未填写月销量——已按渠道特征给出估算值。',
      warnAutoMarket: '未填写市场参考价——已按 成本 × 行业加价率 推算。',
      warnCliff: '利润在扫描边界仍持续上升：需求对价格极不敏感，请核实该产品的价格弹性假设。',
      warnAutoQty: '当前使用估算销量，填入你自己的预测会更准确。',
      errCost: '单位成本必须为正数。',
      errQty: '月销量必须为正数。',
      errMarket: '市场参考价必须为正数。',
      errRent: '租金相关输入必须为非负数。',
      errNum: '请检查标红的数字输入项。',
      psyMode: '价格取整',
      psyOff: '精确值',
      psyNice: '好记价格',
      stepTitle: '计算原理',
      stepBody: '需求以市场参考价为中心遵循线性价格弹性曲线；工具扫描各价格点，在合理区间内选出使月利润最大化的定价。',
    };

    /** Register dictionaries with the host locale service; fall back to browser language. */
    function installLocale(ctx) {
      const locale = ctx.get('locale');
      if (locale && typeof locale.register === 'function' && typeof locale.bind === 'function') {
        const disposers = [
          locale.register(NS, 'en', EN),
          locale.register(NS, 'zh', ZH),
          locale.register(NS, 'zh-CN', ZH),
          locale.register(NS, 'zh-Hans', ZH),
        ];
        const t = locale.bind(NS);
        return {
          t,
          locale,
          dispose() {
            disposers.forEach((d) => {
              try { d(); } catch (err) { /* already removed */ }
            });
          },
        };
      }
      const t = (key) => {
        const lang = (typeof navigator !== 'undefined' ? navigator.language || '' : '').toLowerCase();
        const dict = lang.startsWith('zh') ? ZH : EN;
        return dict[key] != null ? dict[key] : key;
      };
      return { t, locale: null, dispose() {} };
    }

    /* ======================= business presets ========================== */

    const PRODUCT_TYPES = {
      food: { emoji: '🍜', elastic: 1.8, markup: 2.5, nameEn: 'Food & dining', nameZh: '餐饮食品' },
      drink: { emoji: '🧋', elastic: 1.5, markup: 3.0, nameEn: 'Beverages', nameZh: '饮品咖啡' },
      retail: { emoji: '🛒', elastic: 1.8, markup: 2.0, nameEn: 'FMCG retail', nameZh: '快消零售' },
      apparel: { emoji: '👕', elastic: 2.2, markup: 2.8, nameEn: 'Apparel', nameZh: '服装服饰' },
      digital: { emoji: '📱', elastic: 1.4, markup: 1.6, nameEn: 'Electronics', nameZh: '数码电子' },
      home: { emoji: '🛋️', elastic: 1.7, markup: 2.2, nameEn: 'Home & living', nameZh: '家居用品' },
      book: { emoji: '📚', elastic: 1.2, markup: 1.9, nameEn: 'Books & gifts', nameZh: '图书文创' },
      beauty: { emoji: '💄', elastic: 1.5, markup: 2.6, nameEn: 'Beauty care', nameZh: '美妆个护' },
      handmade: { emoji: '🎨', elastic: 1.0, markup: 3.2, nameEn: 'Handcrafted', nameZh: '手工定制' },
      service: { emoji: '💇', elastic: 1.3, markup: 2.0, nameEn: 'Services', nameZh: '生活服务' },
    };

    const OFFLINE_CHANNELS = {
      hub: { emoji: '🏙️', feeRate: 0, elasticMult: 1.0, nameEn: 'Prime location store', nameZh: '核心商圈门店' },
      community: { emoji: '🏘️', feeRate: 0, elasticMult: 1.05, nameEn: 'Community store', nameZh: '社区店' },
      mall: { emoji: '🛍️', feeRate: 0.22, elasticMult: 0.95, nameEn: 'Mall counter (22% cut)', nameZh: '商场专柜（扣点22%）' },
      street: { emoji: '🚶', feeRate: 0, elasticMult: 1.05, nameEn: 'Street shop', nameZh: '街边店' },
      wholesale: { emoji: '📦', feeRate: 0.03, elasticMult: 1.5, nameEn: 'Wholesale market', nameZh: '批发市场' },
    };

    const ONLINE_CHANNELS = {
      taobao: { emoji: '🐱', feeRate: 0.06, elasticMult: 1.1, promo: 0.08, nameEn: 'Taobao (6%)', nameZh: '淘宝天猫（6%）' },
      pdd: { emoji: '⚡', feeRate: 0.006, elasticMult: 1.5, promo: 0.05, nameEn: 'Pinduoduo (0.6%)', nameZh: '拼多多（0.6%）' },
      jd: { emoji: '🐶', feeRate: 0.08, elasticMult: 1.0, promo: 0.08, nameEn: 'JD (8%)', nameZh: '京东（8%）' },
      douyin: { emoji: '🎵', feeRate: 0.05, elasticMult: 1.15, promo: 0.15, nameEn: 'Douyin live (5%)', nameZh: '抖音直播（5%）' },
      xhs: { emoji: '📕', feeRate: 0.05, elasticMult: 1.0, promo: 0.1, nameEn: 'Xiaohongshu (5%)', nameZh: '小红书（5%）' },
      private: { emoji: '💬', feeRate: 0.01, elasticMult: 0.9, promo: 0.03, nameEn: 'Private traffic (1%)', nameZh: '私域微信（1%）' },
      cross: { emoji: '✈️', feeRate: 0.12, elasticMult: 1.2, promo: 0.15, nameEn: 'Cross-border (12%)', nameZh: '跨境电商（12%）' },
    };

    const SALES_MODES = {
      retail: { emoji: '🏪', elasticMult: 1.0, qtyMult: 1.0, priceMult: 1.0, nameEn: 'Regular retail', nameZh: '常规零售' },
      volume: { emoji: '📈', elasticMult: 1.3, qtyMult: 1.25, priceMult: 0.9, nameEn: 'High volume, low margin', nameZh: '薄利多销' },
      premium: { emoji: '💎', elasticMult: 0.7, qtyMult: 0.75, priceMult: 1.35, nameEn: 'Premium pricing', nameZh: '高端溢价' },
      membership: { emoji: '🎫', elasticMult: 0.85, qtyMult: 1.15, priceMult: 1.05, nameEn: 'Membership', nameZh: '会员订阅' },
      bundle: { emoji: '🎁', elasticMult: 0.9, qtyMult: 0.9, priceMult: 1.5, nameEn: 'Bundles & combos', nameZh: '套餐捆绑' },
    };

    /* ======================= pricing engine ============================ */

    const round2 = (x) => Math.round(x * 100) / 100;
    const round0 = (x) => Math.round(x);

    function num(v, fallback) {
      const n = Number(v);
      return Number.isFinite(n) ? n : fallback;
    }

    /** Estimate monthly volume when the user leaves it blank. */
    function estimateQty(mode, channel, productType) {
      const base = {
        offline: { hub: 12000, community: 4000, mall: 9000, street: 5000, wholesale: 30000 },
        online: { taobao: 1500, pdd: 5000, jd: 800, douyin: 3000, xhs: 600, private: 400, cross: 500 },
      };
      const qty = (base[mode] && base[mode][channel]) || 1000;
      const pt = PRODUCT_TYPES[productType] || PRODUCT_TYPES.retail;
      // cheaper impulse goods sell more, pricier durable goods less
      const priceAdj = Math.min(3, Math.max(0.3, 10 / Math.max(1, pt.markup)));
      return Math.round(qty * priceAdj);
    }

    /** “Nice” consumer price candidates near a value. */
    function nicePrices(around) {
      if (around < 10) {
        const tenths = [];
        for (let i = 0; i <= 40; i += 1) tenths.push(round2(around - 2 + i * 0.1));
        return tenths.filter((p) => p > 0);
      }
      if (around < 100) {
        return [round0(around), round0(around) - 0.5, round0(around) + 0.5, Math.ceil(around) - 0.1, Math.floor(around) + 0.9]
          .filter((p) => p > 0);
      }
      const s = around < 1000 ? 1 : 10;
      const candidates = [];
      const lo = Math.max(1, Math.round(around * 0.94));
      const hi = Math.round(around * 1.06);
      for (let v = lo; v <= hi; v += s) {
        candidates.push(v - 0.1); // 9-ending
        candidates.push(v); // round
        if (s >= 10) candidates.push(v - 1);
      }
      return [...new Set(candidates.map(round2))].filter((p) => p > 0).sort((a, b) => a - b);
    }

    /**
     * Core evaluation. `raw` is the form state; returns resolved inputs,
     * diagnostics, the profit-maximizing price, and the price-scan curve.
     */
    function computePricing(raw) {
      const errors = [];
      const warnings = [];
      const mode = raw.mode === 'offline' ? 'offline' : 'online';
      const pt = PRODUCT_TYPES[raw.productType] || PRODUCT_TYPES.retail;
      const chanKey = (mode === 'offline' ? OFFLINE_CHANNELS : ONLINE_CHANNELS)[raw.channel]
        ? raw.channel
        : mode === 'offline' ? 'hub' : 'taobao';
      const ch = (mode === 'offline' ? OFFLINE_CHANNELS : ONLINE_CHANNELS)[chanKey];
      const sm = SALES_MODES[raw.salesMode] || SALES_MODES.retail;

      /* --- variable cost per unit --- */
      const baseCost = num(raw.baseCost, NaN);
      if (!(baseCost > 0)) errors.push('errCost');
      const shipping = mode === 'online' ? Math.max(0, num(raw.shipping, 0)) : 0;
      const packing = mode === 'online' ? Math.max(0, num(raw.packing, 0)) : 0;
      const unitCost = baseCost + shipping + packing;

      /* --- fixed cost per month --- */
      let fixedCost = 0;
      if (mode === 'offline') {
        const rentPerSqm = num(raw.rentPerSqm, NaN);
        const area = num(raw.area, NaN);
        let rent = 0;
        if (Number.isFinite(rentPerSqm) && Number.isFinite(area) && rentPerSqm >= 0 && area >= 0) {
          rent = rentPerSqm * area;
        } else if ((raw.rentPerSqm != null && String(raw.rentPerSqm) !== '') || (raw.area != null && String(raw.area) !== '')) {
          errors.push('errRent');
        }
        const utilities = Math.max(0, num(raw.utilities, 0));
        const staffN = Math.max(0, num(raw.staff, 0));
        const salary = Math.max(0, num(raw.salary, 0));
        const misc = Math.max(0, num(raw.laborMisc, 0));
        fixedCost = rent + utilities + staffN * salary * 1.35 + misc;
      } else {
        const staffN = Math.max(0, num(raw.staff, 0));
        const salary = Math.max(0, num(raw.salary, 0));
        const promoIn = num(raw.promo, NaN);
        const promoCost = Number.isFinite(promoIn) && promoIn >= 0 ? promoIn : 0;
        const misc = Math.max(0, num(raw.laborMisc, 0));
        fixedCost = staffN * salary * 1.2 + promoCost + misc;
      }

      /* --- expected volume at the market price --- */
      let qty = num(raw.qty, NaN);
      const qtyMissing = !(qty > 0);
      if (qtyMissing) {
        qty = estimateQty(mode, chanKey, raw.productType);
        warnings.push('warnAutoQty');
      } else if (raw.qty < 0) {
        errors.push('errQty');
      }

      /* --- market reference price --- */
      let market = num(raw.market, NaN);
      const marketMissing = !(market > 0);
      if (marketMissing) {
        market = Math.max(unitCost, 1) * pt.markup;
        warnings.push('warnAutoMarket');
      }

      /* --- effective fee rate (channel commission + payment) --- */
      const feeRate = ch.feeRate + 0.006;

      /* --- price elasticity of demand --- */
      const elastic = Math.min(6, Math.max(0.2, pt.elastic * ch.elasticMult * sm.elasticMult));

      /* --- baseline demand / price adjusted by sales model --- */
      const baseQty = Math.max(1, qty * sm.qtyMult);
      const basePrice = market * sm.priceMult;

      /* --- demand curve: linear elasticity around the base price --- */
      const demand = (p) => {
        const ratio = 1 - elastic * (p - basePrice) / basePrice;
        return baseQty * Math.min(2.2, Math.max(0.02, ratio));
      };
      const unitMargin = (p) => p * (1 - feeRate) - unitCost;
      const profitAt = (p) => demand(p) * unitMargin(p) - fixedCost;

      /* --- break-even figures --- */
      const bePrice = unitCost / (1 - feeRate) + fixedCost / Math.max(baseQty, 1) / (1 - feeRate);

      /* --- scan the reasonable price range --- */
      const minScan = Math.max((unitCost / (1 - feeRate)) * 1.05, basePrice * 0.45);
      const maxScan = basePrice * 1.9;
      const step = basePrice < 5 ? 0.1 : basePrice < 30 ? 0.5 : basePrice < 200 ? 1 : basePrice < 2000 ? 10 : 100;
      const curve = [];
      let best = null;
      for (let p = minScan; p <= maxScan + 1e-9; p += step) {
        const q = demand(p);
        const revenue = q * p;
        const fee = q * p * feeRate;
        const totalCost = q * unitCost + fee + fixedCost;
        const profit = revenue - totalCost;
        curve.push({
          p: round2(p), q: round0(q), revenue: round0(revenue), totalCost: round0(totalCost),
          profit: round0(profit), margin: revenue > 0 ? (p - unitCost - p * feeRate) / p : 0,
        });
        if (!best || profit > best.profit) best = { p, q, revenue, profit };
      }

      let optimal = best && best.profit > -Infinity ? best : null;
      if (!optimal) {
        warnings.push('warnAllLoss');
      } else if (optimal.p >= maxScan - step / 2) {
        warnings.push('warnCliff');
      }

      /* --- reasonable range: prices keeping ≥85% of the best profit --- */
      let rangeLo = null;
      let rangeHi = null;
      const maxProfit = optimal ? optimal.profit : 0;
      if (optimal) {
        const good = curve.filter((d) => d.profit >= Math.max(0, maxProfit * 0.85));
        if (good.length) {
          rangeLo = good[0].p;
          rangeHi = good[good.length - 1].p;
        }
      }

      /* --- psychological (nice) price near the optimum --- */
      let nice = null;
      if (optimal) {
        const cands = nicePrices(optimal.p).filter((p) => p >= minScan && p <= maxScan);
        let bestNice = null;
        for (const p of cands) {
          const prof = profitAt(p);
          if (!bestNice || prof > bestNice.profit) bestNice = { p, profit: prof };
        }
        if (bestNice && maxProfit > 0 && bestNice.profit >= maxProfit * 0.985) {
          nice = {
            p: round2(bestNice.p), q: round0(demand(bestNice.p)),
            revenue: round0(demand(bestNice.p) * bestNice.p), profit: round0(bestNice.profit),
          };
        }
      }

      const suggested = nice || (optimal ? { p: round2(optimal.p), q: round0(optimal.q), revenue: round0(optimal.revenue), profit: round0(optimal.profit) } : null);
      const suggestedQ = suggested ? suggested.q : 0;
      const beQty = suggested && unitMargin(suggested.p) > 0 ? fixedCost / unitMargin(suggested.p) : Infinity;

      if (maxProfit < 0) warnings.push('warnAllLoss');
      if (errors.length) warnings.push('errNum');

      return {
        ok: errors.length === 0,
        errors,
        warnings,
        mode,
        resolved: {
          productType: raw.productType,
          salesMode: raw.salesMode,
          channel: chanKey,
          unitCost: round2(unitCost),
          fixedCost: round0(fixedCost),
          feeRate: round2(feeRate * 100),
          elastic: round2(elastic),
          basePrice: round2(basePrice),
          baseQty: round0(baseQty),
          market: round2(market),
          marketMissing,
          qtyMissing,
        },
        breakEven: { price: round2(bePrice), qty: round0(beQty) },
        optimal: optimal ? { p: round2(optimal.p), q: round0(optimal.q), revenue: round0(optimal.revenue), profit: round0(optimal.profit) } : null,
        suggested,
        range: rangeLo != null ? { lo: round2(rangeLo), hi: round2(rangeHi) } : null,
        maxProfit: round0(maxProfit),
        curve,
        scan: { min: round2(minScan), max: round2(maxScan) },
      };
    }

    /* ======================== small UI helpers ========================= */

    function fmtMoney(x, zh) {
      const n = Math.round(Number(x) || 0);
      return (zh ? '¥' : '¥') + n.toLocaleString(zh ? 'zh-CN' : 'en-US');
    }
    function fmtNum(x) {
      const n = Math.round(Number(x) || 0);
      return n.toLocaleString('zh-CN');
    }
    function fmtPct(x) {
      return (Math.round((Number(x) || 0) * 1000) / 10).toFixed(1) + '%';
    }

    function Lang(props) {
      return props.zh ? props.zh : props.en;
    }

    /* ========================= chart components ======================== */

    const SERIES_COLORS = { q: '#4f8ef7', revenue: '#41a977', profit: '#e8843c' };

    function buildAxis(min, max, ticks) {
      const out = [];
      for (let i = 0; i <= ticks; i += 1) out.push(min + ((max - min) * i) / ticks);
      return out;
    }

    function fmtTick(x, kind, zh) {
      if (kind === 'money') {
        if (Math.abs(x) >= 10000) return (x / 10000).toFixed(x % 10000 === 0 ? 0 : 1) + (zh ? '万' : 'w');
        return String(Math.round(x));
      }
      if (Math.abs(x) >= 10000) return (x / 10000).toFixed(x % 10000 === 0 ? 0 : 1) + (zh ? '万' : 'w');
      return String(Math.round(x));
    }

    /**
     * Generic SVG line/area chart with grid, axes, hover crosshair and a
     * highlighted marker (the suggested / optimal price).
     */
    function LineChart(props) {
      const {
        curve, xKey, series, yMin, yMax, height, zh, marker, markerLabel, zeroLine,
      } = props;
      const [hover, setHover] = useState(null);
      const ref = useRef(null);
      const W = 640;
      const H = height || 220;
      const padL = 44;
      const padR = 14;
      const padT = 14;
      const padB = 26;
      const plotW = W - padL - padR;
      const plotH = H - padT - padB;

      const xs = curve.map((d) => d[xKey]);
      const xMin = Math.min(...xs);
      const xMax = Math.max(...xs);
      const yLo = yMin != null ? yMin : Math.min(0, ...series.flatMap((s) => curve.map((d) => d[s.key])));
      const yHi = yMax != null ? yMax : Math.max(0, ...series.flatMap((s) => curve.map((d) => d[s.key])));

      const x = (v) => padL + ((v - xMin) / Math.max(xMax - xMin, 1e-9)) * plotW;
      const y = (v) => padT + (1 - (v - yLo) / Math.max(yHi - yLo, 1e-9)) * plotH;

      const pathOf = (s) => curve.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(d[xKey]).toFixed(1)},${y(d[s.key]).toFixed(1)}`).join(' ');

      const yTicks = buildAxis(yLo, yHi, 4);
      const xTicks = buildAxis(xMin, xMax, 5);

      const onMove = (e) => {
        const el = ref.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const px = ((e.clientX - rect.left) / rect.width) * W;
        const t = Math.min(curve.length - 1, Math.max(0, Math.round(((px - padL) / plotW) * (curve.length - 1))));
        setHover(curve[t]);
      };

      let markerIdx = -1;
      if (marker != null) {
        let bd = Infinity;
        curve.forEach((d, i) => {
          const dist = Math.abs(d[xKey] - marker);
          if (dist < bd) { bd = dist; markerIdx = i; }
        });
      }

      const areaPath = `${pathOf(series[0])} L${x(curve[curve.length - 1][xKey]).toFixed(1)},${y(0).toFixed(1)} L${x(curve[0][xKey]).toFixed(1)},${y(0).toFixed(1)} Z`;

      return h(
        'div',
        { className: 'pe-chart-wrap' },
        h(
          'svg',
          {
            ref,
            viewBox: `0 0 ${W} ${H}`,
            className: 'pe-chart',
            role: 'img',
            onMouseMove: onMove,
            onMouseLeave: () => setHover(null),
          },
          /* grid + zero line */
          yTicks.map((tv, i) =>
            h('line', { key: `gy${i}`, x1: padL, x2: W - padR, y1: y(tv), y2: y(tv), className: 'pe-grid' }),
          ),
          zeroLine ? h('line', { x1: padL, x2: W - padR, y1: y(0), y2: y(0), className: 'pe-zero' }) : null,
          xTicks.map((tv, i) =>
            h('line', { key: `gx${i}`, x1: x(tv), x2: x(tv), y1: padT, y2: H - padB, className: 'pe-grid' }),
          ),
          /* area fill for the first series */
          series[0].area
            ? h('path', { d: areaPath, className: 'pe-area' })
            : null,
          /* series lines */
          series.map((s) =>
            h('path', { key: s.key, d: pathOf(s), className: 'pe-line', stroke: s.color || SERIES_COLORS[s.key] }),
          ),
          /* hover marker */
          hover
            ? h(
                'g',
                null,
                h('line', { x1: x(hover[xKey]), x2: x(hover[xKey]), y1: padT, y2: H - padB, className: 'pe-hoverline' }),
                curve.map((d) =>
                  Math.abs(d[xKey] - hover[xKey]) < 1e-9
                    ? h('circle', { cx: x(d[xKey]), cy: y(d[series[0].key]), r: 3.5, className: 'pe-hoverdot' })
                    : null,
                ),
              )
            : null,
          /* optimal / suggested marker */
          markerIdx >= 0
            ? h(
                'g',
                null,
                h('line', {
                  x1: x(curve[markerIdx][xKey]), x2: x(curve[markerIdx][xKey]),
                  y1: y(yLo), y2: y(yHi), className: 'pe-markerline',
                }),
                h('circle', { cx: x(curve[markerIdx][xKey]), cy: y(curve[markerIdx][series[0].key]), r: 4.5, className: 'pe-markerdot' }),
              )
            : null,
          /* axes */
          yTicks.map((tv, i) =>
            h(
              'text',
              { key: `yt${i}`, x: padL - 6, y: y(tv) + 3.5, className: 'pe-tick' },
              fmtTick(tv, series[0].tickKind || 'money', zh),
            ),
          ),
          xTicks.map((tv, i) =>
            h('text', { key: `xt${i}`, x: x(tv), y: H - padB + 14, className: 'pe-tick', textAnchor: 'middle' }, String(Math.round(tv))),
          ),
        ),
        /* legend + tooltip */
        h(
          'div',
          { className: 'pe-chart-meta' },
          series.map((s) =>
            h(
              'span',
              { key: s.key, className: 'pe-legend' },
              h('i', { className: 'pe-legend-dot', style: { background: s.color || SERIES_COLORS[s.key] } }),
              s.label,
            ),
          ),
          hover
            ? h(
                'span',
                { className: 'pe-tooltip' },
                `${xKey === 'p' ? (zh ? '价' : 'P') : ''} ${hover[xKey]}`,
                series.map((s) => ` · ${s.label.split(' ')[0]} ${fmtNum(hover[s.key])}`).join(''),
              )
            : markerLabel
              ? h('span', { className: 'pe-tooltip' }, markerLabel)
              : null,
        ),
      );
    }

    /** Horizontal range bar: break-even → scan max, green zone = reasonable range. */
    function RangeBar(props) {
      const { be, lo, hi, max, suggested, zh } = props;
      const span = Math.max(max - be, 1e-9);
      const left = (v) => Math.max(0, Math.min(100, ((v - be) / span) * 100));
      return h(
        'div',
        { className: 'pe-range' },
        h('div', { className: 'pe-range-track' },
          h('div', { className: 'pe-range-good', style: { left: left(lo) + '%', width: Math.max(0, left(hi) - left(lo)) + '%' } }),
          suggested != null
            ? h('div', { className: 'pe-range-suggest', style: { left: left(suggested) + '%' }, title: `${zh ? '建议价' : 'Suggested'} ${suggested}` })
            : null,
        ),
        h('div', { className: 'pe-range-labels' },
          h('span', null, (zh ? '保本 ' : 'BE ') + be),
          suggested != null ? h('span', { className: 'pe-range-suggest-label' }, (zh ? '建议价 ' : 'Suggested ') + suggested) : null,
          h('span', null, (zh ? '上限 ' : 'Max ') + max),
        ),
      );
    }

    /* ======================== form controls ============================ */

    function Field(props) {
      const { label, hint, value, onChange, error, suffix, min, max, step } = props;
      return h(
        'label',
        { className: 'pe-field' + (error ? ' pe-field-err' : '') },
        h('span', { className: 'pe-field-label' }, label),
        h(
          'span',
          { className: 'pe-field-input-wrap' },
          h('input', {
            className: 'pe-input',
            type: 'number',
            value,
            min,
            max,
            step: step || 'any',
            inputMode: 'decimal',
            onChange: (e) => onChange(e.target.value),
          }),
          suffix ? h('span', { className: 'pe-field-suffix' }, suffix) : null,
        ),
        hint ? h('span', { className: 'pe-field-hint' }, hint) : null,
      );
    }

    function ChipGroup(props) {
      const { items, active, onPick, size } = props;
      return h(
        'div',
        { className: 'pe-chips' },
        items.map((it) =>
          h(
            'button',
            {
              key: it.key,
              type: 'button',
              className: 'pe-chip' + (it.key === active ? ' pe-chip-on' : '') + (size === 'sm' ? ' pe-chip-sm' : ''),
              'aria-pressed': it.key === active,
              onClick: () => onPick(it.key),
            },
            h('span', { className: 'pe-chip-emoji', 'aria-hidden': true }, it.emoji),
            h('span', { className: 'pe-chip-name' }, it.name),
          ),
        ),
      );
    }

    /* ======================== main panel =============================== */

    const DEFAULT_OFFLINE = {
      mode: 'offline',
      productType: 'drink',
      salesMode: 'retail',
      channel: 'hub',
      baseCost: '6', qty: '5000', market: '18',
      rentPerSqm: '120', area: '30', utilities: '1500',
      staff: '3', salary: '5000', laborMisc: '2000',
    };

    const DEFAULT_ONLINE = {
      mode: 'online',
      productType: 'apparel',
      salesMode: 'retail',
      channel: 'taobao',
      baseCost: '30', qty: '800', market: '99',
      shipping: '6', packing: '1.5', promo: '8000',
      staff: '1', salary: '6000', laborMisc: '3000',
    };

    const DEFAULT_BY_MODE = { offline: DEFAULT_OFFLINE, online: DEFAULT_ONLINE };

    /** Shared view state: survives panel switches within a page load. */
    const formStore = {
      state: { offline: { ...DEFAULT_OFFLINE }, online: { ...DEFAULT_ONLINE }, mode: 'offline', psy: 'nice' },
      listeners: new Set(),
      subscribe(fn) {
        this.listeners.add(fn);
        return () => this.listeners.delete(fn);
      },
      get() {
        return this.state;
      },
      set(updater) {
        const next = typeof updater === 'function' ? updater(this.state) : updater;
        this.state = { ...this.state, ...next };
        this.listeners.forEach((fn) => fn());
      },
    };

    function useFormState() {
      const [state, setState] = useState(formStore.get());
      useEffect(() => formStore.subscribe(setState), []);
      return state;
    }

    function PricingPanel({ t, locale }) {
      const st = useFormState();
      const [, forceLocale] = useState(0);
      useEffect(() => {
        if (!locale) return undefined;
        forceLocale((x) => x + 1);
        return locale.subscribe(() => forceLocale((x) => x + 1));
      }, [locale]);

      const zh = useMemo(() => {
        const cur = (locale && typeof locale.get === 'function' ? locale.get() : null) || 'en';
        return String(cur).toLowerCase().startsWith('zh');
      }, [locale, forceLocale]);

      const mode = st.mode === 'online' ? 'online' : 'offline';
      const form = st[mode];
      const setMode = (m) => formStore.set({ mode: m });
      const set = (k) => (v) => formStore.set({ [mode]: { ...formStore.get()[mode], [k]: v } });

      const result = useMemo(() => computePricing(form), [form]);

      const typeItems = Object.entries(PRODUCT_TYPES).map(([key, v]) => ({
        key, emoji: v.emoji, name: zh ? v.nameZh : v.nameEn,
      }));
      const channelItems = Object.entries(mode === 'offline' ? OFFLINE_CHANNELS : ONLINE_CHANNELS).map(([key, v]) => ({
        key, emoji: v.emoji, name: zh ? v.nameZh : v.nameEn,
      }));
      const salesItems = Object.entries(SALES_MODES).map(([key, v]) => ({
        key, emoji: v.emoji, name: zh ? v.nameZh : v.nameEn,
      }));

      const errorSet = new Set(result.errors);

      const autoMarket = () => {
        const c = Math.max(1, Number(form.baseCost) || 1);
        const pt = PRODUCT_TYPES[form.productType] || PRODUCT_TYPES.retail;
        formStore.set({ [mode]: { ...formStore.get()[mode], market: String(Math.round(c * pt.markup * 10) / 10) } });
      };

      const loadSample = () => formStore.set({ [mode]: { ...DEFAULT_BY_MODE[mode], mode } });
      const resetAll = () => formStore.set({ offline: { ...DEFAULT_OFFLINE }, online: { ...DEFAULT_ONLINE }, mode: 'offline', psy: 'nice' });

      /* KPI rows */
      const s = result.suggested;
      const sPrice = s ? s.p : 0;
      const kpis = [
        { key: 'kpiPrice', label: t('kpiPrice'), value: s ? fmtMoney(sPrice, zh) : '—', sub: zh ? '单件' : 'per unit', icon: '🏷️', tone: 'brand' },
        { key: 'kpiProfit', label: t('kpiProfit'), value: s ? fmtMoney(s.profit, zh) : '—', sub: zh ? '月' : '/mo', icon: '💰', tone: s && s.profit >= 0 ? 'good' : 'bad' },
        { key: 'kpiRevenue', label: t('kpiRevenue'), value: s ? fmtMoney(s.revenue, zh) : '—', sub: zh ? '月' : '/mo', icon: '📈', tone: 'plain' },
        { key: 'kpiQty', label: t('kpiQty'), value: s ? fmtNum(s.q) : '—', sub: zh ? '件 / 月' : 'units/mo', icon: '🛍️', tone: 'plain' },
        { key: 'kpiMargin', label: t('kpiMargin'), value: s ? fmtPct((sPrice - result.resolved.unitCost - sPrice * result.resolved.feeRate / 100) / sPrice) : '—', sub: zh ? '扣除平台佣金' : 'after fees', icon: '📊', tone: 'plain' },
        { key: 'kpiBe', label: t('kpiBreakEven'), value: Number.isFinite(result.breakEven.qty) ? fmtNum(result.breakEven.qty) : '∞', sub: zh ? '件 / 月' : 'units/mo', icon: '⚖️', tone: 'plain' },
      ];

      const rows = [];
      if (result.breakEven) rows.push({ label: t('detailRowBePrice'), d: { p: result.breakEven.price, q: result.resolved.baseQty, revenue: Math.round(result.breakEven.price * result.resolved.baseQty), profit: 0 }, cls: 'pe-row-be' });
      if (result.optimal) rows.push({ label: t('detailRowOptimal'), d: { p: result.optimal.p, q: result.optimal.q, revenue: result.optimal.revenue, profit: result.optimal.profit }, cls: '' });
      if (s) rows.push({ label: t('detailRowPsych'), d: { p: s.p, q: s.q, revenue: s.revenue, profit: s.profit }, cls: 'pe-row-suggest' });
      if (s) {
        const hi = s.p * 1.05;
        const lo = s.p * 0.95;
        const r = result.resolved;
        const effUnit = r.unitCost;
        const fee = r.feeRate / 100;
        const calc = (p) => {
          const ratio = Math.min(2.2, Math.max(0.02, 1 - r.elastic * (p - r.basePrice) / r.basePrice));
          const q = r.baseQty * ratio;
          const rev = q * p;
          return { q: Math.round(q), revenue: Math.round(rev), profit: Math.round(rev - q * effUnit - q * p * fee - r.fixedCost) };
        };
        rows.push({ label: t('detailRowHigh'), d: { p: round2(hi), ...calc(hi) }, cls: '' });
        rows.push({ label: t('detailRowLow'), d: { p: round2(lo), ...calc(lo) }, cls: '' });
      }
      if (result.breakEven) rows.push({ label: t('detailRowBeQty'), d: { p: sPrice, q: result.breakEven.qty, revenue: Math.round(result.breakEven.qty * sPrice), profit: 0 }, cls: 'pe-row-be' });

      return h(
        'div',
        { className: 'pe-root' },
        h('style', null, CSS),

        /* ---------- header + mode switch ---------- */
        h(
          'header',
          { className: 'pe-header' },
          h('div', { className: 'pe-head' },
            h('h1', { className: 'pe-title' }, t('panelTitle')),
            h('div', { className: 'pe-subtitle' }, zh ? '线上 / 线下 · 实时计算 · 收益最大化' : 'Online / offline · live calculation · profit maximized'),
          ),
          h(
            'div',
            { className: 'pe-modes', role: 'group', 'aria-label': t('panelTitle') },
            h(
              'button',
              {
                type: 'button',
                className: 'pe-mode' + (mode === 'offline' ? ' pe-mode-on' : ''),
                'aria-pressed': mode === 'offline',
                onClick: () => setMode('offline'),
                title: t('modeHintOffline'),
              },
              h(ModeIcon, { kind: 'offline' }),
              h('span', null, t('modeOffline')),
            ),
            h(
              'button',
              {
                type: 'button',
                className: 'pe-mode' + (mode === 'online' ? ' pe-mode-on' : ''),
                'aria-pressed': mode === 'online',
                onClick: () => setMode('online'),
                title: t('modeHintOnline'),
              },
              h(ModeIcon, { kind: 'online' }),
              h('span', null, t('modeOnline')),
            ),
          ),
        ),

        /* ---------- business profile ---------- */
        h(
          'section',
          { className: 'pe-section' },
          h('h2', { className: 'pe-sec-title' }, t('productType')),
          h(ChipGroup, { items: typeItems, active: form.productType, onPick: set('productType') }),
          h('h2', { className: 'pe-sec-title' }, t('salesMode')),
          h(ChipGroup, { items: salesItems, active: form.salesMode, onPick: set('salesMode'), size: 'sm' }),
          h('h2', { className: 'pe-sec-title' }, t('channel')),
          h(ChipGroup, { items: channelItems, active: form.channel, onPick: set('channel'), size: 'sm' }),
        ),

        /* ---------- cost inputs ---------- */
        h(
          'section',
          { className: 'pe-section' },
          h('h2', { className: 'pe-sec-title' }, t('costs')),
          h(
            'div',
            { className: 'pe-fields' },
            h(Field, { label: t('unitCost'), hint: t('unitCostHint'), value: form.baseCost, onChange: set('baseCost'), suffix: '¥', error: errorSet.has('errCost') }),
            h(Field, { label: t('monthlyQty'), hint: t('monthlyQtyHint'), value: form.qty, onChange: set('qty'), suffix: zh ? '件/月' : '/mo', error: errorSet.has('errQty') }),
            h(
              'label',
              { className: 'pe-field' + (errorSet.has('errMarket') ? ' pe-field-err' : '') },
              h('span', { className: 'pe-field-label' }, t('marketPrice')),
              h(
                'span',
                { className: 'pe-field-input-wrap' },
                h('input', {
                  className: 'pe-input',
                  type: 'number',
                  value: form.market,
                  min: 0,
                  step: 'any',
                  inputMode: 'decimal',
                  onChange: (e) => set('market')(e.target.value),
                }),
                h('button', { type: 'button', className: 'pe-mini-btn', onClick: autoMarket }, t('autoFill')),
                h('span', { className: 'pe-field-suffix' }, '¥'),
              ),
              h('span', { className: 'pe-field-hint' }, t('marketPriceHint')),
            ),
            mode === 'offline'
              ? h(Field, { label: t('rentPerSqm'), hint: t('rentPerSqmHint'), value: form.rentPerSqm, onChange: set('rentPerSqm'), suffix: '¥/㎡', error: errorSet.has('errRent') })
              : h(Field, { label: t('shipping'), hint: t('shippingHint'), value: form.shipping, onChange: set('shipping'), suffix: '¥' }),
            mode === 'offline'
              ? h(Field, { label: t('area'), hint: t('areaHint'), value: form.area, onChange: set('area'), suffix: '㎡', error: errorSet.has('errRent') })
              : h(Field, { label: t('packing'), hint: t('packingHint'), value: form.packing, onChange: set('packing'), suffix: '¥' }),
            mode === 'offline'
              ? h(Field, { label: t('utilities'), hint: t('utilitiesHint'), value: form.utilities, onChange: set('utilities'), suffix: '¥' })
              : h(Field, { label: t('promo'), hint: t('promoHint'), value: form.promo, onChange: set('promo'), suffix: '¥' }),
            h(Field, { label: mode === 'offline' ? t('staff') : t('staffOnline'), hint: mode === 'offline' ? t('staffHint') : t('staffOnlineHint'), value: form.staff, onChange: set('staff'), suffix: zh ? '人' : 'ppl' }),
            h(Field, { label: mode === 'offline' ? t('salary') : t('salaryOnline'), hint: mode === 'offline' ? t('salaryHint') : t('salaryOnlineHint'), value: form.salary, onChange: set('salary'), suffix: '¥' }),
            h(Field, { label: t('laborMisc'), hint: t('laborMiscHint'), value: form.laborMisc, onChange: set('laborMisc'), suffix: '¥' }),
          ),
          mode === 'offline'
            ? h('div', { className: 'pe-note' },
                t('rentSummary') + ' ' + fmtMoney(Math.max(0, (Number(form.rentPerSqm) || 0) * (Number(form.area) || 0)), zh),
                ' · ' + t('fixedCost') + ' ' + fmtMoney(result.resolved.fixedCost, zh) + ' · ' + (zh ? '需求弹性 ' : 'elasticity ') + result.resolved.elastic)
            : h('div', { className: 'pe-note' },
                t('fixedCost') + ' ' + fmtMoney(result.resolved.fixedCost, zh) + ' · ' + (zh ? '平台佣金+支付 ' : 'fees ') + fmtPct(result.resolved.feeRate / 100) + ' · ' + (zh ? '需求弹性 ' : 'elasticity ') + result.resolved.elastic),
        ),

        /* ---------- results ---------- */
        h(
          'section',
          { className: 'pe-section' },
          h(
            'div',
            { className: 'pe-sec-head' },
            h('h2', { className: 'pe-sec-title' }, t('results')),
            h(
              'div',
              { className: 'pe-actions' },
              h('button', { type: 'button', className: 'pe-btn', onClick: loadSample }, t('loadSample')),
              h('button', { type: 'button', className: 'pe-btn', onClick: resetAll }, t('reset')),
            ),
          ),
          result.warnings.map((w, i) => h('div', { key: `w${i}`, className: 'pe-warn' }, '⚠️ ' + t(w))),
          h(
            'div',
            { className: 'pe-kpis' },
            kpis.map((k) =>
              h(
                'div',
                { key: k.key, className: 'pe-kpi pe-kpi-' + k.tone },
                h('span', { className: 'pe-kpi-icon', 'aria-hidden': true }, k.icon),
                h('span', { className: 'pe-kpi-label' }, k.label),
                h('span', { className: 'pe-kpi-value' }, k.value),
                h('span', { className: 'pe-kpi-sub' }, k.sub),
              ),
            ),
          ),
          result.range
            ? h(
                'div',
                { className: 'pe-block' },
                h('div', { className: 'pe-block-title' }, t('rangeTitle')),
                h(RangeBar, {
                  be: result.breakEven.price, lo: result.range.lo, hi: result.range.hi,
                  max: result.scan.max, suggested: sPrice, zh,
                }),
                h('div', { className: 'pe-range-note' }, t('rangeNote')),
              )
            : null,
          result.ok && result.curve.length
            ? h(
                'div',
                { className: 'pe-block' },
                h('div', { className: 'pe-block-title' }, t('chartQty')),
                h(LineChart, {
                  curve: result.curve, xKey: 'p',
                  series: [{ key: 'q', label: t('axisQty'), color: SERIES_COLORS.q, area: true, tickKind: 'qty' }],
                  height: 190, zh,
                  marker: sPrice,
                  markerLabel: (zh ? '建议价 ' : 'Suggested ') + fmtMoney(sPrice, zh),
                }),
              )
            : null,
          result.ok && result.curve.length
            ? h(
                'div',
                { className: 'pe-block' },
                h('div', { className: 'pe-block-title' }, t('chartProfit')),
                h(LineChart, {
                  curve: result.curve, xKey: 'p',
                  series: [{ key: 'profit', label: t('axisProfit'), color: SERIES_COLORS.profit, area: true, tickKind: 'money' }],
                  height: 190, zh, zeroLine: true,
                  marker: sPrice,
                  markerLabel: (zh ? '建议价 ' : 'Suggested ') + fmtMoney(sPrice, zh) + ' · ' + (zh ? '月利润 ' : 'profit ') + fmtMoney(s ? s.profit : 0, zh),
                }),
              )
            : null,
          h(
            'div',
            { className: 'pe-block' },
            h('div', { className: 'pe-block-title' }, t('detailTitle')),
            h(
              'div',
              { className: 'pe-table-wrap' },
              h(
                'table',
                { className: 'pe-table' },
                h(
                  'thead',
                  null,
                  h('tr', null,
                    h('th', null, ''),
                    h('th', { className: 'pe-num' }, t('detailPrice')),
                    h('th', { className: 'pe-num' }, t('detailQty')),
                    h('th', { className: 'pe-num' }, t('detailRevenue')),
                    h('th', { className: 'pe-num' }, t('detailProfit')),
                  ),
                ),
                h(
                  'tbody',
                  null,
                  rows.map((r, i) =>
                    h(
                      'tr',
                      { key: `r${i}`, className: r.cls },
                      h('td', null, r.label),
                      h('td', { className: 'pe-num' }, fmtMoney(r.d.p, zh)),
                      h('td', { className: 'pe-num' }, fmtNum(r.d.q)),
                      h('td', { className: 'pe-num' }, fmtMoney(r.d.revenue, zh)),
                      h('td', { className: 'pe-num' }, fmtMoney(r.d.profit, zh)),
                    ),
                  ),
                ),
              ),
            ),
            h(
              'details',
              { className: 'pe-steps' },
              h('summary', null, t('stepTitle')),
              h('div', null, t('stepBody')),
            ),
          ),
        ),
      );
    }

    function ModeIcon(props) {
      const size = 16;
      const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true,
        stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };
      if (props.kind === 'offline') {
        return h('svg', common,
          h('path', { d: 'M3.5 9.5 5 8l1.5 1.5L8 8l1.5 1.5L11 8l1.5 1.5L14 8l1.5 1.5L17 8l1.5 1.5L20 8l.5 1.5' }),
          h('path', { d: 'M4 11.5V20h16v-8.5' }),
          h('path', { d: 'M9.5 20v-4.5h5V20' }),
        );
      }
      return h('svg', common,
        h('circle', { cx: 12, cy: 12, r: 8.5 }),
        h('path', { d: 'M3.8 12h16.4' }),
        h('path', { d: 'M12 3.5c2.3 2.3 3.4 5.1 3.4 8.5s-1.1 6.2-3.4 8.5c-2.3-2.3-3.4-5.1-3.4-8.5S9.7 5.8 12 3.5z' }),
      );
    }

    function SidebarIcon(props) {
      const size = (props && props.size) || 24;
      return h(
        'svg',
        { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true },
        h(
          'g',
          { stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' },
          h('path', { d: 'M4.5 7.5h10' }),
          h('path', { d: 'M6.5 7.5v-3h6v3' }),
          h('path', { d: 'M7 7.5 5.6 12h8.8L13 7.5' }),
          h('circle', { cx: 7.2, cy: 15.5, r: 1.4 }),
          h('circle', { cx: 12.8, cy: 15.5, r: 1.4 }),
          h('path', { d: 'M8.6 15.5h2.8' }),
          h('path', { d: 'M7.2 16.9v2.2M12.8 16.9v2.2' }),
          h('path', { d: 'M17.5 4.5v3.2M15.9 6.1h3.2' }),
          h('path', { d: 'M17.5 8.2v2.6M16.2 9.5h2.6M17.5 11.2V13M16.4 12.1h2.2' }),
        ),
      );
    }

    /* ============================= styles ============================== */

    const CSS = `
.pe-root{display:flex;flex-direction:column;height:100%;min-height:0;box-sizing:border-box;
  background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);
  overflow-y:auto;padding:0 16px 24px;}
.pe-header{display:flex;align-items:center;gap:12px;padding:14px 0 10px;border-bottom:1px solid var(--dsw-alias-border-l1);flex:0 0 auto;}
.pe-head{flex:1 1 auto;min-width:0;}
.pe-title{font-size:17px;font-weight:650;margin:0;line-height:1.3;}
.pe-subtitle{font-size:12px;color:var(--dsw-alias-label-secondary);margin-top:2px;}
.pe-modes{display:flex;border:1px solid var(--dsw-alias-border-l2);border-radius:9px;overflow:hidden;flex:0 0 auto;}
.pe-mode{appearance:none;display:flex;align-items:center;gap:6px;border:0;margin:0;padding:7px 13px;
  font-size:12.5px;line-height:1.4;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-secondary);
  cursor:pointer;font-family:inherit;}
.pe-mode+.pe-mode{border-left:1px solid var(--dsw-alias-border-l2);}
.pe-mode.pe-mode-on{background:var(--dsw-alias-brand-primary);color:#fff;}
.pe-section{padding-top:12px;}
.pe-sec-title{font-size:12px;font-weight:600;color:var(--dsw-alias-label-secondary);text-transform:uppercase;letter-spacing:.04em;margin:12px 0 7px;}
.pe-sec-head{display:flex;align-items:center;justify-content:space-between;gap:8px;}
.pe-sec-head .pe-sec-title{margin-top:0;}
.pe-actions{display:flex;gap:6px;flex:0 0 auto;}
.pe-btn{appearance:none;border:1px solid var(--dsw-alias-border-l2);border-radius:7px;background:var(--dsw-alias-bg-layer-1);
  color:var(--dsw-alias-label-primary);font-size:12px;line-height:1.4;padding:4px 10px;cursor:pointer;font-family:inherit;}
.pe-btn:hover{border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-brand-primary);}
.pe-mini-btn{appearance:none;border:1px solid var(--dsw-alias-border-l2);border-radius:6px;background:var(--dsw-alias-bg-layer-2);
  color:var(--dsw-alias-label-secondary);font-size:11.5px;padding:3px 7px;cursor:pointer;font-family:inherit;flex:0 0 auto;}
.pe-mini-btn:hover{color:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary);}
.pe-chips{display:flex;flex-wrap:wrap;gap:6px;}
.pe-chip{appearance:none;display:flex;align-items:center;gap:6px;border:1px solid var(--dsw-alias-border-l2);
  border-radius:8px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);
  padding:6px 10px;font-size:12.5px;cursor:pointer;font-family:inherit;line-height:1.35;}
.pe-chip-sm{padding:4px 8px;font-size:12px;}
.pe-chip:hover{border-color:var(--dsw-alias-brand-primary);}
.pe-chip-on{border-color:var(--dsw-alias-brand-primary);background:var(--dsw-alias-bg-layer-2);box-shadow:inset 0 0 0 1px var(--dsw-alias-brand-primary);}
.pe-chip-emoji{font-size:15px;line-height:1;}
.pe-fields{display:grid;grid-template-columns:repeat(auto-fill,minmax(168px,1fr));gap:10px 12px;}
.pe-field{display:flex;flex-direction:column;gap:4px;min-width:0;}
.pe-field-label{font-size:12px;color:var(--dsw-alias-label-secondary);}
.pe-field-input-wrap{display:flex;align-items:center;gap:6px;border:1px solid var(--dsw-alias-border-l2);
  border-radius:7px;background:var(--dsw-alias-bg-layer-1);padding:0 8px;height:30px;}
.pe-field-input-wrap:focus-within{border-color:var(--dsw-alias-brand-primary);}
.pe-field-err .pe-field-input-wrap{border-color:#d95f83;}
.pe-input{flex:1 1 auto;min-width:0;border:0;outline:0;background:transparent;color:var(--dsw-alias-label-primary);
  font-size:13px;font-family:inherit;padding:0;height:100%;}
.pe-field-suffix{font-size:11.5px;color:var(--dsw-alias-label-secondary);flex:0 0 auto;}
.pe-field-hint{font-size:11px;color:var(--dsw-alias-label-secondary);opacity:.85;line-height:1.35;}
.pe-note{margin-top:10px;font-size:12px;color:var(--dsw-alias-label-secondary);
  background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l1);border-radius:8px;padding:7px 10px;line-height:1.5;}
.pe-warn{margin-top:8px;font-size:12px;line-height:1.5;color:#c9a13c;background:var(--dsw-alias-bg-layer-1);
  border:1px solid var(--dsw-alias-border-l1);border-left:3px solid #c9a13c;border-radius:8px;padding:7px 10px;}
.pe-kpis{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;margin-top:12px;}
.pe-kpi{display:flex;flex-direction:column;gap:2px;border:1px solid var(--dsw-alias-border-l1);border-radius:10px;
  background:var(--dsw-alias-bg-layer-1);padding:10px 12px;min-width:0;}
.pe-kpi-brand{border-color:var(--dsw-alias-brand-primary);background:linear-gradient(180deg,var(--dsw-alias-bg-layer-2),var(--dsw-alias-bg-layer-1));}
.pe-kpi-good .pe-kpi-value{color:#41a977;}
.pe-kpi-bad .pe-kpi-value{color:#d95f83;}
.pe-kpi-icon{font-size:16px;}
.pe-kpi-label{font-size:11.5px;color:var(--dsw-alias-label-secondary);}
.pe-kpi-value{font-size:19px;font-weight:700;line-height:1.2;color:var(--dsw-alias-label-primary);font-variant-numeric:tabular-nums;}
.pe-kpi-sub{font-size:11px;color:var(--dsw-alias-label-secondary);}
.pe-block{margin-top:14px;}
.pe-block-title{font-size:13px;font-weight:600;margin-bottom:6px;}
.pe-chart-wrap{border:1px solid var(--dsw-alias-border-l1);border-radius:10px;background:var(--dsw-alias-bg-layer-1);padding:8px 8px 6px;}
.pe-chart{display:block;width:100%;height:auto;}
.pe-grid{stroke:var(--dsw-alias-border-l1);stroke-width:1;shape-rendering:crispEdges;}
.pe-zero{stroke:var(--dsw-alias-label-secondary);stroke-width:1.2;stroke-dasharray:4 3;opacity:.7;}
.pe-line{fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;}
.pe-area{fill-opacity:.14;stroke:none;}
.pe-hoverline{stroke:var(--dsw-alias-label-secondary);stroke-width:1;stroke-dasharray:3 3;}
.pe-hoverdot{fill:#4f8ef7;stroke:#fff;stroke-width:1.5;}
.pe-markerline{stroke:var(--dsw-alias-brand-primary);stroke-width:1.4;stroke-dasharray:4 3;opacity:.9;}
.pe-markerdot{fill:var(--dsw-alias-brand-primary);stroke:#fff;stroke-width:2;}
.pe-tick{fill:var(--dsw-alias-label-secondary);font-size:10px;font-family:inherit;}
.pe-chart-meta{display:flex;align-items:center;gap:12px;font-size:11.5px;color:var(--dsw-alias-label-secondary);padding:2px 4px 4px;min-height:20px;flex-wrap:wrap;}
.pe-legend{display:inline-flex;align-items:center;gap:5px;}
.pe-legend-dot{width:9px;height:9px;border-radius:50%;display:inline-block;}
.pe-tooltip{font-variant-numeric:tabular-nums;}
.pe-range{margin-top:4px;}
.pe-range-track{position:relative;height:14px;border-radius:7px;background:var(--dsw-alias-bg-layer-2);
  border:1px solid var(--dsw-alias-border-l1);overflow:visible;}
.pe-range-good{position:absolute;top:2px;bottom:2px;border-radius:4px;background:linear-gradient(90deg,#2f9e6e,#41a977);opacity:.85;}
.pe-range-suggest{position:absolute;top:-4px;bottom:-4px;width:3px;border-radius:2px;background:var(--dsw-alias-brand-primary);}
.pe-range-labels{display:flex;justify-content:space-between;font-size:11px;color:var(--dsw-alias-label-secondary);margin-top:5px;font-variant-numeric:tabular-nums;}
.pe-range-suggest-label{color:var(--dsw-alias-brand-primary);font-weight:600;}
.pe-range-note{margin-top:5px;font-size:11.5px;color:var(--dsw-alias-label-secondary);}
.pe-table-wrap{overflow-x:auto;border:1px solid var(--dsw-alias-border-l1);border-radius:10px;background:var(--dsw-alias-bg-layer-1);}
.pe-table{border-collapse:collapse;width:100%;font-size:12.5px;min-width:440px;}
.pe-table th,.pe-table td{padding:6px 10px;text-align:left;border-bottom:1px solid var(--dsw-alias-border-l1);white-space:nowrap;}
.pe-table th{color:var(--dsw-alias-label-secondary);font-weight:600;font-size:11.5px;}
.pe-table tr:last-child td{border-bottom:0;}
.pe-table .pe-num{text-align:right;font-variant-numeric:tabular-nums;}
.pe-row-suggest td{background:var(--dsw-alias-bg-layer-2);font-weight:600;}
.pe-row-suggest td:first-child{color:var(--dsw-alias-brand-primary);}
.pe-row-be td{color:var(--dsw-alias-label-secondary);}
.pe-steps{margin-top:10px;font-size:12px;color:var(--dsw-alias-label-secondary);line-height:1.55;}
.pe-steps summary{cursor:pointer;font-weight:600;color:var(--dsw-alias-label-primary);}
@media (max-width:560px){
  .pe-header{flex-direction:column;align-items:stretch;}
  .pe-modes{align-self:flex-start;}
  .pe-kpis{grid-template-columns:repeat(auto-fill,minmax(120px,1fr));}
}
`;

    /* ========================== registration =========================== */

    return {
      inject: ['slots'],
      apply(ctx) {
        const { t, locale, dispose } = installLocale(ctx);
        ctx.effect(() => dispose);

        ctx.slots.inject('sidebar.panellist', () =>
          ctx.slots.register(
            { name: 'sidebar.panellist', id: 'pricing-evaluator', order: 30, label: () => t('sidebarLabel') },
            SidebarIcon,
          ),
        );
        ctx.slots.inject('main', () =>
          ctx.slots.register(
            { name: 'main', key: 'pricing-evaluator' },
            (props) => h(PricingPanel, { ...props, t, locale }),
          ),
        );
      },
      /* exposed for node-side engine tests */
      __test: { computePricing, PRODUCT_TYPES, OFFLINE_CHANNELS, ONLINE_CHANNELS, SALES_MODES },
    };
  },
});
