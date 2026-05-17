# LingoBridge 作业 Excel 设计说明（给老师和 AI 使用）

> 目的：让文科院老师可以用 AI 生成符合系统要求的 Excel 作业文件，并上传到指定 Live Class。  
> 核心规则：一个 Excel 文件可以包含多条 homework/词汇任务；上传时必须先选择对应 Live Class。

---

## 一、Excel 必填字段

第一行必须是字段名，建议直接复制下面这一行：

```csv
course_code,unit,lesson,task_id,task_type,zh_text,pinyin,translation_ru,translation_kk,publish_to_homework,publish_to_vocab
```

| 字段 | 是否必填 | 说明 | 示例 |
|---|---|---|---|
| `course_code` | 是 | 课程编号，方便归档 | `CZU-CHN-001` |
| `unit` | 是 | 单元编号 | `1` |
| `lesson` | 是 | 课次编号 | `1` |
| `task_id` | 是 | 每一行唯一编号，不要重复 | `CZU-CHN-001-L01-001` |
| `task_type` | 是 | 任务类型 | `pronunciation` |
| `zh_text` | 是 | 学生要学习/朗读的中文 | `大家好，我叫阿合买提。` |
| `pinyin` | 建议 | 拼音或辅助发音 | `Dajia hao, wo jiao Ahemaiti.` |
| `translation_ru` | 建议 | 俄语释义 | `Здравствуйте, меня зовут Ахмет.` |
| `translation_kk` | 建议 | 哈萨克语释义 | `Сәлеметсіз бе, менің атым Ахмет.` |
| `publish_to_homework` | 是 | 是否作为作业出现 | `TRUE` |
| `publish_to_vocab` | 是 | 是否进入词汇练习 | `FALSE` |

---

## 二、可选字段

这些字段可以不写，但写了会让数据更完整：

| 字段 | 说明 | 示例 |
|---|---|---|
| `lesson_title` | 课时标题 | `第1课 自我介绍` |
| `page_number` | 对应课件页码 | `1` |
| `prompt` | 给学生看的任务说明 | `请朗读下面的句子` |
| `answer` | 标准答案 | `大家好，我叫阿合买提。` |
| `initial` | 声母 | `d` |
| `final` | 韵母 | `a` |
| `tone` | 声调 | `3` |
| `rhyme_group` | 韵母组 | `ao` |
| `difficulty` | 难度 1-5 | `2` |
| `due_at` | 截止时间 | `2026-05-20` |
| `sort_order` | 排序 | `1` |
| `tags` | 标签 | `自我介绍,声调` |

---

## 三、任务类型

`task_type` 只能填写以下值：

| 类型 | 用途 |
|---|---|
| `pronunciation` | 跟读/发音录音 |
| `vocabulary` | 词汇学习 |
| `sentence_reading` | 句子朗读 |
| `dialogue` | 对话练习 |
| `listening` | 听力任务 |

MVP 数据采集建议优先使用：

```text
pronunciation
vocabulary
sentence_reading
```

---

## 四、最小示例

| course_code | unit | lesson | task_id | task_type | zh_text | pinyin | translation_ru | translation_kk | publish_to_homework | publish_to_vocab |
|---|---:|---:|---|---|---|---|---|---|---|---|
| CZU-CHN-001 | 1 | 1 | CZU-CHN-001-L01-001 | pronunciation | 大家好，我叫阿合买提。 | Dajia hao, wo jiao Ahemaiti. | Здравствуйте, меня зовут Ахмет. | Сәлеметсіз бе, менің атым Ахмет. | TRUE | FALSE |
| CZU-CHN-001 | 1 | 1 | CZU-CHN-001-L01-002 | vocabulary | 老师 | laoshi | учитель | мұғалім | FALSE | TRUE |
| CZU-CHN-001 | 1 | 1 | CZU-CHN-001-L01-003 | sentence_reading | 我来自哈萨克斯坦。 | Wo laizi Hasakesitan. | Я из Казахстана. | Мен Қазақстаннан келдім. | TRUE | FALSE |

---

## 五、给 AI 的生成提示词

老师可以直接复制下面这段给 ChatGPT/DeepSeek/通义：

```text
请帮我生成一个中文初级学习作业 Excel 表格，面向哈萨克斯坦留学生，主题是“自我介绍”。

要求：
1. 输出字段必须严格包含：
course_code, unit, lesson, task_id, task_type, zh_text, pinyin, translation_ru, translation_kk, publish_to_homework, publish_to_vocab, lesson_title, page_number, prompt, answer, difficulty, sort_order, tags
2. 生成 20 行任务：
   - 10 行 pronunciation，用于学生跟读录音；
   - 5 行 vocabulary，用于词汇练习；
   - 5 行 sentence_reading，用于句子朗读。
3. task_id 必须唯一，格式为 CZU-CHN-001-L01-001、CZU-CHN-001-L01-002 依次递增。
4. task_type 只能使用 pronunciation、vocabulary、sentence_reading。
5. publish_to_homework 和 publish_to_vocab 只能填写 TRUE 或 FALSE。
6. 中文内容要适合初学者，句子不要太长。
7. pinyin 使用空格分词即可。
8. translation_ru 填俄语释义，translation_kk 填哈萨克语释义。
9. 请以 Markdown 表格输出，方便我复制到 Excel。
```

---

## 六、上传步骤

1. 老师登录系统。
2. 进入课程详情。
3. 先进入 Live Class 管理，创建一个 Live Class，例如“第1课 自我介绍试采”。
4. 进入“课程作业 / Homework”。
5. 选择刚创建的 Live Class。
6. 上传 Excel。
7. 系统显示解析任务数和词汇数。
8. 用学生账号登录，进入对应课程查看作业。

---

## 七、常见错误

| 错误 | 原因 | 解决 |
|---|---|---|
| 上传后任务数为 0 | 字段名不匹配或没有数据行 | 复制本文字段名重新生成 |
| Missing required columns | 缺少必填字段 | 检查第一行字段 |
| invalid task_type | 类型写错 | 使用允许的 5 个英文值 |
| 学生看不到作业 | 未选择 Live Class 或未发布 homework | 上传前选择 Live Class，`publish_to_homework=TRUE` |
| 词汇页没有数据 | `publish_to_vocab` 为 FALSE | 词汇行设置为 TRUE |
| 出现 JSON 错误 | API 服务未正确返回数据 | 联系技术负责人检查公网 API |

