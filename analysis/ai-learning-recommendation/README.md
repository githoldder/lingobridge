# LingoBridge AI Learning Recommendation Core

本模块是国际中文学习行为分析与个性化练习推荐系统的人工智能建模核心。包含：

1. **图建模 (`src/build_knowledge_graph.py`)**：基于 `NetworkX` 的拼音-声调-词汇拓扑关联分析。
2. **深度学习 (`src/train_knowledge_tracing.py`)**：基于 `PyTorch` 深度神经网络的 DKT (Deep Knowledge Tracing) 学习状态追踪。
3. **多模态创新 (`scripts/calibrate_subtitles.py`)**：基于 RAG 检索拼音修正与 Helsinki-NLP 模型对 ASR 字幕流的高效端侧校准翻译。

## 运行方式
确保已安装 `requirements.txt` 中的依赖库：
```bash
pip install -r requirements.txt
```

依次运行核心管道：
```bash
python src/generate_data.py
python src/build_knowledge_graph.py
python src/train_knowledge_tracing.py
python scripts/calibrate_subtitles.py
```
全部可视化指标和推荐案例将输出至 `output/`。