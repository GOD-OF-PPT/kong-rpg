# 三角色 × 两模式 · 连续通关截图检查

六组均已连续完成十五关。所有结果来自当前 Vite 生产构建 12.4.1，同一随机种子 LOTUS-1025。

|角色|模式|结果|游戏内用时|受伤次数|计分击杀|结算生命|截图|
|---|---|---|---|---:|---|---:|---|
|孙悟空|普通旅程|十五关通关 · A|11分6秒|33|110/110|140|[查看结算](E:/githome/kong-rpg/evidence/clear-matrix-20261031/wukong-normal-attempt3/victory.png)|
|孙悟空|挑战·五界重劫|十五关通关 · A|11分28秒|37|155/155|140|[查看结算](E:/githome/kong-rpg/evidence/clear-matrix-20261031/wukong-challenge-attempt2/victory.png)|
|哪吒|普通旅程|十五关通关 · A|7分32秒|27|110/110|52|[查看结算](E:/githome/kong-rpg/evidence/clear-matrix-20261031/nezha-normal-attempt1/victory.png)|
|哪吒|挑战·五界重劫|十五关通关 · A|7分25秒|29|155/155|140|[查看结算](E:/githome/kong-rpg/evidence/clear-matrix-20261031/nezha-challenge-attempt3/victory.png)|
|杨戬|普通旅程|十五关通关 · A|8分46秒|23|110/110|106|[查看结算](E:/githome/kong-rpg/evidence/clear-matrix-20261031/erlang-normal-attempt3/victory.png)|
|杨戬|挑战·五界重劫|十五关通关 · A|10分16秒|38|155/155|132|[查看结算](E:/githome/kong-rpg/evidence/clear-matrix-20261031/erlang-challenge-attempt1/victory.png)|

每个通过组合均核对：从第 1 关新建旅程、15 个关卡进入记录、15 名守关者击败、`completed=[0..14]`、最终 `won` 结算、导出存档与原始 runId 一致。截图、逐关生命、输入记录、奖励选择与事件保存在各组合目录。

## 截图

### 孙悟空

![两种模式结算](E:/githome/kong-rpg/evidence/clear-matrix-20261031/sheets/wukong.png)

### 哪吒

![两种模式结算](E:/githome/kong-rpg/evidence/clear-matrix-20261031/sheets/nezha.png)

### 杨戬

![两种模式结算](E:/githome/kong-rpg/evidence/clear-matrix-20261031/sheets/erlang.png)

## 验证方式与边界

- 使用实际键鼠操作走完关卡与奖励菜单，没有修改生命、伤害、敌人状态或角色坐标，没有导入中途关卡。六局从第 1 关开始，各自保留全部 15 关截图与五场大 Boss 战截图。
- 这是读取游戏状态辅助寻路、躲招的自动化通关验证；托塔天王剑招/火轮会在本地状态副本上预测动作后发送真实按键。它证明通关链路可走通，不等同于普通玩家难度评价。
- 用 Playwright 时钟运行全部定时器、RAF 和生产固定步长模拟，以缩短自动化等待；表中为游戏内计时，不作为真实性能数据。
- 挑战模式通过已有 12.1.2 普通 S 通关存档公开导入解锁，资格源为 [原始通关记录](E:/githome/kong-rpg/evidence/mechanics-recheck-v12/nezha-http/playthrough.json)。旧成绩只用于解锁入口，不计入本轮六组结果；本轮没有重新证明普通 S 解锁流程。
- 只覆盖本次种子与桌面网络构建，未声称穷尽所有随机种子、移动端和离线包。
- 早期失败和自动化时钟初始化失败均保留在 attempts 列表。失败后从第 1 关重跑，没有续改失败存档来取得胜利。此次只新增/调整测试工具，游戏规则与美术未改。

[逐关截图图库](E:/githome/kong-rpg/evidence/clear-matrix-20261031/index.html) · [机器可读结果及交叉验证](E:/githome/kong-rpg/evidence/clear-matrix-20261031/matrix.json) · [构建身份](E:/githome/kong-rpg/evidence/clear-matrix-20261031/identity.json)
