const modules = {
  data: {
    title: "数据层：四张原始表到底提供了什么",
    plain:
      "数据层不是一个抽象概念，而是这次 demo 从 数据(1).zip 解出的四张 Excel 表。它们是系统能回答营销问题的事实边界：商品、分类、订单明细、订单。",
    facts: [
      "原始目录：data/raw/wechat-data-2026-06/数据",
      "SKU 表：500 行，67 列",
      "分类表：358 行，20 列",
      "订单明细表：200 行，41 列",
      "订单表：200 行，71 列"
    ],
    details: [
      {
        label: "第 1 步：确认原始业务表",
        items: [
          "先从 数据(1).zip 解出四张表：SKU、商品分类、订单明细、订单。",
          "SKU 表描述“有什么商品、多少钱、库存多少、毛利怎么样”。",
          "订单明细表描述“每笔订单买了哪些商品、买了几件、商品金额和券抵扣是多少”。",
          "订单表描述“订单是否支付、用什么支付、什么时候下单、收货区域大概在哪里”。"
        ]
      },
      {
        label: "第 2 步：挑出营销分析需要的字段",
        items: [
          "SKU：id、goods_id、goods_name、price、supply_price、quantity、market_enable、profit_rate。",
          "分类：id、name、parent_id、level。",
          "订单明细：order_sn、trade_sn、category_id、goods_name、num、goods_price、flow_price、cash_coupon_price。",
          "订单：sn、trade_sn、goods_price、flow_price、cash_coupon_price、pay_status、order_status、payment_method、create_time、consignee_address_path。",
          "这些字段刚好能支持品类、商品、优惠、库存、区域和活动建议。"
        ]
      },
      {
        label: "第 3 步：先划出不能暴露的字段",
        items: [
          "consignee_name、consignee_detail、member_id、use_card_no、receivable_no。",
          "verification_code、verification_card_id、store_address_mobile。",
          "这些字段即使原始 Excel 里存在，也不会进入指标文件和知识块文件。",
          "这一步是后面隐私降级和策略拒答的基础。"
        ]
      },
      {
        label: "第 4 步：把数据交给构建层继续加工",
        items: [
          "数据层本身不直接回答问题，它只定义“有哪些原始事实”和“哪些事实不能暴露”。",
          "构建层接手后，才会做清洗、分类映射、指标计算、隐私降级和 JSON 存储。",
          "所以智能体最终看到的不是原始 Excel，而是构建层生成的安全知识资产。"
        ]
      }
    ],
    example: `原始订单字段示意：
{
  "sn": "订单号",
  "goods_price": 87.10,
  "flow_price": 5.11,
  "cash_coupon_price": 81.99,
  "pay_status": "PAID",
  "consignee_address_path": "湖北省,武汉市,武昌区"
}

处理后只暴露为：
{
  "districts": [{"name": "武昌区", "order_count": 70}],
  "privacy": "不输出收货人姓名、详细地址、会员 ID、卡号"
}`,
    deep:
      "数据层的核心不是“有四个表”这么简单，而是先定义智能体可见事实和不可见事实。可见事实是聚合后的经营信息，不可见事实是能指向个人或真实账户动作的字段。这个边界决定后面的可信机制能不能成立。",
    talk:
      "答辩时可以说：我没有把 Excel 原表直接暴露给模型，而是把四张表当作事实来源。系统只让后续层看到营销所需的聚合指标和知识块，个人信息字段被排除。"
  },
  builder: {
    title: "构建层：Excel 怎么变成指标和知识块",
    plain:
      "构建层由 scripts/build_demo_data.py 完成。它读取四张 .xls，做字段标准化、分类映射、金额清洗、聚合统计、隐私过滤，然后写出可被后端直接加载的 JSON 文件。",
    facts: [
      "构建脚本：scripts/build_demo_data.py",
      "指标产物：data/processed/demo_metrics.json",
      "知识产物：knowledge_base/demo_chunks.json",
      "版本清单：knowledge_base/manifest.json",
      "回归样例：examples/regression_questions.jsonl"
    ],
    details: [
      {
        label: "第 1 步：做基础数据清洗",
        items: [
          "用 pandas + xlrd 读取 .xls；这是离线构建依赖，后端运行时不依赖 pandas。",
          "金额字段统一转成数字并保留两位小数，例如 goods_price、flow_price、cash_coupon_price、price、supply_price。",
          "数量字段先补空值，再转成整数，例如 num、quantity。",
          "商品名会做长度压缩，避免一个超长商品名撑爆知识块和前端展示。"
        ]
      },
      {
        label: "第 2 步：用分类表翻译 category_id",
        items: [
          "先从商品分类表生成 id -> name 的映射。",
          "再把订单明细里的 category_id 翻译成 category_name。",
          "例如原来只能看到 category_id=某个编号，处理后可以看到“食用油”“抽纸卷纸”“米面制品”。",
          "这一步让数据支持按品类聚合，也让后续回答能说业务语言，而不是说编号。"
        ]
      },
      {
        label: "第 3 步：基于清洗后的数据计算指标",
        items: [
          "总览：SKU 数、分类数、订单数、明细数、已支付/未支付、GMV、实付、券抵扣、券覆盖率。",
          "品类和商品：按订单明细里的商品金额、件数、订单数生成 top_categories 和 top_products。",
          "优惠：计算现金券/卡券抵扣总额、券覆盖率、平均订单商品金额、平均订单实付。",
          "库存和毛利：找低库存商品 low_stock，也找高毛利候选 high_margin，给活动选品提供依据。"
        ]
      },
      {
        label: "第 4 步：做隐私降级",
        items: [
          "订单表里有收货区域路径，但构建层只提取区县级聚合。",
          "例如只输出“武昌区 70 单、洪山区 31 单”，不输出收货人姓名和详细地址。",
          "敏感字段列表写进 manifest，前端和智能体只看到聚合后的经营信息。",
          "这一步让系统既能回答区域营销问题，又不暴露个人信息。"
        ]
      },
      {
        label: "第 5 步：生成并存储构建产物",
        items: [
          "demo_metrics.json 存结构化指标，给 /api/metrics 和回答模板使用。",
          "demo_chunks.json 存 7 个可检索知识块：overview、categories、products、coupons、regions、inventory、policy。",
          "manifest.json 存源文件、行数、派生文件、版本、隐私规则，是可审计清单。",
          "这些文件都是 JSON，后端运行时直接加载 JSON，不再读取原始 Excel。"
        ]
      }
    ],
    example: `demo_metrics.json 片段：
{
  "overview": {
    "sku_count": 500,
    "order_count": 200,
    "gmv": 17419.7,
    "paid_amount": 1022.8,
    "coupon_amount": 16396.9,
    "coupon_coverage_rate": 0.965
  },
  "top_categories": [
    {"name": "仟吉", "gmv": 1849.0, "order_count": 11},
    {"name": "食用油", "gmv": 1727.4, "order_count": 15}
  ]
}

demo_chunks.json 片段：
{
  "chunk_id": "metrics.coupons",
  "title": "优惠与补贴洞察",
  "tags": ["优惠券", "补贴", "实付", "价格"]
}`,
    deep:
      "构建层相当于把 raw data 做成一个小型数据产品。它解决三件事：第一，后端启动时不再依赖 Excel 解析；第二，检索对象从复杂表格变成短知识块；第三，每个派生产物都有 manifest 可回查来源和版本。",
    talk:
      "答辩时可以说：这里不是简单 ETL，而是把原始表加工成“指标 JSON + 可检索知识块 + 版本清单”。后端只读取这些稳定产物，所以运行简单、可解释、可复现。"
  },
  memory: {
    title: "记忆层：哪些会记住，哪些不会记住",
    plain:
      "当前 demo 把记忆分成三类：短期对话记忆、长期项目知识、单次运行记忆。三者存储位置和生命周期不同，不能混在一起讲。",
    facts: [
      "短期记忆：请求体 history，最多取最近 3 条用户消息参与检索",
      "长期记忆：knowledge_base/demo_chunks.json 和 manifest.json",
      "指标记忆：data/processed/demo_metrics.json",
      "运行记忆：每次 /api/chat 响应中的 trace，不落盘"
    ],
    details: [
      {
        label: "第 1 步：接收当前请求里的短期上下文",
        items: [
          "输入来自 AgentRequest.history。",
          "prepare_retrieval_query 只拼接最近 3 条 role=user 的内容。",
          "作用是让“继续刚才的优惠券问题”这类追问能命中相关知识块。"
        ]
      },
      {
        label: "第 2 步：读取项目长期事实",
        items: [
          "长期事实不是数据库画像，而是版本化知识文件。",
          "demo_chunks.json 负责检索，demo_metrics.json 负责精确数值和回答模板。",
          "manifest.json 说明这些事实来自哪四张表、各有多少行、当前版本是什么。"
        ]
      },
      {
        label: "第 3 步：生成本次运行记忆",
        items: [
          "每次请求生成 request_id、run_id、intent、workflow、config_versions、steps。",
          "trace 跟随响应返回给前端，方便演示和审计。",
          "当前 demo 不把 trace 写入数据库；如果要做生产化，可扩展为日志表或对象存储。"
        ]
      },
      {
        label: "第 4 步：保持三类记忆边界清楚",
        items: [
          "短期记忆帮助当前问题，不长期保存用户输入。",
          "长期记忆只保存项目事实，便于回归和版本控制。",
          "运行记忆解释一次回答怎么来的，降低黑盒感。"
        ]
      }
    ],
    example: `检索查询实际拼接方式：
history[-3:] 中的用户消息
+ 当前 message

trace 片段：
{
  "request_id": "...",
  "run_id": "...",
  "config_versions": {
    "knowledge_manifest": "2026-06-29",
    "policy": "marketing-demo-policy-v1",
    "runtime": "stdlib-backend-v1"
  }
}`,
    deep:
      "记忆不是越多越好。这个 demo 选择可解释的最小记忆模型：对话历史只影响检索，不修改知识库；知识库只由构建脚本生成；运行轨迹只解释当次执行。这种边界很适合教学和答辩。",
    talk:
      "答辩时可以说：我把记忆拆开了。history 是当前请求上下文，chunks 是项目长期事实，trace 是一次运行的审计记录。每类记忆都有明确输入、用途和生命周期。"
  },
  api: {
    title: "接口层：前端和后端怎么约定输入输出",
    plain:
      "接口层由 backend/server.py 提供，基于 Python 标准库 ThreadingHTTPServer。前端不读文件、不跑智能体逻辑，只调用 HTTP API。",
    facts: [
      "GET /api/health：服务和版本状态",
      "GET /api/metrics：读取 demo_metrics.json",
      "POST /api/chat：主智能体问答",
      "POST /api/retrieval/debug：只看检索证据块",
      "POST /api/regression：跑固定问题集"
    ],
    details: [
      {
        label: "第 1 步：前端发起标准请求",
        items: [
          "message：用户问题，必填。",
          "history：历史消息数组，可选，用于短期记忆。",
          "metadata：request_id、run_id 等可选追踪字段。"
        ]
      },
      {
        label: "第 2 步：后端校验并调用智能体",
        items: [
          "server.py 解析 JSON，检查 message 是否为空。",
          "如果是 /api/chat，就调用 run_agent。",
          "如果是 /api/retrieval/debug，就只跑检索调试，不生成完整营销建议。"
        ]
      },
      {
        label: "第 3 步：返回可解释响应",
        items: [
          "answer：给用户看的回答或拒答说明。",
          "mode：answer 或 refusal。",
          "intent：campaign_plan、product_analysis、coupon_analysis、region_analysis、inventory_analysis 等。",
          "sources：命中的知识块，包含 chunk_id、title、score、content。",
          "trace：pipeline 每一步的输出。",
          "metadata.llm：记录本次生成是 llm、template_fallback 还是 policy refusal。"
        ]
      },
      {
        label: "第 4 步：前端按字段展示",
        items: [
          "answer 放到主回答区。",
          "sources 放到证据区。",
          "trace 放到执行轨迹区。",
          "metrics 和 regression 通过各自接口展示。"
        ]
      },
      {
        label: "第 5 步：保持接口边界",
        items: [
          "接口层不包含 LangChain、Dify、Coze、LangGraph 适配器。",
          "接口层不直接暴露 data/raw 下的 Excel。",
          "静态页面也由同一个后端服务托管，方便演示一键启动。"
        ]
      }
    ],
    example: `POST /api/chat
{
  "message": "优惠券使用情况说明了什么？",
  "history": [],
  "metadata": {"request_id": "demo-1"}
}

Response 核心结构：
{
  "answer": "...",
  "mode": "answer",
  "intent": "coupon_analysis",
  "sources": [{"chunk_id": "metrics.coupons", "score": 5.5}],
  "trace": {"steps": [...]}
}`,
    deep:
      "接口层的价值是把智能体能力做成稳定契约。只要 /api/chat 的输入输出稳定，前端、回归测试、以后可能接入的移动端或企业系统都不需要知道内部 pipeline 怎么写。",
    talk:
      "答辩时可以说：接口返回的不是单纯字符串，而是可解释对象。answer 负责展示，sources 负责证据，trace 负责过程审计。"
  },
  agent: {
    title: "智能体流程：自写 pipeline + DeepSeek 生成",
    plain:
      "这个智能体不是外部框架编排的多 Agent，而是 backend/agent.py 里一条确定的 pipeline：准备检索查询、意图识别、检索、策略判断、DeepSeek 生成回答、构建 trace、返回响应。",
    facts: [
      "入口函数：run_agent(message, history, metadata)",
      "检索函数：retrieve(message, top_k=4)",
      "策略函数：policy_check(message)",
      "LLM 生成：deepseek-v4-flash",
      "回退生成：本地模板答案",
      "追踪函数：build_trace(...)"
    ],
    details: [
      {
        label: "1. 准备检索查询",
        items: [
          "输入：当前 message + history 最近 3 条用户消息。",
          "处理：拼接成 retrieval_query。",
          "输出：用于检索的文本，trace 记录 query_chars。"
        ]
      },
      {
        label: "2. 意图识别",
        items: [
          "输入：当前 message。",
          "处理：用 INTENT_KEYWORDS 做关键词打分。",
          "输出：campaign_plan、product_analysis、coupon_analysis、region_analysis、inventory_analysis 或 general_marketing_qa。"
        ]
      },
      {
        label: "3. 检索知识块",
        items: [
          "输入：retrieval_query。",
          "处理：中文 1-2 字 token + 英文数字 token，计算 query 和 chunk 的重叠，加 tag_bonus。",
          "输出：最多 4 个 RetrievedChunk；如果没有命中，兜底返回 metrics.overview 和 policy.boundary。"
        ]
      },
      {
        label: "4. 策略守卫",
        items: [
          "输入：当前 message。",
          "处理：匹配自动投放、付费广告、导出客户姓名、详细地址、会员 ID、卡号等拒答关键词。",
          "输出：allowed/action/reason/message。allowed=false 时直接走 refusal。"
        ]
      },
      {
        label: "5. 回答生成",
        items: [
          "输入：intent、sources、demo_metrics.json。",
          "处理：先把用户问题、经营指标摘要、检索证据和安全边界组织成提示词，再调用 deepseek-v4-flash。",
          "如果 DeepSeek 未配置或调用失败，才回退到本地模板，并在 trace 里标记 template_fallback。",
          "输出：answer 字符串；生成用 LLM，但流程、检索、策略和 trace 仍然是自己写的。"
        ]
      }
    ],
    example: `一次正常问题的 pipeline 输出：
{
  "intent": "campaign_plan",
  "workflow": "rag_qa",
  "sources": ["metrics.categories", "metrics.products", "metrics.coupons"],
  "trace.steps": [
    "prepare_retrieval_query",
    "run_retrieval",
    "apply_policy",
    "generate_answer",
    "build_response"
  ]
}

一次越界问题：
mode = "refusal"
policy.action = "refuse"`,
    deep:
      "这个 pipeline 的好处是每一步都能单独解释和替换。现在真实 LLM 只接在生成环节，检索、策略、sources、trace、接口契约仍然由本项目控制，所以不是把系统交给外部 Agent 框架。",
    talk:
      "答辩时可以说：我自己实现了智能体运行时，DeepSeek 只负责根据已检索证据生成更自然的回答。系统仍然能解释检索到了什么、策略怎么判断、模型是否调用成功。"
  },
  trust: {
    title: "可信机制：为什么不是随便编",
    plain:
      "可信不是靠回答语气，而是靠来源、版本、边界、拒答、trace 和回归验证共同保证。这个 demo 的每个回答都可以追到知识块和处理步骤。",
    facts: [
      "sources：每次回答返回命中的 chunk 内容",
      "manifest：记录源文件、行数、版本和隐私规则",
      "policy：越界请求先拦截再拒答",
      "llm metadata：记录 DeepSeek 调用或模板回退",
      "trace：记录 pipeline steps 和配置版本",
      "regression：固定 5 个问题验证 answer/refusal 路径"
    ],
    details: [
      {
        label: "第 1 步：先让答案带来源",
        items: [
          "每个 source 有 source、title、chunk_id、score、content。",
          "前端展示 sources，让用户看到答案依据，而不是只看最终话术。",
          "知识块来自构建脚本，不是临时编造。"
        ]
      },
      {
        label: "第 2 步：用 manifest 固定数据版本",
        items: [
          "manifest version 当前是 2026-06-29。",
          "manifest.sources 记录 sku/category/order_item/order 的源文件和行数。",
          "trace.config_versions 会返回 knowledge_manifest、policy、runtime。"
        ]
      },
      {
        label: "第 3 步：在回答前做隐私和动作边界检查",
        items: [
          "构建层显式列出 excluded_columns。",
          "policy.boundary 知识块说明不展示姓名、详细地址、会员 ID、卡号。",
          "policy_check 在回答前拦截导出客户、自动投放、真实扣费等请求。"
        ]
      },
      {
        label: "第 4 步：记录 LLM 是否真实调用",
        items: [
          "metadata.llm.mode 为 llm 时，说明本次回答来自 DeepSeek 生成。",
          "metadata.llm.model 记录模型名 deepseek-v4-flash。",
          "如果 API key 未配置、网络失败或模型异常，会标记 template_fallback，并回退本地模板。",
          "这样现场演示时可以区分“真实 LLM 回答”和“模板兜底回答”。"
        ]
      },
      {
        label: "第 5 步：用回归问题验证路径没有坏",
        items: [
          "examples/regression_questions.jsonl 固定了 5 个演示问题。",
          "/api/regression 逐个调用 run_agent，校验 expected_mode。",
          "scripts/verify_demo.py 还检查禁用框架导入和关键数据产物。"
        ]
      }
    ],
    example: `拒答请求：
"帮我直接调用账户自动投放付费广告，并导出客户姓名和详细地址。"

响应关键字段：
{
  "mode": "refusal",
  "trace": {
    "steps": [
      {"name": "apply_policy", "output": {"allowed": false, "action": "refuse"}}
    ]
  }
}`,
    deep:
      "可信机制要前置到流程里，而不是回答完再补一句“仅供参考”。这个 demo 在生成回答之前先做 policy_check，并且让 sources 和 trace 成为响应结构的一部分。",
    talk:
      "答辩时可以说：如果问我怎么防幻觉，我会指出 sources；如果问我怎么防越权，我会指出 policy；如果问我怎么复现，我会指出 manifest 和 regression。"
  },
  ui: {
    title: "前端演示层：把黑盒过程变成可看见",
    plain:
      "前端由 web/index.html、web/app.js、web/styles.css 和这个 architecture 页面组成。它的职责不是实现智能体，而是把后端返回的 answer、sources、trace、metrics、regression 展示给评审看。",
    facts: [
      "工作台入口：/index.html",
      "架构讲解：/architecture.html",
      "主交互：输入问题 -> POST /api/chat -> 渲染回答、来源、轨迹",
      "指标展示：GET /api/metrics",
      "回归按钮：POST /api/regression"
    ],
    details: [
      {
        label: "第 1 步：用户输入问题",
        items: [
          "用户在工作台输入营销问题，例如“设计社群促销活动”。",
          "前端把问题和本地 history 组装成 AgentRequest。",
          "前端不接触 raw Excel，也不自己计算指标。"
        ]
      },
      {
        label: "第 2 步：前端调用后端接口",
        items: [
          "主问答调用 /api/chat。",
          "指标看板调用 /api/metrics。",
          "检索调试调用 /api/retrieval/debug。",
          "回归验证调用 /api/regression。"
        ]
      },
      {
        label: "第 3 步：展示回答、来源和轨迹",
        items: [
          "answer 放在主回答区。",
          "sources 展示 chunk 标题、分数和内容，解释依据。",
          "trace 展示 request_id、run_id、intent、workflow、每一步输出。",
          "metrics 展示 SKU、订单、GMV、实付、券覆盖率等指标。"
        ]
      },
      {
        label: "第 4 步：用架构页辅助讲解",
        items: [
          "这页负责讲清楚每层输入、处理、输出、存储。",
          "点击架构图节点和模块按钮会切换同一个说明面板。",
          "它是答辩讲解辅助页，不替代 README 和 docs。"
        ]
      },
      {
        label: "第 5 步：让 demo 从聊天变成可解释系统",
        items: [
          "只展示 answer 会像普通聊天机器人。",
          "展示 sources 和 trace 可以证明这是一个可解释智能体 demo。",
          "评审可以现场追问某一步，页面能马上对应到数据和流程。"
        ]
      }
    ],
    example: `前端一次展示链路：
1. 用户输入问题
2. fetch("/api/chat", {message, history, metadata})
3. 渲染 response.answer
4. 展开 response.sources
5. 展开 response.trace.steps

核心原则：
前端展示能力，后端负责智能体，知识库负责事实。`,
    deep:
      "这个 demo 的前端目标是“把可解释性做成界面”。因此它不只做聊天框，还要显示来源、轨迹、指标、架构和回归。这样评审看到的是一个完整系统，而不是一段不可验证的文本输出。",
    talk:
      "答辩时可以说：前端不是核心算法，但它让核心算法可见。用户能看到回答、证据、流程和验证结果，所以系统更容易被理解和质疑。"
  }
};

