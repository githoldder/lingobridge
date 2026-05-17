# Azure Speech Service TTS Provider — 平台集成 Spike 报告

> **项目**: LingoBridge 中文教学平台
> **调研主题**: Azure Speech Service TTS Provider 集成方案
> **日期**: 2026-05-17
> **状态**: 调研完成

---

## 1. 执行摘要

Azure Speech Service 是目前市场上中文 TTS 能力最全面的云服务之一，提供 50+ 个中文（普通话）Neural Voice、10+ 个方言/口音 Voice，以及 Dragon HD / HD Flash / HD Omni 三代高质量语音模型。免费层（F0）每月提供 50 万字符额度，付费层按 $15/百万字符（全球）或 ¥95.4/百万字符（中国区）计费。SSML 支持完整，包括风格控制、停顿、多角色对话等高级功能。对于 LingoBridge 中文教学场景，Azure Speech 在语音质量、方言覆盖、SSML 精细控制方面均满足需求，建议采用「Redis 缓存 + 用量日志 + 配额保护」的三层架构进行集成。

---

## 2. TTS 能力矩阵

### 2.1 中文语音列表（zh-CN 普通话）

| 语音名称 | 性别 | 类型 | 风格/角色 | 质量评分 | 推荐场景 |
|---|---|---|---|---|---|
| `zh-CN-XiaoxiaoNeural` | 女 | Neural | chat, audiobook | ⭐⭐⭐⭐⭐ | 通用教学、对话 |
| `zh-CN-YunxiNeural` | 男 | Neural | chat, audiobook | ⭐⭐⭐⭐⭐ | 通用教学、对话 |
| `zh-CN-XiaoyiNeural` | 女 | Neural | chat, audiobook | ⭐⭐⭐⭐ | 儿童教学 |
| `zh-CN-YunjianNeural` | 男 | Neural | 无 | ⭐⭐⭐⭐ | 新闻播报 |
| `zh-CN-YunyangNeural` | 男 | Neural | 无 | ⭐⭐⭐⭐ | 有声书 |
| `zh-CN-XiaochenNeural` | 女 | Neural | chat, podcast | ⭐⭐⭐⭐ | 播客式教学 |
| `zh-CN-XiaohanNeural` | 女 | Neural | audiobook, narration | ⭐⭐⭐⭐ | 故事朗读 |
| `zh-CN-XiaoshuangNeural` | 女(童) | Neural | chat | ⭐⭐⭐⭐ | 儿童内容 |
| `zh-CN-XiaoyouNeural` | 女(童) | Neural | chat | ⭐⭐⭐⭐ | 儿童内容 |
| `zh-CN-Xiaoxiao:DragonHDFlashLatestNeural` | 女 | HD Flash | angry, chat, cheerful, customer-service, excited, fearful, sad, voice-assistant | ⭐⭐⭐⭐⭐+ | 高质量教学 |
| `zh-CN-Xiaoxiao2:DragonHDFlashLatestNeural` | 女 | HD Flash | affectionate, angry, anxious, cheerful, curious, disappointed, empathetic, encouraging, excited, fearful, guilty, lonely, poetry-reading, sad, sentimental, sorry, story, surprised, tired, whispering | ⭐⭐⭐⭐⭐+ | 情感丰富教学 |
| `zh-CN-Xiaochen:DragonHDFlashLatestNeural` | 女 | HD Flash | cheerful, debating, empathetic, live-commercial, poetry-reading, sad, sorry | ⭐⭐⭐⭐⭐+ | 辩论/诗歌 |
| `zh-CN-Yunxi:DragonHDFlashLatestNeural` | 男 | HD Flash | angry, chat, cheerful, complaining, depressed, fearful, news, sad, shy, strict, voice-assistant | ⭐⭐⭐⭐⭐+ | 多场景教学 |
| `zh-CN-Xiaochen:DragonHDLatestNeural` | 女 | Dragon HD | 无 | ⭐⭐⭐⭐⭐+ | 播客/对话 |
| `zh-CN-Yunfan:DragonHDLatestNeural` | 男 | Dragon HD | 无 | ⭐⭐⭐⭐⭐+ | 播客/对话 |

> **质量评分说明**: ⭐⭐⭐⭐ = 标准 Neural 质量（MOS ~4.2+）；⭐⭐⭐⭐⭐+ = HD/HD Flash 质量（MOS ~4.5+，接近真人）

