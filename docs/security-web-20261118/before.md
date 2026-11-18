# Web Zip 安全扫描报告

扫描路径: E:\githome\kong-rpg-main-size-20261117
扫描的 HTML 文件数: 4
问题统计: 共 29 项，其中高风险 29 项，中风险 0 项，需人工复核 0 项

## 总体结论

需修复

## 高风险

### H-1 动态 HTML 赋值
- 文件: evidence/readability/baseline.html
- 行号: 440
- 证据: `innerHTML= <div class="hero"><div class="eyebrow">西游记后传 · 像素动作肉鸽</div><h1><small>大 圣</small>劫后行</h1><div class="english-title">AFTER THE BLACK LOTUS</div><p>三界灯火将熄。你还有一根棍，<br>和一个不肯认命的念头。</p><div class="actions">${button('begin','踏上劫途 <smal`
- 原因: 动态字符串进入 HTML 解析边界；该命中本身不证明可利用
- 修复: 使用受限 DOM 构造，按文本写入不可信数据

### H-2 动态 HTML 赋值
- 文件: evidence/readability/baseline.html
- 行号: 442
- 证据: `innerHTML= <section class="panel" aria-label="选择初始舍利"><div class="eyebrow">启程 · 一念成法</div><h2>带哪一念入劫？</h2><p class="subtitle">一枚舍利，一种破局之法。每过一境，还可再选一枚。<br>左右行走，长按空格跳得更高；J 棍击，K 闪避，L 分身。</p>${cards(['cloud','echo','staff'])}<p class="starter-`
- 原因: 动态字符串进入 HTML 解析边界；该命中本身不证明可利用
- 修复: 使用受限 DOM 构造，按文本写入不可信数据

### H-3 动态 HTML 赋值
- 文件: evidence/readability/baseline.html
- 行号: 445
- 证据: `innerHTML= <section class="panel" style="max-width:650px" aria-label="暂停菜单"><div class="eyebrow">暂歇 · 棍心不息</div><h2>风停在这一刻</h2><p class="subtitle">${K.STAGES[state.stage].name} · 因缘 ${esc(state.seed)}<br>${state.relics.map(id=>K.relic(id).`
- 原因: 动态字符串进入 HTML 解析边界；该命中本身不证明可利用
- 修复: 使用受限 DOM 构造，按文本写入不可信数据

### H-4 动态 HTML 赋值
- 文件: evidence/readability/baseline.html
- 行号: 446
- 证据: `innerHTML= <section class="panel" aria-label="行者手记"><div class="eyebrow">行者手记 · 看清再出手</div><h2>棍有尽处，变化无穷</h2><div class="help-grid"><div><h3>步法与落点</h3><p>A / D 或方向键移动。空格 / W 跳跃，松开缩短跳高；踩敌可反弹。腾云骨允许再按一次空格空中跳。脚下亮边才是落脚面；S＋空格可向下穿过悬台。</p></div><d`
- 原因: 动态字符串进入 HTML 解析边界；该命中本身不证明可利用
- 修复: 使用受限 DOM 构造，按文本写入不可信数据

### H-5 动态 HTML 赋值
- 文件: evidence/readability/baseline.html
- 行号: 447
- 证据: `innerHTML= <section class="panel" aria-label="过境奖励"><div class="eyebrow">第${['一','二','三'][state.stage]}境已破 · 舍利余光</div><h2>下一程，如何破局？</h2><p class="subtitle">山门将启。生命恢复 18，定力恢复 20。选一枚舍利带往${K.STAGES[state.stage+1].name}。</p>${cards(state.rewa`
- 原因: 动态字符串进入 HTML 解析边界；该命中本身不证明可利用
- 修复: 使用受限 DOM 构造，按文本写入不可信数据