const titleEl = document.querySelector("#moduleTitle");
const plainEl = document.querySelector("#modulePlain");
const factsEl = document.querySelector("#moduleFacts");
const detailsEl = document.querySelector("#moduleDetails");
const exampleEl = document.querySelector("#moduleExample");
const deepEl = document.querySelector("#moduleDeep");
const talkEl = document.querySelector("#moduleTalk");
const moduleButtons = Array.from(document.querySelectorAll("[data-module]"));

function clearChildren(element) {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

function renderFacts(facts) {
  clearChildren(factsEl);
  facts.forEach((fact) => {
    const item = document.createElement("div");
    item.className = "fact-pill";
    item.textContent = fact;
    factsEl.appendChild(item);
  });
}

function renderDetails(details) {
  clearChildren(detailsEl);
  details.forEach((group) => {
    const card = document.createElement("section");
    card.className = "detail-card";

    const heading = document.createElement("h3");
    heading.textContent = group.label;
    card.appendChild(heading);

    const list = document.createElement("ul");
    group.items.forEach((text) => {
      const item = document.createElement("li");
      item.textContent = text;
      list.appendChild(item);
    });
    card.appendChild(list);
    detailsEl.appendChild(card);
  });
}

function selectModule(key) {
  const item = modules[key];
  if (!item) return;
  titleEl.textContent = item.title;
  plainEl.textContent = item.plain;
  renderFacts(item.facts);
  renderDetails(item.details);
  exampleEl.textContent = item.example;
  deepEl.textContent = item.deep;
  talkEl.textContent = item.talk;
  moduleButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.module === key);
  });
}

moduleButtons.forEach((button) => {
  button.addEventListener("click", () => selectModule(button.dataset.module));
});

selectModule("data");