### 2.2 中文方言/口音语音

| Locale | 语言 | 语音 | 备注 |
|---|---|---|---|
| `zh-CN-GUANGXI` | 广西口音普通话 | `zh-CN-guangxi-YunqiNeural` (男) | 方言教学 |
| `zh-CN-henan` | 中原官话河南 | `zh-CN-henan-YundengNeural` (男) | 方言教学 |
| `zh-CN-liaoning` | 东北官话 | `zh-CN-liaoning-XiaobeiNeural` (女), `zh-CN-liaoning-YunbiaoNeural` (男) | 方言教学 |
| `zh-CN-shaanxi` | 中原官话陕西 | `zh-CN-shaanxi-XiaoniNeural` (女) | 方言教学 |
| `zh-CN-shandong` | 冀鲁官话山东 | `zh-CN-shandong-YunxiangNeural` (男) | 方言教学 |
| `zh-CN-sichuan` | 西南官话四川 | `zh-CN-sichuan-YunxiNeural` (男) | 方言教学 |
| `zh-HK` | 粤语(繁体) | `zh-HK-HiuGaaiNeural` (女), `zh-HK-HiuMaanNeural` (女), `zh-HK-WanLungNeural` (男) | 粤语教学 |
| `zh-TW` | 台湾普通话(繁体) | `zh-TW-HsiaoChenNeural` (女), `zh-TW-YunJheNeural` (男), `zh-TW-HsiaoYuNeural` (女) | 台湾教学 |
| `wuu-CN` | 吴语(简体) | `wuu-CN-XiaotongNeural` (女), `wuu-CN-YunzheNeural` (男) | 吴语教学 |
| `yue-CN` | 粤语(简体) | `yue-CN-XiaoMinNeural` (女), `yue-CN-YunSongNeural` (男) | 粤语教学 |

### 2.3 特殊 Voice — XiaoxiaoDialects

`zh-CN-XiaoxiaoDialectsNeural` 是一个「万能方言」Voice，通过 SSML `<lang>` 标签可切换至以下方言：
`zh-CN-shaanxi`, `zh-CN-sichuan`, `zh-CN-shanxi`, `zh-CN-anhui`, `zh-CN-hunan`, `zh-CN-gansu`, `zh-CN-shandong`, `zh-CN-henan`, `zh-CN-liaoning`, `zh-TW`, `nan-CN`, `yue-CN`, `wuu-CN`

### 2.4 SSML 支持矩阵

| SSML 元素 | Neural Voice | Dragon HD | Dragon HD Omni | HD Flash |
|---|---|---|---|---|
| `<voice>` | ✅ | ✅ | ✅ | ✅ |
| `<mstts:express-as>` (风格) | ✅ (部分) | ❌ | ✅ | ✅ |
| `<prosody>` (音调/语速/音量) | ✅ | ❌ | ❌ | ❌ |
| `<break>` / `<mstts:silence>` | ✅ | ✅ (break) | ❌ | ❌ |
| `<lang>` (多语言切换) | ✅ | ✅ | ✅ | ✅ |
| `<phoneme>` (发音) | ✅ | ✅ | ❌ | ❌ |
| `<say-as>` (数字/日期) | ✅ | ✅ | ✅ | ✅ |
| `<sub>` (别名) | ✅ | ✅ | ✅ | ✅ |
| `<p>` / `<s>` (段落/句子) | ✅ | ✅ | ✅ | ✅ |
| `<mstts:backgroundaudio>` | ✅ | ❌ | ❌ | ❌ |
| `parameters` (temperature 等) | ❌ | ✅ | ✅ | ❌ |

> **关键发现**: HD/HD Flash Voice 不支持 `<prosody>` 和 `<break>`，但内置自动情感检测和语调调节。Neural Voice 支持完整 SSML 但需要手动调节。

---

## 3. 缓存架构设计

### 3.1 为什么需要缓存

- TTS 按字符计费，相同文本重复调用会产生不必要费用
- 教学平台中大量内容（词汇发音、例句、指令）是重复的
- Azure 官方文档确认：**缓存生成的音频是被允许的**，无 tier 差异限制

### 3.2 缓存键设计

```
缓存键 = SHA256(voice_name + text + output_format + rate + style + silence_config)
```