### H-6 动态 HTML 赋值
- 文件: evidence/readability/baseline.html
- 行号: 449
- 证据: `innerHTML= <section class="panel" style="max-width:720px" aria-label="${won?'胜利结算':'失败结算'}"><div class="eyebrow">${won?'黑莲已散 · 此心长明':'劫途未尽 · 再起一念'}</div><h2>${won?'三界重见微光':'此身暂歇，棍心未折'}</h2><p class="subtitle">${won?'无天的黑莲散作尘埃。你握紧金箍棒，走向重新亮起`
- 原因: 动态字符串进入 HTML 解析边界；该命中本身不证明可利用
- 修复: 使用受限 DOM 构造，按文本写入不可信数据

### H-7 动态 HTML 赋值
- 文件: release/index.html
- 行号: 3852
- 证据: `innerHTML = <div class="hero"> <div class="eyebrow">西游记后传 · 像素横版动作肉鸽</div> <h1><small>大 圣</small>劫后行</h1> <div class="english-title">AFTER THE BLACK LOTUS · 法天象地</div> <p>劈、立、戳三势随心易换；定身、铜头、群猿神通破局。<br>碎雷火、淬金箍、斩心魔六耳，直面无天六臂灭世法相。</p> <div clas`
- 原因: 动态字符串进入 HTML 解析边界；该命中本身不证明可利用
- 修复: 使用受限 DOM 构造，按文本写入不可信数据

### H-8 动态 HTML 赋值
- 文件: release/index.html
- 行号: 3886
- 证据: `innerHTML = panel('开篇', '序 · 法天象地', '三界的灯，还没有熄', <p class="story-copy">无天的黑莲遮住灵山，暗河古镜里更映出心魔六耳猕猴的凶芒。<br><br>你是孙悟空。按 <b>Q</b> 在「劈棍、立棍、戳棍」三势间行云流水，按 <b>F</b> 一字定身、按 <b>C</b> 铜头震岳、按 <b>L</b> 拔毛唤群猿；<br>收集灵蕴于神龛重铸金箍棒，叩开黑莲法界，轰碎无天六臂灭世元神！</p> <div cl`
- 原因: 动态字符串进入 HTML 解析边界；该命中本身不证明可利用
- 修复: 使用受限 DOM 构造，按文本写入不可信数据

### H-9 动态 HTML 赋值
- 文件: release/index.html
- 行号: 3923
- 证据: `innerHTML = panel('选择初始舍利', '启程 · 一念成法', '带哪一念入劫？', <p class="subtitle">开局自带「劈/立/戳」三棍势 (Q) 与「定身 (F) · 铜头 (C) · 群猿 (L)」三大神通。<br>舍利可结成法相共鸣，击败古镜心魔更可开启第四枚本命舍利槽！</p> ${cards(picks, [])} <p class="starter-note">1 / 2 / 3 选择 · Q 切三势 · J 棍击 · U 耗势`
- 原因: 动态字符串进入 HTML 解析边界；该命中本身不证明可利用
- 修复: 使用受限 DOM 构造，按文本写入不可信数据

### H-10 动态 HTML 赋值
- 文件: release/index.html
- 行号: 3969
- 证据: `innerHTML = panel('淬棒神龛', '神龛 · 三昧真火重铸', '金箍淬炼炉', <p class="subtitle">当前持有灵蕴：<b style="color:#ffe388;font-size:15px">${ess}</b> · 当前棍法伤害倍率：<b>${Math.round(K.forgeMult(state) * 100)}%</b> · 生命上限：<b>${state.player.maxHp || 100}</b></p> ${gri`
- 原因: 动态字符串进入 HTML 解析边界；该命中本身不证明可利用
- 修复: 使用受限 DOM 构造，按文本写入不可信数据

### H-11 动态 HTML 赋值
- 文件: release/index.html
- 行号: 3988
- 证据: `innerHTML = panel('暂停菜单', '暂歇 · 风停此刻', '此行尚未结束', <p class="subtitle">${K.STAGES[state.stage].name} · 当前棍势：${st.name} · 灵蕴 ${state.essence || 0}<br>随身舍利 (${state.relics.length}/${state.maxRelics || 3})：${state.relics.map(id => K.relic(id).n`
- 原因: 动态字符串进入 HTML 解析边界；该命中本身不证明可利用
- 修复: 使用受限 DOM 构造，按文本写入不可信数据

### H-12 动态 HTML 赋值
- 文件: release/index.html
- 行号: 4021
- 证据: `innerHTML = panel('行者手记', '手记 · 三势神通破万劫', '棍有尽处，变化无穷', <div class="help-grid"> <div><h3>心猿三棍势与易势连携</h3><p>按 Q 随时切换「劈棍势（赤金裂地）」「立棍势（撑棍腾空避地面杀招）」「戳棍势（超远距离退寸进尺）」。出棍后紧接 Q 可触发 360°「易势闪击」；满棍势按 U 释放当前流派绝技！</p></div> <div><h3>三大本命神通</h3><p>F「定身法」锁住群`
- 原因: 动态字符串进入 HTML 解析边界；该命中本身不证明可利用
- 修复: 使用受限 DOM 构造，按文本写入不可信数据

### H-13 动态 HTML 赋值
- 文件: release/index.html
- 行号: 4079
- 证据: `innerHTML = panel('大圣法相录', '图鉴 · 三势神通与九品圣物', '大圣法相录', <div class="codex-tabs"> <button type="button" class="tab-btn ${codexTab === 'stances' ? 'active' : ''}" data-tab="stances">三势与神通 (6)</button> <button type="button" class="tab-btn ${cod`
- 原因: 动态字符串进入 HTML 解析边界；该命中本身不证明可利用
- 修复: 使用受限 DOM 构造，按文本写入不可信数据

### H-14 动态 HTML 赋值
- 文件: release/index.html
- 行号: 4099
- 证据: `innerHTML = panel('舍利与补给', mid ? '阵眼已破 · 余灯尚温' : '此境已破 · 山门将启', mid ? '借这盏灯，调整解法' : '下一程，带哪一种解法？', <p class="subtitle">${mid ? '选择后回到原地，仍可继续探索神龛、古钟与照妖古镜。' : '将前往「' + K.STAGES[state.stage + 1].name + '」，过境恢复18生命与20定力。'}<br>生命 ${Math.ceil(st`
- 原因: 动态字符串进入 HTML 解析边界；该命中本身不证明可利用
- 修复: 使用受限 DOM 构造，按文本写入不可信数据

### H-15 动态 HTML 赋值
- 文件: release/index.html
- 行号: 4125
- 证据: `innerHTML = panel('替换舍利', '舍利已满 · 有舍有得', '以何换取' + next.name + '？', <p class="subtitle">将取得：${next.text}<br>选择一枚随身舍利放下，其余法相与生命不变；亦可返回改选借灯调息。</p> ${cards(state.relics, [])} <div class="actions">${btn('cancel-replace', '返回选择')}</div>)`
- 原因: 动态字符串进入 HTML 解析边界；该命中本身不证明可利用
- 修复: 使用受限 DOM 构造，按文本写入不可信数据

### H-16 动态 HTML 赋值
- 文件: release/index.html
- 行号: 4156
- 证据: `innerHTML = panel(won ? '胜利结算' : '失败结算', won ? '黑莲已散 · 万佛重光' : '劫途未尽 · 再起一念', won ? '三界重见微光' : '此身暂歇，棍心未折', <div class="rank-banner"> <div class="rank-info"> <b>斗战评定 · ${rk.title}</b> <span>${rk.poem}</span> </div> <div class="rank-grade">`
- 原因: 动态字符串进入 HTML 解析边界；该命中本身不证明可利用
- 修复: 使用受限 DOM 构造，按文本写入不可信数据

### H-17 动态 HTML 赋值
- 文件: release/index.html
- 行号: 4182
- 证据: `innerHTML = panel('尾声', '尾声 · 灯火人间', '前路，还有众生', <p class="story-copy">山道上的寒雾散了。古渡口的金灯，终于照见对岸归家的人。<br><br>你没有把胜利留在莲台之上。你收起金箍棒，走回那些还需要微光的地方。<br>三势神通已入本心；下一程山色，仍在等你执棍相逢。</p> <div class="actions">${btn('again', '再入因缘', true)}${btn('back-result`
- 原因: 动态字符串进入 HTML 解析边界；该命中本身不证明可利用
- 修复: 使用受限 DOM 构造，按文本写入不可信数据