```python
import hashlib
import json

def build_tts_cache_key(voice: str, text: str, output_format: str = "audio-24khz-48kbitrate-mono-mp3",
                         rate: str = "+0%", style: str = None, silence_config: dict = None) -> str:
    """
    构建 TTS 缓存键，确保相同参数的请求命中同一缓存。
    """
    key_data = {
        "voice": voice,
        "text": text.strip(),          # 去除首尾空白
        "format": output_format,
        "rate": rate,
        "style": style,
        "silence": silence_config,
    }
    key_str = json.dumps(key_data, ensure_ascii=False, sort_keys=True)
    return f"tts:{hashlib.sha256(key_str.encode('utf-8')).hexdigest()[:16]}"
```

### 3.3 缓存架构

```
┌─────────────┐     缓存命中      ┌──────────────┐
│  LingoBridge │ ────────────────▶ │  返回缓存音频 │
│   Backend    │                  └──────────────┘
└──────┬──────┘
       │ 缓存未命中
       ▼
┌──────────────┐     合成请求      ┌──────────────────┐
│  TTS Service │ ────────────────▶ │  Azure Speech    │
│  (Provider)  │                   │  TTS API         │
└──────┬───────┘                   └──────────────────┘
       │
       │ 写入缓存 (TTL + LRU)
       ▼
┌──────────────┐
│  Redis / S3  │
│  (持久化存储) │
└──────────────┘
```

### 3.4 缓存策略伪代码

```python
class TTSCacheManager:
    """
    两级缓存：
    - L1: 内存缓存 (LRU, 热数据, TTL=1h)
    - L2: Redis/S3 (持久化, TTL=30d)
    """

    def get_or_synthesize(self, voice, text, **kwargs) -> AudioStream:
        cache_key = build_tts_cache_key(voice, text, **kwargs)

        # L1: 内存缓存
        audio = self.l1_cache.get(cache_key)
        if audio:
            self.metrics.record("cache_l1_hit")
            return audio

        # L2: Redis 缓存
        audio = self.l2_cache.get(cache_key)
        if audio:
            self.l1_cache.set(cache_key, audio, ttl=3600)
            self.metrics.record("cache_l2_hit")
            return audio

        # 缓存未命中 → 调用 Azure TTS
        audio = self.azure_tts.synthesize(voice, text, **kwargs)

        # 写入两级缓存
        self.l1_cache.set(cache_key, audio, ttl=3600)
        self.l2_cache.set(cache_key, audio, ttl=2592000)  # 30 天

        self.metrics.record("cache_miss")
        self.usage_logger.log_synthesis(voice, text, len(text), cache_key)

        return audio

    def invalidate(self, voice: str = None, text_pattern: str = None):
        """支持按 voice 或文本模式批量失效缓存"""
        if voice:
            self.l2_cache.delete_pattern(f"tts:*:{voice}:*")
        if text_pattern:
            # 需要额外的文本索引映射
            pass
```

### 3.5 缓存失效策略

| 策略 | 触发条件 | 操作 |
|---|---|---|
| TTL 过期 | 热数据 1h / 持久数据 30d | 自动过期 |
| 内容更新 | 教学文本被编辑 | 主动失效该文本的缓存键 |
| Voice 升级 | 切换到 HD Voice | 旧 voice 缓存保留（不失效），新 voice 新建缓存 |
| 容量上限 | Redis 内存达 80% | LRU 淘汰最久未使用 |
| 手动清理 | 管理员操作 | 按课程/单元批量清理 |

---

## 4. 用量日志方案

### 4.1 日志数据模型

```python
@dataclass
class TTSSynthesisLog:
    timestamp: datetime          # 调用时间 (UTC)
    request_id: str              # 唯一请求 ID
    voice: str                   # 使用的语音
    text: str                    # 输入文本（截断至 500 字符）
    char_count: int              # 计费字符数（中文×2）
    cache_hit: bool              # 是否命中缓存
    cache_level: str             # "l1" / "l2" / "miss"
    duration_ms: int             # 合成耗时
    status: str                  # "success" / "error" / "throttled"
    error_code: str | None       # 错误码 (如 429, 500)
    cost_estimate: float         # 预估成本 (USD)
    lesson_id: str | None        # 关联课程 ID
    user_id: str | None          # 触发用户 ID
```

### 4.2 日志记录伪代码

```python
class TTSUsageLogger:
    """
    记录每次 TTS 调用，支持成本追踪和异常监控。
    """

    def log_synthesis(self, log: TTSSynthesisLog):
        # 写入结构化日志 (JSON)
        logger.info("tts_synthesis", extra=log.__dict__)

        # 写入数据库（用于聚合查询）
        self.db.execute("""
            INSERT INTO tts_usage_logs
            (timestamp, request_id, voice, char_count, cache_hit,
             duration_ms, status, cost_estimate, lesson_id, user_id)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (log.timestamp, log.request_id, log.voice, log.char_count,
              log.cache_hit, log.duration_ms, log.status,
              log.cost_estimate, log.lesson_id, log.user_id))

        # 更新当日累计用量
        self.db.execute("""
            INSERT INTO daily_tts_usage (date, voice, total_chars, total_cost, cache_hits, cache_misses)
            VALUES (CURRENT_DATE, %s, %s, %s, %s, %s)
            ON CONFLICT (date, voice) DO UPDATE SET
                total_chars = daily_tts_usage.total_chars + EXCLUDED.total_chars,
                total_cost = daily_tts_usage.total_cost + EXCLUDED.total_cost,
                cache_hits = daily_tts_usage.cache_hits + EXCLUDED.cache_hits,
                cache_misses = daily_tts_usage.cache_misses + EXCLUDED.cache_misses
        """, (log.voice, log.char_count, log.cost_estimate,
              1 if log.cache_hit else 0, 0 if log.cache_hit else 1))

    def get_daily_usage(self, date: date) -> dict:
        """获取指定日期的用量汇总"""
        return self.db.execute("""
            SELECT voice, SUM(total_chars) as chars, SUM(total_cost) as cost,
                   SUM(cache_hits) as hits, SUM(cache_misses) as misses
            FROM daily_tts_usage WHERE date = %s GROUP BY voice
        """, (date,))

    def get_cost_alert(self) -> list:
        """检测异常用量（超过日均 3 倍）"""
        return self.db.execute("""
            SELECT date, voice, total_chars, total_cost
            FROM daily_tts_usage
            WHERE total_chars > (
                SELECT AVG(total_chars) * 3 FROM daily_tts_usage
                WHERE date >= CURRENT_DATE - INTERVAL '30 days'
            ) AND date = CURRENT_DATE
        """)
```

### 4.3 监控指标

| 指标 | 计算方式 | 告警阈值 |
|---|---|---|
| 日字符用量 | SUM(char_count) WHERE date = today | > 400,000 (接近 50 万免费额度) |
| 缓存命中率 | cache_hits / (cache_hits + cache_misses) | < 60% |
| 平均延迟 | AVG(duration_ms) WHERE status = success | > 1000ms |
| 错误率 | error_count / total_requests | > 5% |
| 429 限流次数 | COUNT WHERE error_code = 429 | > 10/hour |
| 单课成本 | SUM(cost_estimate) WHERE lesson_id = X | > ¥10 |

---

## 5. 免费额度保护策略

### 5.1 免费层限制

| 项目 | F0 免费层限制 |
|---|---|
| TTS 字符额度 | **50 万字符/月** |
| STT 音频时长 | 5 小时/月 |
| 翻译音频时长 | 5 小时/月 |
| 并发请求 | 1 个并发 |
| TPS 限制 | 20 TPS |

> **计费规则**: 每个中文字符 = 2 个计费字符。SSML 标签（除 `<speak>` 和 `<voice>` 外）也计入字符数。

### 5.2 额度保护伪代码