### H-18 动态 HTML 赋值
- 文件: release/index.html
- 行号: 4191
- 证据: `innerHTML = panel('往昔旅程', '因缘簿 · 唯凭本心破局', '你走过的路', <div class="history-list">${meta.history.length ? meta.history.slice().reverse().map(r => <div><b>${r.won ? '破劫' : '止步' + K.STAGES[r.stage].name}${r.grade ? ' · [' + esc(r.grade) + ']' : `
- 原因: 动态字符串进入 HTML 解析边界；该命中本身不证明可利用
- 修复: 使用受限 DOM 构造，按文本写入不可信数据

### H-19 动态 HTML 赋值
- 文件: release/index.html
- 行号: 4198
- 证据: `innerHTML = panel('原版旅程', '存档保护 · 旧路仍在', '在原来的规则中继续', <p class="story-copy">v1 的地图与规则和新版不同。你的旧旅程不会被覆盖，也不会被悄悄搬到另一张地图。<br><br>${storage.legacy ? '可先下载旧档，再在打开的原版里通过「初行指南 → 导入存档」继续。' : '保留的原版可直接打开；如果你有旧 JSON 文件，请在原版的指南中导入。'}</p> <div class="ac`
- 原因: 动态字符串进入 HTML 解析边界；该命中本身不证明可利用
- 修复: 使用受限 DOM 构造，按文本写入不可信数据

### H-20 动态 HTML 赋值
- 文件: release/index.html
- 行号: 4361
- 证据: `innerHTML = 灵蕴 <b>${state.essence || 0}</b>`
- 原因: 动态字符串进入 HTML 解析边界；该命中本身不证明可利用
- 修复: 使用受限 DOM 构造，按文本写入不可信数据

### H-21 动态 HTML 赋值
- 文件: release/index.html
- 行号: 4373
- 证据: `innerHTML = state.relics.map(id => { const r = K.relic(id), awake = K.isAwakened(state, id); const iconUrl = r.icon >= 0 && K.relicIconURL ? K.relicIconURL(r.icon) : ''; return <span class="relic-chip ${awake ? 'awake' : ''}" title="${esc(`
- 原因: 动态字符串进入 HTML 解析边界；该命中本身不证明可利用
- 修复: 使用受限 DOM 构造，按文本写入不可信数据

### H-22 动态 HTML 赋值
- 文件: release/index.html
- 行号: 4379
- 证据: `innerHTML = syns.map(s => <span class="syn-pill" title="${esc(s.desc)}">✦ ${esc(s.name)}</span>).join('')`
- 原因: 动态字符串进入 HTML 解析边界；该命中本身不证明可利用
- 修复: 使用受限 DOM 构造，按文本写入不可信数据

### H-23 动态 HTML 赋值
- 文件: release/index.html
- 行号: 4447
- 证据: `innerHTML = state.effects.filter(f => f.text && f.life > 0).slice(-16).map(f => <span class="${f.kind === 'hurt' ? 'hurt' : ''} ${f.big ? 'big' : ''}" style="left:${(f.x - renderer.camera) / 960 * 100}%;top:${(f.y - (.45 - f.life) * 48) / `
- 原因: 动态字符串进入 HTML 解析边界；该命中本身不证明可利用
- 修复: 使用受限 DOM 构造，按文本写入不可信数据

### H-24 动态 HTML 赋值
- 文件: release/legacy-v1.html
- 行号: 598
- 证据: `innerHTML= <div class="hero"><div class="eyebrow">西游记后传 · 像素动作肉鸽</div><h1><small>大 圣</small>劫后行</h1><div class="english-title">AFTER THE BLACK LOTUS</div><p>三界灯火将熄。你还有一根棍，<br>和一个不肯认命的念头。</p><div class="actions">${button('begin','踏上劫途 <smal`
- 原因: 动态字符串进入 HTML 解析边界；该命中本身不证明可利用
- 修复: 使用受限 DOM 构造，按文本写入不可信数据