```python
class TTSQuotaGuard:
    """
    免费额度保护器：防止超额调用 Azure TTS。
    """

    def __init__(self):
        self.monthly_limit = 500_000       # F0 层 50 万字符
        self.soft_limit = 400_000          # 软限制 80%
        self.daily_budget = 15_000         # 每日预算 ~500k/30天
        self.fallback_voice = "standard"   # 降级策略

    def check_and_allow(self, char_count: int) -> bool:
        """
        检查是否允许本次 TTS 调用。
        返回 True = 允许, False = 拒绝（应使用缓存或降级）
        """
        today_usage = self.usage_logger.get_today_chars()
        month_usage = self.usage_logger.get_month_chars()

        # 硬限制：月度额度
        if month_usage + char_count > self.monthly_limit:
            self._alert("MONTHLY_QUOTA_EXCEEDED", month_usage, self.monthly_limit)
            return False

        # 软限制：月度 80% → 触发告警，但仍允许
        if month_usage > self.soft_limit:
            self._alert("MONTHLY_QUOTA_WARNING", month_usage, self.soft_limit)

        # 日预算控制
        if today_usage + char_count > self.daily_budget:
            self._alert("DAILY_BUDGET_EXCEEDED", today_usage, self.daily_budget)
            # 日额度用完后，仅允许缓存命中，拒绝新合成
            return False

        return True

    def synthesize_with_protection(self, voice, text, **kwargs) -> AudioStream:
        """
        带额度保护的合成入口。
        """
        char_count = self._count_billable_chars(text)

        # 先检查缓存
        cached = self.cache.get(voice, text, **kwargs)
        if cached:
            return cached

        # 检查额度
        if not self.check_and_allow(char_count):
            # 降级策略
            return self._fallback(voice, text, **kwargs)

        # 执行合成
        return self.tts_service.synthesize(voice, text, **kwargs)

    def _fallback(self, voice, text, **kwargs) -> AudioStream:
        """
        降级策略（按优先级）：
        1. 使用已缓存的近似文本音频
        2. 使用更便宜的 voice（如 Standard 替代 HD）
        3. 返回错误提示给用户
        """
        # 策略 1: 模糊匹配缓存
        similar = self.cache.find_similar(text, threshold=0.9)
        if similar:
            return similar

        # 策略 2: 降级到免费 voice
        if self._is_premium_voice(voice):
            fallback_voice = self._get_free_alternative(voice)
            return self.tts_service.synthesize(fallback_voice, text, **kwargs)

        # 策略 3: 完全不可用
        raise QuotaExceededError("TTS 月度额度已用完，请升级套餐")

    def _count_billable_chars(self, text: str) -> int:
        """
        计算计费字符数。
        - 中文/日文/韩文字符 × 2
        - SSML 标签计入（除 <speak> 和 <voice>）
        - 空格、标点均计入
        """
        import re
        # 移除 <speak> 和 <voice> 标签
        clean = re.sub(r'</?speak[^>]*>', '', text)
        clean = re.sub(r'</?voice[^>]*>', '', clean)
        # 计算：CJK 字符 × 2，其他 × 1
        count = 0
        for ch in clean:
            if '\u4e00' <= ch <= '\u9fff' or '\u3040' <= ch <= '\u30ff' or '\uac00' <= ch <= '\ud7af':
                count += 2
            else:
                count += 1
        return count
```

### 5.3 降级策略矩阵

| 场景 | 降级动作 | 用户体验影响 |
|---|---|---|
| 月度额度 > 80% | 发送告警，继续服务 | 无感知 |
| 月度额度 = 100% | 仅返回缓存，拒绝新合成 | 新内容无发音 |
| 日预算用完 | 仅返回缓存 | 新内容无发音 |
| 429 限流 | 指数退避重试 (1s→2s→4s→4s) | 短暂延迟 |
| 区域不可用 | 切换到备用区域 | 短暂延迟 |
| HD Voice 不可用 | 降级到 Neural Voice | 音质略降 |

---

## 6. 定价对比

### 6.1 全球区（以 USD 计）

| 层级 | 计费方式 | 价格 | 免费额度 |
|---|---|---|---|
| **Free (F0)** | 按字符 | 免费 | 50 万字符/月 |
| **Pay-as-you-go (S0)** | Neural Voice | $15 / 百万字符 | 无 |
| **Pay-as-you-go (S0)** | Neural HD Voice | 定价见官网（部分 Voice 价格不同） | 无 |
| **Commitment Tier** | 80M 字符包 | $960/月 ($12/M) | 含 80M 字符 |
| **Commitment Tier** | 400M 字符包 | $3,900/月 ($9.75/M) | 含 400M 字符 |
| **Commitment Tier** | 2000M 字符包 | $15,000/月 ($7.50/M) | 含 2000M 字符 |
| **Custom Voice** | 合成 | $24 / 百万字符 | 无 |
| **Custom Voice** | 训练 | 按计算小时计费，上限 96 小时 | 无 |
| **Custom Voice** | 端点托管 | 按模型/小时计费 | 1 个模型免费(F0) |

### 6.2 中国区（21Vianet，以 CNY 计）

| 层级 | 计费方式 | 价格 | 免费额度 |
|---|---|---|---|
| **Free (F0)** | 按字符 | 免费 | 50 万字符/月 |
| **Standard (S0)** | Neural Voice | ¥95.4 / 百万字符 | 无 |
| **Standard (S0)** | 增强功能（语言识别等） | ¥3.66 / 音频小时/功能 | 无 |

> **汇率参考**: ¥95.4/百万字符 ≈ $13.2/百万字符（按 7.2 汇率），比全球区 $15/百万字符便宜约 12%。

### 6.3 教育优惠

- Azure for Students: 免费 $100 信用额度（无需信用卡）
- Azure 非营利组织赠款: 可获得年度信用额度
- 无专门的「教育 TTS 折扣」，但可通过 Azure Sponsorship 获得信用额度覆盖费用
- 建议：使用 F0 免费层 + 缓存策略，可覆盖小型教学平台月活 < 500 用户的发音需求

### 6.4 成本估算示例

假设 LingoBridge 月场景：
- 1000 个活跃学生
- 每人每天学习 20 个词汇 + 10 个例句
- 每个词汇 ~4 个中文字符 = 8 计费字符
- 每个例句 ~30 个中文字符 = 60 计费字符

```
日字符量 = 1000 × (20 × 8 + 10 × 60) = 1000 × 760 = 760,000 字符
月字符量 = 760,000 × 30 = 22,800,000 字符

无缓存成本: 22.8M × $15/M = $342/月
缓存命中率 70%: 22.8M × 30% × $15/M = $102.6/月
缓存命中率 90%: 22.8M × 10% × $15/M = $34.2/月
```

> **结论**: 缓存是控制 TTS 成本的最关键因素。90% 缓存命中率可将月成本从 $342 降至 $34。

---

## 7. 集成 Checklist

### 7.1 基础设施

- [ ] 创建 Azure Speech Resource（推荐区域：`eastus` 或 `chinanorth3`）
- [ ] 选择定价层：开发阶段用 F0，生产用 S0
- [ ] 配置 Azure Monitor 指标告警（Synthesized Characters）
- [ ] 设置预算告警（Azure Cost Management）

### 7.2 代码集成

- [ ] 安装 Azure Speech SDK (`azure-cognitiveservices-speech`)
- [ ] 实现 TTS Provider 接口（统一抽象，方便切换其他 TTS 服务）
- [ ] 实现 SSML 构建器（支持语速、停顿、风格控制）
- [ ] 实现 Token 管理（自动刷新，10 分钟有效期）
- [ ] 实现连接池（复用 Synthesizer 实例）

### 7.3 缓存

- [ ] 部署 Redis 实例（或复用现有）
- [ ] 实现两级缓存（内存 LRU + Redis）
- [ ] 实现缓存键生成器（SHA256）
- [ ] 实现缓存失效接口（按课程/文本模式）
- [ ] 预填充缓存（批量合成高频词汇）

### 7.4 用量与监控

- [ ] 实现用量日志记录（数据库 + 结构化日志）
- [ ] 实现日/月用量聚合查询
- [ ] 实现配额保护器（QuotaGuard）
- [ ] 实现降级策略（缓存回退、Voice 降级）
- [ ] 配置 429 错误指数退避重试
- [ ] 设置每日用量告警（> 80% 免费额度）

### 7.5 测试

- [ ] 单元测试：缓存键生成、字符计数、SSML 构建
- [ ] 集成测试：实际调用 Azure TTS API
- [ ] 压力测试：并发 200 TPS（默认限制）
- [ ] 限流测试：验证 429 重试逻辑
- [ ] 成本测试：验证账单与预估一致

### 7.6 安全

- [ ] Speech Resource Key 存储在 secrets manager（非硬编码）
- [ ] Token 通过 HTTPS 获取
- [ ] 缓存音频加密存储
- [ ] 访问日志审计

---

## 8. 信源清单