### H-25 动态 HTML 赋值
- 文件: release/legacy-v1.html
- 行号: 600
- 证据: `innerHTML= <section class="panel" aria-label="选择初始舍利"><div class="eyebrow">启程 · 一念成法</div><h2>带哪一念入劫？</h2><p class="subtitle">一枚舍利，一种破局之法。每过一境，还可再选一枚。<br>左右行走，长按空格跳得更高；J 棍击，K 闪避，L 分身。</p>${cards(['cloud','echo','staff'])}<p class="starter-`
- 原因: 动态字符串进入 HTML 解析边界；该命中本身不证明可利用
- 修复: 使用受限 DOM 构造，按文本写入不可信数据

### H-26 动态 HTML 赋值
- 文件: release/legacy-v1.html
- 行号: 603
- 证据: `innerHTML= <section class="panel" style="max-width:650px" aria-label="暂停菜单"><div class="eyebrow">暂歇 · 棍心不息</div><h2>风停在这一刻</h2><p class="subtitle">${K.STAGES[state.stage].name} · 因缘 ${esc(state.seed)}<br>${state.relics.map(id=>K.relic(id).`
- 原因: 动态字符串进入 HTML 解析边界；该命中本身不证明可利用
- 修复: 使用受限 DOM 构造，按文本写入不可信数据

### H-27 动态 HTML 赋值
- 文件: release/legacy-v1.html
- 行号: 604
- 证据: `innerHTML= <section class="panel" aria-label="行者手记"><div class="eyebrow">行者手记 · 看清再出手</div><h2>棍有尽处，变化无穷</h2><div class="help-grid"><div><h3>步法与落点</h3><p>A / D 或方向键移动。空格 / W 跳跃，松开缩短跳高；踩敌可反弹。腾云骨允许再按一次空格空中跳。脚下亮边才是落脚面；S＋空格可向下穿过悬台。</p></div><d`
- 原因: 动态字符串进入 HTML 解析边界；该命中本身不证明可利用
- 修复: 使用受限 DOM 构造，按文本写入不可信数据

### H-28 动态 HTML 赋值
- 文件: release/legacy-v1.html
- 行号: 605
- 证据: `innerHTML= <section class="panel" aria-label="过境奖励"><div class="eyebrow">第${['一','二','三'][state.stage]}境已破 · 舍利余光</div><h2>下一程，如何破局？</h2><p class="subtitle">山门将启。生命恢复 18，定力恢复 20。选一枚舍利带往${K.STAGES[state.stage+1].name}。</p>${cards(state.rewa`
- 原因: 动态字符串进入 HTML 解析边界；该命中本身不证明可利用
- 修复: 使用受限 DOM 构造，按文本写入不可信数据

### H-29 动态 HTML 赋值
- 文件: release/legacy-v1.html
- 行号: 607
- 证据: `innerHTML= <section class="panel" style="max-width:720px" aria-label="${won?'胜利结算':'失败结算'}"><div class="eyebrow">${won?'黑莲已散 · 此心长明':'劫途未尽 · 再起一念'}</div><h2>${won?'三界重见微光':'此身暂歇，棍心未折'}</h2><p class="subtitle">${won?'无天的黑莲散作尘埃。你握紧金箍棒，走向重新亮起`
- 原因: 动态字符串进入 HTML 解析边界；该命中本身不证明可利用
- 修复: 使用受限 DOM 构造，按文本写入不可信数据


## 中风险

无。

## 需人工复核

无。

## 建议修复顺序

1. 先修复高风险问题。
2. 再修复或说明中风险问题。
3. 最后复核无法可靠解析的内容。

## 备注

按技能默认排除目录扫描；未启动服务、页面或浏览器，未访问外部脚本 URL。
tools/serve.cjs 是可选的静态文件预览工具；release/index.html 可直接离线打开，不依赖包内后端。
本次仅对路径、HTML、HTM 和支持的 Vite 配置进行静态扫描，不能证明不存在所有安全漏洞。