| # | 来源 | 链接 | 发布日期 | 质量评级 |
|---|---|---|---|---|
| 1 | Microsoft Learn — Language and Voice Support | https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support?tabs=tts | 2025-12-19 | ⭐⭐⭐⭐⭐ 官方一手 |
| 2 | Microsoft Learn — Text to Speech Overview | https://learn.microsoft.com/en-us/azure/ai-services/speech-service/text-to-speech | 2026-01-30 | ⭐⭐⭐⭐⭐ 官方一手 |
| 3 | Microsoft Learn — HD Voices | https://learn.microsoft.com/en-us/azure/ai-services/speech-service/high-definition-voices | 2025-10-21 | ⭐⭐⭐⭐⭐ 官方一手 |
| 4 | Microsoft Learn — SSML Structure | https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-synthesis-markup-structure | 2026-02-25 | ⭐⭐⭐⭐⭐ 官方一手 |
| 5 | Azure Pricing — Speech Services | https://azure.microsoft.com/en-us/pricing/details/cognitive-services/speech-services/ | 2025-09-08 | ⭐⭐⭐⭐⭐ 官方一手 |
| 6 | Azure China — Speech Pricing | https://www.azure.cn/en-us/pricing/details/cognitive-services/ | 2026 | ⭐⭐⭐⭐⭐ 官方一手 |
| 7 | Azure China — Sovereign Clouds | https://docs.azure.cn/en-us/ai-services/speech-service/sovereign-clouds | 2026 | ⭐⭐⭐⭐⭐ 官方一手 |
| 8 | Azure China — Regions | https://docs.azure.cn/en-us/ai-services/speech-service/regions | 2026 | ⭐⭐⭐⭐⭐ 官方一手 |
| 9 | Microsoft Learn — Quotas and Limits | https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-services-quotas-and-limits | 2026 | ⭐⭐⭐⭐⭐ 官方一手 |
| 10 | Microsoft Learn — REST API Reference | https://learn.microsoft.com/en-us/azure/ai-services/speech-service/rest-text-to-speech | 2025-10-21 | ⭐⭐⭐⭐⭐ 官方一手 |
| 11 | GitHub — Cognitive-Speech-TTS Wiki (Best Practices) | https://github.com/Azure-Samples/Cognitive-Speech-TTS/wiki/The-best-practice-to-call-TTS-service-in-server-scenario | 2025 | ⭐⭐⭐⭐ 官方示例 |
| 12 | Microsoft Q&A — Caching Policy | https://learn.microsoft.com/en-my/answers/questions/5596131/azure-ai-speech-terms-on-caching-redistribution-of | 2025 | ⭐⭐⭐⭐ 官方回复 |
| 13 | Tech Community — March 2025 HD Voices GA | https://techcommunity.microsoft.com/blog/azure-ai-services-blog/march-2025-azure-ai-speech%E2%80%99s-hd-voices-are-generally-available-and-more/4398951 | 2025-03 | ⭐⭐⭐⭐ 官方博客 |
| 14 | GitHub — TTS Voice List (Community) | https://github.com/MicrosoftDocs/azure-ai-docs/blob/main/articles/ai-services/speech-service/includes/language-support/tts.md | 2026 | ⭐⭐⭐⭐ 官方文档源 |
| 15 | CostBench — Microsoft Speech Pricing | https://costbench.com/software/ai-voice-tools/microsoft-speech/ | 2026-05 | ⭐⭐⭐ 第三方聚合 |

---

## 附录 A: 推荐 Voice 选择

针对 LingoBridge 中文教学场景，推荐以下 Voice 组合：

| 场景 | 推荐 Voice | 理由 |
|---|---|---|
| 词汇发音 | `zh-CN-XiaoxiaoNeural` | 清晰标准，缓存命中率高 |
| 例句朗读 | `zh-CN-YunxiNeural` | 自然流畅，男声补充 |
| 对话练习 | `zh-CN-Xiaoxiao:DragonHDFlashLatestNeural` + `zh-CN-Yunxi:DragonHDFlashLatestNeural` | HD 质量，支持情感风格 |
| 故事/课文 | `zh-CN-Xiaoxiao2:DragonHDFlashLatestNeural` | 20+ 种情感风格 |
| 儿童内容 | `zh-CN-XiaoshuangNeural` / `zh-CN-XiaoyouNeural` | 童声 |
| 方言教学 | `zh-CN-XiaoxiaoDialectsNeural` + `<lang>` 标签 | 一个 Voice 覆盖 13 种方言 |

## 附录 B: 区域选择建议

| 场景 | 推荐区域 | 理由 |
|---|---|---|
| 面向中国大陆用户 | `chinanorth3` | 低延迟，数据合规，支持 HD Flash |
| 面向海外用户 | `eastus` | 功能最全，HD/Omni Voice 齐全 |
| 面向东南亚用户 | `southeastasia` | 延迟适中，HD Voice 支持 |
| 开发/测试 | `eastus` | 功能最全，调试方便 |
