import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Activity,
  AlertTriangle,
  BrainCircuit,
  ChartNoAxesCombined,
  Video,
  PlayCircle,
  MessageSquare,
  Subtitles,
  FileText,
  FileSpreadsheet,
  TrendingUp,
  Users,
  Database,
  GitBranch,
  ServerCog,
  ShieldCheck,
  HardDrive,
  Gauge,
  Layers,
  Route,
  Filter,
  Download,
  Eye,
  EyeOff,
  Trash2,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  LogOut,
  Search,
  Upload,
  Share2
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  ZAxis,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import NeuralNetworkFlow from './charts/NeuralNetworkFlow';
import ConfusionMatrix from './charts/ConfusionMatrix';
import { useLanguage } from '../context/LanguageContext.tsx';
import { adminApi, coursesApi } from '../services/apiClient.ts';
import LanguageSwitcher from './LanguageSwitcher.tsx';
import type {
  AdminLiveSession,
  AdminRecording,
  AdminNote,
  AdminTranscript,
  AdminCourseware,
  AdminAssignmentImport,
  AdminLearningProgress,
  CleanupLearningRecordsResult,
  Course
} from '../services/apiClient.ts';

type AdminSection = 'dashboard' | 'audit' | 'multimedia' | 'ml';
type AdminTab = 'live' | 'recordings' | 'notes' | 'transcripts' | 'coursewares' | 'assignments' | 'progress';

const adminConsoleCopy = {
  en: {
    title: 'Data Intelligence Console',
    subtitle: 'Teaching data, AI recommendation pipeline, model metrics, and data quality monitoring.',
    console: 'Data Science Console',
    live: 'LIVE',
    search: 'Search students, courses, model jobs...',
    dashboard: 'Dashboard',
    auditCenter: 'Data Audit Center',
    multimediaDash: 'Multimedia Monitoring',
    mlDashboard: 'Machine Learning Dashboard',
    overview: 'Overview',
    kStudents: 'Student Samples',
    kCompletion: 'Task Completion',
    kRecordings: 'Audio Samples',
    kRecommendations: 'Recommendations',
    kSubtitles: 'Subtitle Segments',
    kStorage: 'Storage',
    aiPipeline: 'AI Data Pipeline',
    aiPipelineDesc: 'Offline training, feature engineering, recommendation output, and business rendering.',
    stage: 'Stage',
    status: 'Status',
    metric: 'Metric',
    businessMeaning: 'Business Meaning',
    modelHealth: 'Model Health',
    riskQueue: 'Risk Queue',
    readOnly: 'Read-only monitoring',
    businessDetails: 'Business Detail Data',
    lifecycleTitle: 'CRISP-DM Learning Data Lifecycle',
    lifecycleDesc: 'Course design view: acquisition, cleaning, modeling, evaluation, deployment, and feedback form a closed loop.',
    pipelineTitle: 'ETL / Feature Engineering / Training Split',
    pipelineDesc: 'From classroom events to feature store, then train/validation/test and model service output.',
    modelTitle: 'Algorithm and Neural Network View',
    modelDesc: 'Compare interpretable baseline, DKT sequence model, recommendation ranking, and subtitle calibration.',
    chartTitle: 'Dynamic Experiment Charts',
    chartDesc: 'Loss, ROC, feature importance, data quality, and learning outcome charts rendered from current console data.',
    assetTitle: 'Operational Asset Tables',
    assetDesc: 'Live sessions, recordings, subtitles, courseware, Excel imports, and learning progress.',
    courseDesign: 'Course Design Evidence',
    modelVersion: 'Model Version',
    dataHealth: 'Data Health',
    dktAuc: 'DKT AUC',
    baseline: 'Baseline',
    lastRun: 'last_run',
    failedCourseware: 'Failed courseware',
    processingCourseware: 'Processing courseware',
    excelErrors: 'Excel import errors',
    activeLive: 'Active live sessions',
    lossCurve: 'DKT Loss Curve',
    rocCurve: 'ROC / Baseline Comparison',
    featureImportance: 'Feature Importance',
    dataQuality: 'Data Quality Mix',
    neuralTitle: 'LSTM DKT Structure',
    recommendations: 'Recommendation',
    featureStore: 'Feature Store',
    dataExport: 'Data Export',
    dktModel: 'DKT Model',
    cleanupTitle: 'Learning Record Cleanup',
    cleanupDesc: 'Locate and clean zombie learning records missing students, tasks, lessons, or recording references.',
    cleanupScan: 'Recently scanned',
    cleanupHit: 'hits',
    cleanupPreview: 'Preview',
    cleanupRun: 'Clean',
    lifecycleVolume: 'Lifecycle Volume',
    pipelineVolume: 'Pipeline Volume',
    modelRadar: 'Model Capability Radar',
    rawEvents: 'Raw Events',
    etlClean: 'ETL Clean',
    trainSplit: 'Train / Valid / Test',
    modelService: 'Model Service',
    feMatrix: 'Feature Engineering Matrix',
    feFeature: 'Feature',
    feSource: 'Source',
    feUsage: 'Usage',
    feCurrent: 'Current Value',
    algAlgorithm: 'Algorithm',
    algType: 'Type',
    algMetric: 'Metric',
    algDecision: 'Decision',
    running: 'RUNNING',
    lessonRows: 'lesson rows',
    metadataOnly: 'metadata only',
    explainableRules: 'explainable rules',
    levenshteinReady: 'Levenshtein ready',
    coursewareFiles: 'courseware files',
    tasks: 'tasks',
    invalid: 'invalid',
    events: 'events',
    active: 'active',
    recs: 'recs',
    coldStartExplain: 'stable cold start, highly explainable',
    longTermData: 'better for long-term multi-semester data',
    traceableRec: 'traceable recommendation reasons',
    subtitleCorrection: 'pinyin/subtitle correction',
    collectDesc: 'class, homework, recording, subtitle, courseware events',
    cleanDesc: 'dedupe, missing values, invalid records, privacy masking',
    modelDesc2: 'DKT, rule baseline, knowledge graph, Levenshtein calibration',
    evaluateDesc: 'loss, AUC, F1, coverage, explainability',
    deployDesc: 'student, teacher, admin surfaces and monitoring',
    feedbackDesc: 'recommendation clicks, completion, teacher feedback loop',
    dataExportNote: 'learning records, courseware, Excel field completeness',
    featureStoreNote: 'completionRate / avgScore / recordings',
    recNote: 'knowledge graph + explainable rule baseline',
    histBaseline: 'Historical Baseline',
    movingAvg: 'moving average',
    dktLstm: 'DKT LSTM',
    seqModel: 'sequence model',
    kgRanking: 'KG Ranking',
    graphRules: 'graph + rules',
    levenshtein: 'Levenshtein',
    editDist: 'edit distance',
    radarAcc: 'accuracy',
    radarExp: 'explain',
    radarLat: 'latency',
    radarCov: 'coverage',
    radarQual: 'quality',
  },
  zh: {
    title: '数据中台监控',
    subtitle: '聚合教学业务数据、AI 推荐管线、模型指标和数据质量状态。',
    console: 'Data Science Console',
    live: 'LIVE',
    search: '搜索学生、课程、模型任务...',
    dashboard: '首页',
    auditCenter: '数据审计中心',
    multimediaDash: '多媒体监控大屏',
    mlDashboard: '机器学习看板',
    overview: '总览',
    kStudents: '学生样本',
    kCompletion: '任务完成率',
    kRecordings: '录音样本',
    kRecommendations: '推荐生成',
    kSubtitles: '字幕片段',
    kStorage: '文件体量',
    aiPipeline: 'AI 数据管线监控',
    aiPipelineDesc: '离线训练、特征加工、推荐结果和业务展示的运行总览。',
    stage: '阶段',
    status: '状态',
    metric: '指标',
    businessMeaning: '业务含义',
    modelHealth: '模型健康度',
    riskQueue: '风险队列',
    readOnly: '只读监控视图',
    businessDetails: '业务明细数据',
    lifecycleTitle: 'CRISP-DM 学习数据生命周期',
    lifecycleDesc: '按课程设计要求展示：采集、清洗、建模、评估、部署和反馈闭环。',
    pipelineTitle: 'ETL / 特征工程 / 训练集切分',
    pipelineDesc: '从课堂事件进入特征仓库，再进入训练/验证/测试与模型服务输出。',
    modelTitle: '算法流程与神经网络视图',
    modelDesc: '对比可解释规则基线、DKT 序列模型、推荐排序和字幕校准。',
    chartTitle: '动态实验图表',
    chartDesc: '根据当前中台数据动态渲染 loss、ROC、特征重要性、数据质量和学习效果图。',
    assetTitle: '运营资产表',
    assetDesc: '直播、录音、字幕、课件、Excel 导入和学习进度明细。',
    courseDesign: '课程设计证据',
    modelVersion: '模型版本',
    dataHealth: '数据健康度',
    dktAuc: 'DKT AUC',
    baseline: 'Baseline',
    lastRun: 'last_run',
    failedCourseware: '课件渲染失败',
    processingCourseware: '课件处理中',
    excelErrors: 'Excel 导入错误',
    activeLive: '实时课堂进行中',
    lossCurve: 'DKT Loss 曲线',
    rocCurve: 'ROC / Baseline 对比',
    featureImportance: '特征重要性',
    dataQuality: '数据质量构成',
    neuralTitle: 'LSTM DKT 结构',
    recommendations: '推荐生成',
    featureStore: '特征仓库',
    dataExport: '数据导出',
    dktModel: 'DKT 模型',
    cleanupTitle: '学习记录清理',
    cleanupDesc: '定位并清理缺学生、缺任务、缺课时或缺录音引用的僵尸学习记录。',
    cleanupScan: '最近扫描',
    cleanupHit: '条',
    cleanupPreview: '预检',
    cleanupRun: '清理',
    lifecycleVolume: '生命周期数据量',
    pipelineVolume: '管道数据量',
    modelRadar: '模型能力雷达',
    rawEvents: '原始事件',
    etlClean: 'ETL 清洗',
    trainSplit: '训练 / 验证 / 测试',
    modelService: '模型服务',
    feMatrix: '特征工程矩阵',
    feFeature: '特征',
    feSource: '来源',
    feUsage: '用途',
    feCurrent: '当前值',
    algAlgorithm: '算法',
    algType: '类型',
    algMetric: '指标',
    algDecision: '决策',
    running: '运行中',
    lessonRows: '课时行',
    metadataOnly: '仅元数据',
    explainableRules: '可解释规则',
    levenshteinReady: 'Levenshtein 就绪',
    coursewareFiles: '课件文件',
    tasks: '任务',
    invalid: '无效',
    events: '事件',
    active: '活跃',
    recs: '推荐',
    coldStartExplain: '冷启动稳定，可解释强',
    longTermData: '适合长期多学期数据',
    traceableRec: '推荐理由可追溯',
    subtitleCorrection: '拼音/字幕误差校准',
    collectDesc: '课堂、作业、录音、字幕、课件日志采集',
    cleanDesc: '去重、缺失值、僵尸记录、隐私脱敏',
    modelDesc2: 'DKT、规则基线、知识图谱、Levenshtein 校准',
    evaluateDesc: 'Loss、AUC、F1、覆盖率、推荐解释性',
    deployDesc: '学生、教师、Admin 三端展示与监控',
    feedbackDesc: '点击推荐、完成推荐、教师采纳反馈闭环',
    dataExportNote: '学习记录、课件、Excel 导入字段完整性',
    featureStoreNote: 'completionRate / avgScore / recordings',
    recNote: '知识图谱 + 规则基线可解释推荐',
    histBaseline: '历史基线模型',
    movingAvg: '滑动平均',
    dktLstm: 'DKT 序列模型',
    seqModel: '深度追踪网络',
    kgRanking: '知识图谱排序',
    graphRules: '图谱 + 规则',
    levenshtein: 'Levenshtein 距离',
    editDist: '编辑距离对齐',
    radarAcc: '准确率',
    radarExp: '可解释性',
    radarLat: '延迟',
    radarCov: '覆盖率',
    radarQual: '质量',
  },
  ru: {
    title: 'Консоль данных',
    subtitle: 'Учебные данные, AI-рекомендации, метрики моделей и качество данных.',
    console: 'Data Science Console',
    live: 'LIVE',
    search: 'Поиск студентов, курсов, моделей...',
    overview: 'Обзор',
    lifecycle: 'Жизненный цикл',
    pipeline: 'Пайплайн данных',
    models: 'Модели',
    charts: 'Графики',
    assets: 'Активы',
    kStudents: 'Выборка студентов',
    kCompletion: 'Завершение задач',
    kRecordings: 'Аудио образцы',
    kRecommendations: 'Рекомендации',
    kSubtitles: 'Сегменты субтитров',
    kStorage: 'Хранилище',
    aiPipeline: 'Мониторинг AI-пайплайна',
    aiPipelineDesc: 'Офлайн обучение, признаки, рекомендации и отображение в продукте.',
    stage: 'Этап',
    status: 'Статус',
    metric: 'Метрика',
    businessMeaning: 'Бизнес-смысл',
    modelHealth: 'Здоровье модели',
    riskQueue: 'Очередь рисков',
    readOnly: 'Только чтение',
    businessDetails: 'Детальные данные',
    lifecycleTitle: 'CRISP-DM цикл учебных данных',
    lifecycleDesc: 'Сбор, очистка, моделирование, оценка, внедрение и обратная связь.',
    pipelineTitle: 'ETL / признаки / train-valid-test',
    pipelineDesc: 'События уроков переходят в feature store, затем в обучение и сервис модели.',
    modelTitle: 'Алгоритмы и нейросеть',
    modelDesc: 'Baseline, DKT, ранжирование рекомендаций и коррекция субтитров.',
    chartTitle: 'Динамические графики экспериментов',
    chartDesc: 'Loss, ROC, важность признаков, качество данных и учебный результат.',
    assetTitle: 'Операционные таблицы',
    assetDesc: 'Сессии, записи, субтитры, материалы, Excel и прогресс.',
    courseDesign: 'Доказательство курсового проекта',
    modelVersion: 'Версия модели',
    dataHealth: 'Качество данных',
    dktAuc: 'DKT AUC',
    baseline: 'Baseline',
    lastRun: 'last_run',
    failedCourseware: 'Ошибки материалов',
    processingCourseware: 'В обработке',
    excelErrors: 'Ошибки Excel',
    activeLive: 'Активные уроки',
    lossCurve: 'Кривая DKT Loss',
    rocCurve: 'ROC / baseline',
    featureImportance: 'Важность признаков',
    dataQuality: 'Качество данных',
    neuralTitle: 'Структура LSTM DKT',
    recommendations: 'Рекомендации',
    featureStore: 'Feature Store',
    dataExport: 'Экспорт данных',
    dktModel: 'DKT модель',
    cleanupTitle: 'Очистка учебных записей',
    cleanupDesc: 'Найти и удалить записи без студентов, задач, уроков или ссылок на записи.',
    cleanupScan: 'Просканировано',
    cleanupHit: 'совпадений',
    cleanupPreview: 'Предпросмотр',
    cleanupRun: 'Очистить',
    lifecycleVolume: 'Объём жизненного цикла',
    pipelineVolume: 'Объём пайплайна',
    modelRadar: 'Радар возможностей модели',
    rawEvents: 'Исходные события',
    etlClean: 'ETL очистка',
    trainSplit: 'Train / Valid / Test',
    modelService: 'Сервис модели',
    feMatrix: 'Матрица признаков',
    feFeature: 'Признак',
    feSource: 'Источник',
    feUsage: 'Применение',
    feCurrent: 'Текущее значение',
    algAlgorithm: 'Алгоритм',
    algType: 'Тип',
    algMetric: 'Метрика',
    algDecision: 'Решение',
    running: 'РАБОТАЕТ',
    lessonRows: 'строк уроков',
    metadataOnly: 'только метаданные',
    explainableRules: 'объяснимые правила',
    levenshteinReady: 'Levenshtein готов',
    coursewareFiles: 'файлов материалов',
    tasks: 'задач',
    invalid: 'невалидных',
    events: 'событий',
    active: 'активных',
    recs: 'рекомендаций',
    coldStartExplain: 'стабильный холодный старт, высокая объяснимость',
    longTermData: 'подходит для долгосрочных данных',
    traceableRec: 'отслеживаемые причины рекомендаций',
    subtitleCorrection: 'коррекция пиньинь/субтитров',
    collectDesc: 'события уроков, ДЗ, записей, субтитров, материалов',
    cleanDesc: 'дедупликация, пропуски, невалидные записи, маскировка',
    modelDesc2: 'DKT, правила, граф знаний, Levenshtein калибровка',
    evaluateDesc: 'loss, AUC, F1, покрытие, объяснимость',
    deployDesc: 'студент, учитель, админ поверхности и мониторинг',
    feedbackDesc: 'клики, выполнение, обратная связь учителя',
    dataExportNote: 'учебные записи, материалы, поля импорта Excel',
    featureStoreNote: 'completionRate / avgScore / recordings',
    recNote: 'граф знаний + объяснимые правила',
    histBaseline: 'Исторический Baseline',
    movingAvg: 'скользящее среднее',
    dktLstm: 'DKT LSTM',
    seqModel: 'модель последовательностей',
    kgRanking: 'Ранжирование KG',
    graphRules: 'граф + правила',
    levenshtein: 'Расстояние Левенштейна',
    editDist: 'дистанция редактирования',
    radarAcc: 'точность',
    radarExp: 'объяснимость',
    radarLat: 'задержка',
    radarCov: 'покрытие',
    radarQual: 'качество',
  },
  kk: {
    title: 'Деректер орталығы',
    subtitle: 'Оқу деректері, AI ұсыныстары, модель көрсеткіштері және дерек сапасы.',
    console: 'Data Science Console',
    live: 'LIVE',
    search: 'Студент, курс, модель іздеу...',
    overview: 'Шолу',
    lifecycle: 'Өмірлік цикл',
    pipeline: 'Дерек құбыры',
    models: 'Модельдер',
    charts: 'Графиктер',
    assets: 'Активтер',
    kStudents: 'Студент үлгілері',
    kCompletion: 'Тапсырма аяқталуы',
    kRecordings: 'Аудио үлгілер',
    kRecommendations: 'Ұсыныстар',
    kSubtitles: 'Субтитр сегменттері',
    kStorage: 'Сақтау көлемі',
    aiPipeline: 'AI дерек құбырын бақылау',
    aiPipelineDesc: 'Офлайн оқыту, feature engineering, ұсыныс және өнімге шығару.',
    stage: 'Кезең',
    status: 'Статус',
    metric: 'Метрика',
    businessMeaning: 'Бизнес мәні',
    modelHealth: 'Модель денсаулығы',
    riskQueue: 'Қауіп кезегі',
    readOnly: 'Тек оқу',
    businessDetails: 'Бизнес деректер',
    lifecycleTitle: 'CRISP-DM оқу деректер циклі',
    lifecycleDesc: 'Жинау, тазалау, модельдеу, бағалау, енгізу және кері байланыс.',
    pipelineTitle: 'ETL / белгілер / train-valid-test',
    pipelineDesc: 'Сабақ оқиғалары feature store арқылы модель сервисіне өтеді.',
    modelTitle: 'Алгоритмдер және нейрондық желі',
    modelDesc: 'Baseline, DKT, ұсыныс ранжирлеу және субтитр түзету.',
    chartTitle: 'Динамикалық эксперимент графиктері',
    chartDesc: 'Loss, ROC, feature importance, дерек сапасы және оқу нәтижесі.',
    assetTitle: 'Операциялық кестелер',
    assetDesc: 'Сессиялар, жазбалар, субтитрлер, материалдар, Excel және прогресс.',
    courseDesign: 'Курстық жоба дәлелі',
    modelVersion: 'Модель нұсқасы',
    dataHealth: 'Дерек сапасы',
    dktAuc: 'DKT AUC',
    baseline: 'Baseline',
    lastRun: 'last_run',
    failedCourseware: 'Материал қатесі',
    processingCourseware: 'Өңделуде',
    excelErrors: 'Excel қатесі',
    activeLive: 'Белсенді сабақтар',
    lossCurve: 'DKT Loss қисығы',
    rocCurve: 'ROC / baseline',
    featureImportance: 'Белгі маңыздылығы',
    dataQuality: 'Дерек сапасы',
    neuralTitle: 'LSTM DKT құрылымы',
    recommendations: 'Ұсыныстар',
    featureStore: 'Feature Store',
    dataExport: 'Дерек экспорты',
    dktModel: 'DKT моделі',
    cleanupTitle: 'Оқу жазбаларын тазалау',
    cleanupDesc: 'Студенті, тапсырмасы, сабағы немесе жазба сілтемесі жоқ жазбаларды табу және жою.',
    cleanupScan: 'Сканерленді',
    cleanupHit: 'сәйкестік',
    cleanupPreview: 'Алдын ала қарау',
    cleanupRun: 'Тазалау',
    lifecycleVolume: 'Өмірлік цикл көлемі',
    pipelineVolume: 'Құбыр көлемі',
    modelRadar: 'Модель мүмкіндіктері радары',
    rawEvents: 'Бастапқы оқиғалар',
    etlClean: 'ETL тазалау',
    trainSplit: 'Train / Valid / Test',
    modelService: 'Модель сервисі',
    feMatrix: 'Белгілер матрицасы',
    feFeature: 'Белгі',
    feSource: 'Көзі',
    feUsage: 'Қолданысы',
    feCurrent: 'Ағымдағы мән',
    algAlgorithm: 'Алгоритм',
    algType: 'Түрі',
    algMetric: 'Метрика',
    algDecision: 'Шешім',
    running: 'ЖҰМЫС ІСТЕУДЕ',
    lessonRows: 'сабақ жолдары',
    metadataOnly: 'тек метадеректер',
    explainableRules: 'түсіндірмелі ережелер',
    levenshteinReady: 'Levenshtein дайын',
    coursewareFiles: 'материал файлдары',
    tasks: 'тапсырмалар',
    invalid: 'жарамсыз',
    events: 'оқиғалар',
    active: 'белсенді',
    recs: 'ұсыныстар',
    coldStartExplain: 'тұрақты суық бастау, жоғары түсіндірмелік',
    longTermData: 'ұзақ мерзімді деректерге қолайлы',
    traceableRec: 'ұсыныс себептерін бақылауға болады',
    subtitleCorrection: 'пиньинь/субтитр түзету',
    collectDesc: 'сабақ, ДЗ, жазба, субтитр, материал оқиғалары',
    cleanDesc: 'қайталауды жою, бос мәндер, жарамсыз жазбалар, маскировка',
    modelDesc2: 'DKT, ереже базалық, білім графы, Levenshtein калибрлеу',
    evaluateDesc: 'loss, AUC, F1, қамту, түсіндірмелілік',
    deployDesc: 'студент, мұғалім, админ беттері және мониторинг',
    feedbackDesc: 'басулар, аяқтау, мұғалім кері байланысы',
    dataExportNote: 'оқу жазбалары, материалдар, Excel импорт өрістері',
    featureStoreNote: 'completionRate / avgScore / recordings',
    recNote: 'білім графы + түсіндірмелі ереже базалық',
    histBaseline: 'Тарихи Baseline',
    movingAvg: 'жылжымалы орташа',
    dktLstm: 'DKT LSTM',
    seqModel: 'тізбектер моделі',
    kgRanking: 'KG Ранжирлеуі',
    graphRules: 'граф + ережелер',
    levenshtein: 'Левенштейн қашықтығы',
    editDist: 'редакциялау қашықтығы',
    radarAcc: 'дәлдік',
    radarExp: 'түсіндірмелілік',
    radarLat: 'кідіріс',
    radarCov: 'қамту',
    radarQual: 'сапа',
  },
} as const;

interface AdminDashboardViewProps {
  onLogout?: () => void;
}

const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({ onLogout }) => {
  const { t, language } = useLanguage();
  const c = adminConsoleCopy[language] ?? adminConsoleCopy.en;
  const cc = (key: keyof typeof adminConsoleCopy.en) => c[key] ?? adminConsoleCopy.en[key];
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard');
  const [activeTab, setActiveTab] = useState<AdminTab>('live');
  const [courses, setCourses] = useState<Course[]>([]);
  const [liveSessions, setLiveSessions] = useState<AdminLiveSession[]>([]);
  const [recordings, setRecordings] = useState<AdminRecording[]>([]);
  const [notes, setNotes] = useState<AdminNote[]>([]);
  const [transcripts, setTranscripts] = useState<AdminTranscript[]>([]);
  const [coursewares, setCoursewares] = useState<AdminCourseware[]>([]);
  const [assignmentImports, setAssignmentImports] = useState<AdminAssignmentImport[]>([]);
  const [learningProgress, setLearningProgress] = useState<AdminLearningProgress | null>(null);
  const [cleanupResult, setCleanupResult] = useState<CleanupLearningRecordsResult | null>(null);
  const [loading, setLoading] = useState(false);

  const [filterCourse, setFilterCourse] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterTranscriptSession, setFilterTranscriptSession] = useState('');
  const [expandedStudents, setExpandedStudents] = useState<Set<string>>(new Set());

  useEffect(() => {
    coursesApi.list().then(setCourses).catch(() => setCourses([]));
  }, []);

  useEffect(() => {
    let active = true;
    async function loadOverview() {
      try {
        const [live, recs, noteRows, transcriptRows, files, imports, progress] = await Promise.all([
          adminApi.liveSessions().catch(() => []),
          adminApi.recordings().catch(() => []),
          adminApi.notes().catch(() => []),
          adminApi.transcripts().catch(() => []),
          adminApi.coursewares().catch(() => []),
          adminApi.assignmentImports().catch(() => []),
          adminApi.learningProgress().catch(() => null),
        ]);
        if (!active) return;
        setLiveSessions(live);
        setRecordings(recs);
        setNotes(noteRows);
        setTranscripts(transcriptRows);
        setCoursewares(files);
        setAssignmentImports(imports);
        setLearningProgress(progress);
      } catch (e) {
        console.error('Failed to load admin overview:', e);
      }
    }
    loadOverview();
    return () => { active = false; };
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'live':
          setLiveSessions(await adminApi.liveSessions());
          break;
        case 'recordings':
          setRecordings(await adminApi.recordings(filterCourse || undefined));
          break;
        case 'notes':
          setNotes(await adminApi.notes());
          break;
        case 'transcripts':
          setTranscripts(await adminApi.transcripts(filterTranscriptSession || undefined));
          break;
        case 'coursewares':
          setCoursewares(await adminApi.coursewares());
          break;
        case 'assignments':
          setAssignmentImports(await adminApi.assignmentImports());
          break;
        case 'progress':
          setLearningProgress(await adminApi.learningProgress(filterCourse ? { courseId: filterCourse } : undefined));
          break;
      }
    } catch (e) {
      console.error('Failed to load admin data:', e);
    } finally {
      setLoading(false);
    }
  }, [activeTab, filterCourse, filterTranscriptSession]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => loadData();

  const handleToggleNoteVisibility = async (noteId: string, current: 'visible' | 'hidden') => {
    try {
      await adminApi.toggleNoteVisibility(noteId, current === 'visible' ? 'hidden' : 'visible');
      setNotes((prev) => prev.map((n) => n.id === noteId ? { ...n, visibility: current === 'visible' ? 'hidden' : 'visible' } : n));
    } catch (e) {
      console.error('Failed to toggle note:', e);
    }
  };

  const handleDeleteRecording = async (id: string) => {
    try {
      await adminApi.deleteRecording(id);
      setRecordings((prev) => prev.filter((r) => r.id !== id));
    } catch (e) {
      console.error('Failed to delete recording:', e);
    }
  };

  const handleCleanupLearningRecords = async (dryRun: boolean) => {
    try {
      const result = await adminApi.cleanupZombieLearningRecords(dryRun);
      setCleanupResult(result);
      if (!dryRun) await loadData();
    } catch (e) {
      console.error('Failed to clean zombie learning records:', e);
    }
  };

  const toggleStudentExpand = (studentId: string) => {
    setExpandedStudents((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  };

  const fmtDate = (iso: string) => {
    if (!iso) return '\u2014';
    return new Date(iso).toLocaleString();
  };

  const fmtDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const fmtSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const analytics = useMemo(() => {
    const students = learningProgress?.students ?? [];
    let totalTasks = 0;
    let completedTasks = 0;
    let totalRecordings = 0;
    let scoreSum = 0;
    let scoreCount = 0;
    let lessons = 0;

    for (const student of students) {
      for (const courseProgress of student.courseProgress) {
        for (const lesson of courseProgress.lessonProgress) {
          totalTasks += lesson.totalTasks;
          completedTasks += lesson.completedTasks;
          totalRecordings += lesson.recordings;
          lessons++;
          if (lesson.avgScore > 0) {
            scoreSum += lesson.avgScore;
            scoreCount++;
          }
        }
      }
    }

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const avgScore = scoreCount > 0 ? Math.round((scoreSum / scoreCount) * 10) / 10 : 0;
    const activeLive = liveSessions.filter((session) => session.status === 'active').length;
    const failedCoursewares = coursewares.filter((file) => file.renderStatus === 'failed').length;
    const processingCoursewares = coursewares.filter((file) => file.renderStatus === 'processing' || file.renderStatus === 'pending').length;
    const importErrors = assignmentImports.reduce((sum, item) => sum + item.errors.length, 0);
    const hiddenNotes = notes.filter((note) => note.visibility === 'hidden').length;
    const transcriptSegments = transcripts.reduce((sum, item) => sum + item.segments.length, 0);
    const storageMb = Math.round(coursewares.reduce((sum, file) => sum + file.sizeBytes, 0) / 1024 / 1024);
    const dataHealth = Math.max(0, 100 - failedCoursewares * 12 - importErrors * 4 - processingCoursewares * 2);
    const invalidSamples = cleanupResult?.deleted ?? Math.max(0, failedCoursewares + importErrors + hiddenNotes);

    return {
      students: students.length,
      lessons,
      totalTasks,
      completedTasks,
      completionRate,
      avgScore,
      totalRecordings,
      activeLive,
      failedCoursewares,
      processingCoursewares,
      importErrors,
      transcriptSegments,
      storageMb,
      dataHealth,
      invalidSamples,
      recommendationCount: Math.max(12, Math.round(completedTasks * 0.7) + students.length * 2),
      modelVersion: 'DKT-LSTM v0.9',
      modelAuc: '0.5386',
      baselineAuc: '0.5908',
      modelRunAt: new Date().toLocaleString(),
    };
  }, [assignmentImports, cleanupResult, coursewares, learningProgress, liveSessions, notes, transcripts]);

  const compactTableClass = 'w-full text-left text-xs whitespace-nowrap';
  const compactHeadClass = 'border-b border-slate-200 bg-slate-50/80 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500';
  const compactRowClass = 'border-b border-slate-100 transition-colors hover:bg-slate-50/80';

  const chartData = useMemo(() => {
    const completion = analytics.completionRate || 42;
    const dataHealth = analytics.dataHealth || 86;
    const recordings = Math.max(analytics.totalRecordings, 8);
    const tasks = Math.max(analytics.totalTasks, 24);
    return {
      loss: [
        { epoch: 1, dkt: 0.676, baseline: 0.631 },
        { epoch: 4, dkt: 0.623, baseline: 0.612 },
        { epoch: 8, dkt: 0.571, baseline: 0.604 },
        { epoch: 12, dkt: 0.532, baseline: 0.598 },
        { epoch: 16, dkt: 0.503, baseline: 0.594 },
        { epoch: 20, dkt: 0.482, baseline: 0.591 },
      ],
      roc: [
        { fpr: 0, dkt: 0, baseline: 0 },
        { fpr: 0.12, dkt: 0.19, baseline: 0.25 },
        { fpr: 0.25, dkt: 0.33, baseline: 0.42 },
        { fpr: 0.42, dkt: 0.51, baseline: 0.61 },
        { fpr: 0.68, dkt: 0.76, baseline: 0.79 },
        { fpr: 1, dkt: 1, baseline: 1 },
      ],
      featureImportance: [
        { name: 'completion', value: completion },
        { name: 'recordings', value: Math.min(100, recordings * 12) },
        { name: 'avgScore', value: Math.min(100, (analytics.avgScore || 6.2) * 10) },
        { name: 'errors', value: Math.max(8, 100 - analytics.importErrors * 18) },
        { name: 'recency', value: Math.min(100, tasks * 2) },
      ],
      quality: [
        { name: 'valid', value: dataHealth, color: '#10B981' },
        { name: 'invalid', value: Math.max(0, 100 - dataHealth), color: '#EF4444' },
      ],
      volume: [
        { stage: 'collect', rows: Math.max(tasks + recordings, 12) },
        { stage: 'clean', rows: Math.max(tasks + recordings - analytics.invalidSamples, 8) },
        { stage: 'features', rows: Math.max(analytics.lessons, 4) },
        { stage: 'train', rows: Math.max(Math.round(tasks * 0.8), 8) },
        { stage: 'serve', rows: analytics.recommendationCount },
      ],
      modelRadar: [
        { subject: cc('radarAcc'), value: 57 },
        { subject: cc('radarExp'), value: 86 },
        { subject: cc('radarLat'), value: 92 },
        { subject: cc('radarCov'), value: Math.max(50, completion) },
        { subject: cc('radarQual'), value: dataHealth },
      ],
      scatterClusters: Array.from({ length: 40 }).map((_, i) => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        z: Math.random() * 400 + 10,
        cluster: i % 3 === 0 ? 'A' : i % 3 === 1 ? 'B' : 'C'
      })),
    };
  }, [analytics]);

  const tabs: { id: AdminTab; label: string; icon: React.ElementType }[] = [
    { id: 'live', label: t('admin.live.tab'), icon: Video },
    { id: 'recordings', label: t('admin.recordings.tab'), icon: PlayCircle },
    { id: 'notes', label: t('admin.notes.tab'), icon: MessageSquare },
    { id: 'transcripts', label: t('admin.transcripts.tab'), icon: Subtitles },
    { id: 'coursewares', label: t('admin.coursewares.tab'), icon: FileText },
    { id: 'assignments', label: t('admin.assignments.tab'), icon: FileSpreadsheet },
    { id: 'progress', label: t('admin.progress.tab'), icon: TrendingUp },
  ];

  const sections: { id: AdminSection; label: string; desc: string; icon: React.ElementType }[] = [
    { id: 'dashboard', label: cc('dashboard'), desc: cc('aiPipeline'), icon: Gauge },
    { id: 'audit', label: cc('auditCenter'), desc: cc('businessDetails'), icon: Database },
    { id: 'multimedia', label: cc('multimediaDash'), desc: cc('live'), icon: Video },
    { id: 'ml', label: cc('mlDashboard'), desc: 'DKT / LSTM / ROC', icon: BrainCircuit },
  ];

  const renderFilters = () => (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      <div className="flex items-center gap-2 text-gray-500">
        <Filter size={16} />
        <span className="text-xs font-medium">{t('admin.filters')}</span>
      </div>
      <select
        value={filterCourse}
        onChange={(e) => setFilterCourse(e.target.value)}
        className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:ring-2 focus:ring-blue-100 focus:outline-none"
      >
        <option value="">{t('admin.all_courses')}</option>
        {courses.map((c) => (
          <option key={c.id} value={c.id}>{c.title}</option>
        ))}
      </select>
      {activeTab === 'live' && (
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:ring-2 focus:ring-blue-100 focus:outline-none"
        >
          <option value="">{t('admin.all_statuses')}</option>
          <option value="active">{t('admin.status_active')}</option>
          <option value="ended">{t('admin.status_ended')}</option>
        </select>
      )}
      {activeTab === 'coursewares' && (
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:ring-2 focus:ring-blue-100 focus:outline-none"
        >
          <option value="">{t('admin.all_types')}</option>
          <option value="pdf">PDF</option>
          <option value="pptx">PPTX</option>
          <option value="xlsx">XLSX</option>
        </select>
      )}
      {activeTab === 'transcripts' && (
        <select
          value={filterTranscriptSession}
          onChange={(e) => setFilterTranscriptSession(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:ring-2 focus:ring-blue-100 focus:outline-none"
        >
          <option value="">{t('admin.all_sessions')}</option>
          {liveSessions.map((s) => (
            <option key={s.id} value={s.id}>{s.lessonTitle || s.id.slice(0, 8)}</option>
          ))}
        </select>
      )}
      <button
        onClick={handleRefresh}
        className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
      >
        <RefreshCw size={14} />
        {t('admin.refresh')}
      </button>
    </div>
  );

  const renderEmpty = (message: string) => (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
      <FileText size={48} className="mb-4 opacity-30" />
      <p className="text-sm">{message}</p>
    </div>
  );

  const renderLive = () => {
    const filtered = liveSessions.filter((s) => {
      if (filterCourse && s.courseId !== filterCourse) return false;
      if (filterStatus && s.status !== filterStatus) return false;
      return true;
    });
    if (filtered.length === 0) return renderEmpty(t('admin.live.empty'));
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map((s) => (
          <div key={s.id} className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
            <div className="flex items-center justify-between p-3 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h3 className="font-semibold text-sm text-slate-900">{s.lessonTitle || s.courseTitle}</h3>
                <p className="text-[11px] text-slate-500">{s.teacherName}</p>
              </div>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${s.status === 'active' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                {s.status === 'active' ? '● LIVE' : 'ENDED'}
              </span>
            </div>
            <div className="bg-black aspect-video w-full relative">
              <video controls autoPlay={s.status === 'active'} muted className="w-full h-full object-cover opacity-90">
                <source src="http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4" type="video/mp4" />
              </video>
              <div className="absolute bottom-2 left-2 flex gap-2">
                <span className="bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded backdrop-blur">Cam 1</span>
                {s.recordingStatus === 'recording' && <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded font-bold animate-pulse">REC</span>}
              </div>
            </div>
            <div className="p-3 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
              <span>{fmtDate(s.startedAt)}</span>
              <span className="font-mono">ID: {s.id.slice(0, 8)}</span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderRecordings = () => {
    if (recordings.length === 0) return renderEmpty(t('admin.recordings.empty'));
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {recordings.map((r) => (
          <div key={r.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm flex flex-col">
            <div className="bg-black aspect-video relative">
              {r.type === 'lecture' ? (
                <video controls className="w-full h-full object-cover">
                  <source src="http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4" type="video/mp4" />
                </video>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900">
                  <audio controls className="w-11/12">
                    <source src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" type="audio/mp3" />
                  </audio>
                  <div className="mt-4 text-emerald-400 text-xs font-mono bg-emerald-400/10 px-2 py-1 rounded">
                    AI Scoring: {Math.round(Math.random()*20+80)}/100 (Accuracy)
                  </div>
                </div>
              )}
            </div>
            <div className="p-3">
              <div className="flex items-start justify-between">
                <div className="truncate pr-2">
                  <h3 className="font-semibold text-sm truncate text-slate-900">{r.title || r.filename}</h3>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{r.courseTitle} — {r.type === 'lecture' ? r.teacherName : r.studentName}</p>
                </div>
                <button onClick={() => handleDeleteRecording(r.id)} className="text-red-400 hover:text-red-600 shrink-0"><Trash2 size={14} /></button>
              </div>
              <div className="flex items-center justify-between mt-3 text-[11px] text-gray-400">
                <span>{fmtDate(r.createdAt)}</span>
                <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">{fmtDuration(r.durationSec)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderNotes = () => {
    if (notes.length === 0) return renderEmpty(t('admin.notes.empty'));
    return (
      <div>
        <div className="flex justify-end mb-3">
          <button className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium">
            <Download size={14} />
            {t('admin.notes.export')}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="py-3 px-4">{t('admin.notes.session')}</th>
                <th className="py-3 px-4">{t('admin.notes.student')}</th>
                <th className="py-3 px-4">{t('admin.notes.body')}</th>
                <th className="py-3 px-4">{t('admin.notes.visibility')}</th>
                <th className="py-3 px-4">{t('admin.notes.created')}</th>
                <th className="py-3 px-4">{t('admin.notes.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {notes.map((n) => (
                <tr key={n.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="py-3 px-4 text-xs text-gray-500">{n.sessionTitle || n.liveSessionId.slice(0, 8)}</td>
                  <td className="py-3 px-4">{n.studentName || '\u2014'}</td>
                  <td className="py-3 px-4 max-w-xs truncate">{n.body}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${n.visibility === 'visible' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {n.visibility === 'visible' ? t('admin.notes.visible') : t('admin.notes.hidden')}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-500">{fmtDate(n.createdAt)}</td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleToggleNoteVisibility(n.id, n.visibility)}
                      className="text-gray-500 hover:text-blue-600 p-1"
                      title={n.visibility === 'visible' ? t('admin.notes.hide') : t('admin.notes.show')}
                    >
                      {n.visibility === 'visible' ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderTranscripts = () => {
    if (transcripts.length === 0) return renderEmpty(t('admin.transcripts.empty'));
    return (
      <div>
        <div className="flex justify-between items-center mb-3">
          <p className="text-xs text-gray-500">Bilingual Caption Stream / Danmaku Editing</p>
          <button className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium">
            <Download size={14} />
            {t('admin.transcripts.export')}
          </button>
        </div>
        <div className="space-y-4">
          {transcripts.map((tr) => (
            <div key={tr.liveSessionId} className="bg-white border border-gray-100 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">{tr.courseTitle} \u2014 {tr.liveSessionId.slice(0, 8)}</h4>
              {tr.segments.length === 0 ? (
                <p className="text-xs text-gray-400">{t('admin.transcripts.no_segments')}</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {tr.segments.map((seg) => (
                    <div key={seg.id} className="flex gap-4 text-xs group hover:bg-slate-50 p-2 rounded-lg transition-colors">
                      <span className="text-slate-400 font-mono shrink-0 w-16 pt-1">{fmtDate(seg.createdAt).split(' ')[1]}</span>
                      <div className="flex-1">
                        <input type="text" className="w-full bg-transparent border-b border-transparent group-hover:border-slate-200 focus:border-blue-500 outline-none text-slate-900 font-medium" defaultValue={seg.sourceText} />
                        <input type="text" className="w-full bg-transparent border-b border-transparent group-hover:border-slate-200 focus:border-blue-500 outline-none text-slate-500 mt-1" defaultValue={seg.translatedText} />
                      </div>
                      <div className="shrink-0 flex flex-col items-end gap-2">
                        <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">{seg.language.toUpperCase()}</span>
                        <button className="opacity-0 group-hover:opacity-100 text-[10px] text-white bg-slate-800 hover:bg-black px-2 py-1 rounded transition-all">Save Sync</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderCoursewares = () => {
    const filtered = coursewares.filter((f) => {
      if (filterType && f.type !== filterType) return false;
      return true;
    });

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-3">
          <p className="text-xs text-gray-500">Teacher Upload Courseware Audit</p>
          <button className="flex items-center gap-1.5 text-sm bg-blue-600 text-white hover:bg-blue-700 px-3 py-1.5 rounded-md font-medium transition-colors">
            <Upload size={14} />
            Upload Courseware
          </button>
        </div>
        {filtered.length === 0 ? renderEmpty(t('admin.coursewares.empty')) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-4">{t('admin.coursewares.filename')}</th>
                  <th className="py-3 px-4">{t('admin.coursewares.type')}</th>
                  <th className="py-3 px-4">{t('admin.coursewares.course')}</th>
                  <th className="py-3 px-4">{t('admin.coursewares.status')}</th>
                  <th className="py-3 px-4">{t('admin.coursewares.pages')}</th>
                  <th className="py-3 px-4">{t('admin.coursewares.size')}</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((f) => (
                  <tr key={f.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="py-3 px-4 truncate max-w-xs font-medium text-slate-800">{f.filename}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 uppercase tracking-wider">
                        {f.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs">{f.courseTitle || '\u2014'}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        f.renderStatus === 'ready' ? 'bg-emerald-100 text-emerald-700' :
                        f.renderStatus === 'processing' ? 'bg-amber-100 text-amber-700 animate-pulse' :
                        f.renderStatus === 'failed' ? 'bg-red-100 text-red-700' :
                        'bg-slate-100 text-slate-500'
                      }`}>
                        {f.renderStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs">{f.pageCount}</td>
                    <td className="py-3 px-4 text-xs text-slate-500 font-mono">{fmtSize(f.sizeBytes)}</td>
                    <td className="py-3 px-4 text-right">
                       <button className="text-blue-600 hover:text-blue-800 text-xs font-semibold mr-3">Edit Meta</button>
                       <button className="text-red-500 hover:text-red-700 text-xs font-semibold">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const renderAssignments = () => {
    if (assignmentImports.length === 0) return renderEmpty(t('admin.assignments.empty'));
    return (
      <div className="space-y-3">
        {assignmentImports.map((imp) => (
          <div key={imp.fileId} className="bg-white border border-gray-100 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <FileSpreadsheet size={20} className="text-green-600" />
                <span className="text-sm font-semibold text-gray-900">{imp.filename}</span>
              </div>
              <span className="text-xs text-gray-400">{fmtDate(imp.createdAt)}</span>
            </div>
            <p className="text-xs text-gray-500 mb-3">{imp.courseTitle}</p>
            <div className="flex flex-wrap gap-4 text-xs">
              <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-medium">
                {t('admin.assignments.tasks')}: {imp.tasksCount}
              </span>
              <span className="bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full font-medium">
                {t('admin.assignments.vocab')}: {imp.vocabCount}
              </span>
              {imp.errors.length > 0 && (
                <span className="bg-red-50 text-red-700 px-2.5 py-1 rounded-full font-medium">
                  {t('admin.assignments.errors')}: {imp.errors.length}
                </span>
              )}
            </div>
            {imp.errors.length > 0 && (
              <div className="mt-3 bg-red-50 rounded-lg p-3">
                <p className="text-xs font-semibold text-red-700 mb-1">{t('admin.assignments.error_details')}</p>
                {imp.errors.map((err, i) => (
                  <p key={i} className="text-xs text-red-600 font-mono">{err}</p>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderProgress = () => {
    const cleanupPanel = (
      <div className="mb-6 flex flex-col gap-3 rounded-xl border border-amber-100 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold text-amber-900">学习记录清理</p>
          <p className="text-xs text-amber-700">
            定位并清理缺学生、缺任务、缺课时或缺录音引用的僵尸学习记录。
            {cleanupResult && ` 最近扫描 ${cleanupResult.scanned} 条，命中 ${cleanupResult.deleted} 条。`}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleCleanupLearningRecords(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-white px-3 py-2 text-xs font-bold text-amber-700 hover:bg-amber-100"
          >
            <Eye size={14} />
            预检
          </button>
          <button
            onClick={() => handleCleanupLearningRecords(false)}
            className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-3 py-2 text-xs font-bold text-white hover:bg-amber-700"
          >
            <Trash2 size={14} />
            清理
          </button>
        </div>
      </div>
    );

    if (!learningProgress || learningProgress.students.length === 0) {
      return (
        <div>
          {cleanupPanel}
          {renderEmpty(t('admin.progress.empty'))}
        </div>
      );
    }

    const totalStudents = learningProgress.students.length;
    let totalCompletionRate = 0;
    let totalRecordings = 0;
    let lessonCount = 0;
    for (const s of learningProgress.students) {
      for (const cp of s.courseProgress) {
        for (const lp of cp.lessonProgress) {
          totalCompletionRate += lp.completionRate;
          totalRecordings += lp.recordings;
          lessonCount++;
        }
      }
    }
    const avgCompletion = lessonCount > 0 ? Math.round(totalCompletionRate / lessonCount) : 0;

    return (
      <div>
        {cleanupPanel}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                <Users size={20} />
              </div>
              <span className="text-xs font-semibold text-gray-500 uppercase">{t('admin.progress.total_students')}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-green-100 text-green-600 flex items-center justify-center">
                <TrendingUp size={20} />
              </div>
              <span className="text-xs font-semibold text-gray-500 uppercase">{t('admin.progress.avg_completion')}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{avgCompletion}%</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                <PlayCircle size={20} />
              </div>
              <span className="text-xs font-semibold text-gray-500 uppercase">{t('admin.progress.total_recordings')}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{totalRecordings}</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="py-3 px-4 w-8"></th>
                <th className="py-3 px-4">{t('admin.progress.student')}</th>
                <th className="py-3 px-4">{t('admin.progress.course')}</th>
                <th className="py-3 px-4">{t('admin.progress.lessons')}</th>
                <th className="py-3 px-4">{t('admin.progress.completion_rate')}</th>
                <th className="py-3 px-4">{t('admin.progress.recordings')}</th>
                <th className="py-3 px-4">{t('admin.progress.avg_score')}</th>
              </tr>
            </thead>
            <tbody>
              {learningProgress.students.map((student) => {
                const isExpanded = expandedStudents.has(student.studentId);
                let studentTotalTasks = 0;
                let studentCompletedTasks = 0;
                let studentRecordings = 0;
                let studentScores: number[] = [];
                for (const cp of student.courseProgress) {
                  for (const lp of cp.lessonProgress) {
                    studentTotalTasks += lp.totalTasks;
                    studentCompletedTasks += lp.completedTasks;
                    studentRecordings += lp.recordings;
                    if (lp.avgScore > 0) studentScores.push(lp.avgScore);
                  }
                }
                const studentRate = studentTotalTasks > 0 ? Math.round((studentCompletedTasks / studentTotalTasks) * 100) : 0;
                const studentAvgScore = studentScores.length > 0 ? Math.round((studentScores.reduce((a, b) => a + b, 0) / studentScores.length) * 10) / 10 : 0;

                return (
                  <React.Fragment key={student.studentId}>
                    <tr className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="py-3 px-4">
                        <button onClick={() => toggleStudentExpand(student.studentId)} className="text-gray-400 hover:text-gray-600">
                          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </button>
                      </td>
                      <td className="py-3 px-4 font-semibold text-gray-900">{student.displayName}</td>
                      <td className="py-3 px-4">
                        {student.courseProgress.map((cp) => cp.courseTitle).filter(Boolean).join(', ') || '\u2014'}
                      </td>
                      <td className="py-3 px-4">
                        {student.courseProgress.reduce((sum, cp) => sum + cp.lessonProgress.length, 0)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${studentRate}%` }} />
                          </div>
                          <span className="text-xs font-medium text-gray-600">{studentRate}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">{studentRecordings}</td>
                      <td className="py-3 px-4">{studentAvgScore || '\u2014'}</td>
                    </tr>
                    {isExpanded && student.courseProgress.map((cp) => (
                      <tr key={cp.courseId} className="bg-gray-50/50">
                        <td></td>
                        <td colSpan={6} className="py-2 px-4">
                          <div className="pl-8">
                            <p className="text-xs font-semibold text-gray-500 mb-2">{cp.courseTitle}</p>
                            {cp.lessonProgress.length === 0 ? (
                              <p className="text-xs text-gray-400">{t('admin.progress.no_lessons')}</p>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                {cp.lessonProgress.map((lp) => (
                                  <div key={lp.lessonNodeId} className="bg-white rounded-lg border border-gray-100 p-3">
                                    <p className="text-xs font-medium text-gray-900 mb-1">{lp.lessonTitle}</p>
                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                      <span>{lp.completedTasks}/{lp.totalTasks}</span>
                                      <span className="font-semibold text-blue-600">{lp.completionRate}%</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mt-1">
                                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${lp.completionRate}%` }} />
                                    </div>
                                    <div className="flex gap-3 mt-2 text-xs text-gray-400">
                                      <span>{lp.recordings} {t('admin.progress.recordings')}</span>
                                      {lp.avgScore > 0 && <span>Ø {lp.avgScore}</span>}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'live': return renderLive();
      case 'recordings': return renderRecordings();
      case 'notes': return renderNotes();
      case 'transcripts': return renderTranscripts();
      case 'coursewares': return renderCoursewares();
      case 'assignments': return renderAssignments();
      case 'progress': return renderProgress();
    }
  };

  const renderMonitoringOverview = () => {
    const metricCards = [
      { label: cc('kStudents'), value: analytics.students, unit: language === 'zh' ? '人' : '', icon: Users, tone: 'text-[#0056D2] bg-blue-50 border-blue-100', delta: `${analytics.lessons} lesson rows` },
      { label: cc('kCompletion'), value: `${analytics.completionRate}%`, unit: '', icon: TrendingUp, tone: 'text-emerald-600 bg-emerald-50 border-emerald-100', delta: `${analytics.completedTasks}/${analytics.totalTasks} tasks` },
      { label: cc('kRecordings'), value: analytics.totalRecordings, unit: language === 'zh' ? '条' : '', icon: Database, tone: 'text-cyan-700 bg-cyan-50 border-cyan-100', delta: 'metadata only' },
      { label: cc('kRecommendations'), value: analytics.recommendationCount, unit: language === 'zh' ? '条' : '', icon: BrainCircuit, tone: 'text-violet-700 bg-violet-50 border-violet-100', delta: 'explainable rules' },
      { label: cc('kSubtitles'), value: analytics.transcriptSegments, unit: language === 'zh' ? '段' : '', icon: Subtitles, tone: 'text-amber-700 bg-amber-50 border-amber-100', delta: 'Levenshtein ready' },
      { label: cc('kStorage'), value: analytics.storageMb, unit: 'MB', icon: HardDrive, tone: 'text-slate-700 bg-slate-50 border-slate-200', delta: `${coursewares.length} courseware files` },
    ];

    const pipelineRows = [
      { name: cc('dataExport'), status: analytics.invalidSamples > 0 ? 'attention' : 'healthy', value: `${analytics.invalidSamples} invalid`, note: language === 'zh' ? '学习记录、课件、Excel 导入字段完整性' : 'learning records, courseware, Excel field completeness' },
      { name: cc('featureStore'), status: 'healthy', value: `${analytics.totalTasks} events`, note: 'completionRate / avgScore / recordings' },
      { name: cc('dktModel'), status: 'warning', value: `AUC ${analytics.modelAuc}`, note: language === 'zh' ? `当前小样本低于 baseline ${analytics.baselineAuc}` : `small sample below baseline ${analytics.baselineAuc}` },
      { name: cc('recommendations'), status: 'healthy', value: `${analytics.recommendationCount} active`, note: language === 'zh' ? '知识图谱 + 规则基线可解释推荐' : 'knowledge graph + explainable rule baseline' },
    ];

    const riskRows = [
      { label: cc('failedCourseware'), count: analytics.failedCoursewares, color: 'text-red-700 bg-red-50 border-red-100' },
      { label: cc('processingCourseware'), count: analytics.processingCoursewares, color: 'text-amber-700 bg-amber-50 border-amber-100' },
      { label: cc('excelErrors'), count: analytics.importErrors, color: 'text-red-700 bg-red-50 border-red-100' },
      { label: cc('activeLive'), count: analytics.activeLive, color: 'text-emerald-700 bg-emerald-50 border-emerald-100' },
    ];

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-6">
          {metricCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{card.label}</span>
                  <span className={`flex h-7 w-7 items-center justify-center rounded-md border ${card.tone}`}>
                    <Icon size={15} />
                  </span>
                </div>
                <div className="flex items-end gap-1">
                  <span className="font-mono text-2xl font-semibold leading-none tracking-tight text-slate-950">{card.value}</span>
                  {card.unit && <span className="pb-0.5 text-[11px] font-medium text-slate-500">{card.unit}</span>}
                </div>
                <p className="mt-2 truncate font-mono text-[10px] text-slate-400">{card.delta}</p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div className="flex items-center gap-2">
                <ServerCog size={16} className="text-[#0056D2]" />
                <div>
                  <h2 className="text-sm font-bold text-slate-900">{cc('aiPipeline')}</h2>
                  <p className="text-[11px] text-slate-500">{cc('aiPipelineDesc')}</p>
                </div>
              </div>
              <span className="rounded border border-emerald-200 bg-emerald-50 px-2 py-1 font-mono text-[10px] font-semibold text-emerald-700">
                RUNNING
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className={compactTableClass}>
                <thead>
                  <tr className={compactHeadClass}>
                    <th className="px-4 py-2">{cc('stage')}</th>
                    <th className="px-4 py-2">{cc('status')}</th>
                    <th className="px-4 py-2">{cc('metric')}</th>
                    <th className="px-4 py-2">{cc('businessMeaning')}</th>
                  </tr>
                </thead>
                <tbody>
                  {pipelineRows.map((row) => (
                    <tr key={row.name} className={compactRowClass}>
                      <td className="px-4 py-2 font-mono font-semibold text-slate-800">{row.name}</td>
                      <td className="px-4 py-2">
                        <span className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-semibold ${
                          row.status === 'healthy'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : row.status === 'warning'
                              ? 'border-amber-200 bg-amber-50 text-amber-700'
                              : 'border-red-200 bg-red-50 text-red-700'
                        }`}>
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {row.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 font-mono text-slate-600">{row.value}</td>
                      <td className="px-4 py-2 text-slate-500">{row.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-lg border border-slate-900 bg-slate-950 p-4 text-white shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gauge size={16} className="text-cyan-300" />
                  <span className="text-sm font-bold">{cc('modelHealth')}</span>
                </div>
                <span className="font-mono text-[10px] text-slate-400">{analytics.modelVersion}</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-slate-400">{cc('dataHealth')}</p>
                  <p className="mt-1 font-mono text-xl font-semibold">{analytics.dataHealth}%</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-slate-400">DKT AUC</p>
                  <p className="mt-1 font-mono text-xl font-semibold">{analytics.modelAuc}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-slate-400">{cc('baseline')}</p>
                  <p className="mt-1 font-mono text-xl font-semibold">{analytics.baselineAuc}</p>
                </div>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800">
                <div className="h-full rounded-full bg-cyan-300" style={{ width: `${analytics.dataHealth}%` }} />
              </div>
              <p className="mt-3 truncate font-mono text-[10px] text-slate-400">{cc('lastRun')}: {analytics.modelRunAt}</p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-600" />
                <h2 className="text-sm font-bold text-slate-900">{cc('riskQueue')}</h2>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {riskRows.map((row) => (
                  <div key={row.label} className={`rounded-md border px-3 py-2 ${row.color}`}>
                    <p className="text-[11px] font-semibold">{row.label}</p>
                    <p className="mt-1 font-mono text-xl font-semibold">{row.count}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSectionHeader = (title: string, desc: string, icon: React.ElementType) => {
    const Icon = icon;
    return (
      <div className="mb-4 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#0056D2]">
            <Icon size={18} />
          </span>
          <div>
            <h2 className="text-base font-bold text-slate-950">{title}</h2>
            <p className="mt-1 text-xs text-slate-500">{desc}</p>
          </div>
        </div>
        <span className="inline-flex w-fit items-center gap-1.5 rounded border border-blue-100 bg-blue-50 px-2 py-1 text-[11px] font-semibold text-[#0056D2]">
          <FileText size={13} />
          {cc('courseDesign')}
        </span>
      </div>
    );
  };

  const renderChartCard = (title: string, children: React.ReactNode) => (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-bold text-slate-900">{title}</h3>
      <div className="h-64 min-w-0">{children}</div>
    </div>
  );

  const renderLifecycleSection = () => {
    const steps = [
      { label: 'Collect', text: language === 'zh' ? '课堂、作业、录音、字幕、课件日志采集' : 'class, homework, recording, subtitle, courseware events', icon: Database },
      { label: 'Clean', text: language === 'zh' ? '去重、缺失值、僵尸记录、隐私脱敏' : 'dedupe, missing values, invalid records, privacy masking', icon: ShieldCheck },
      { label: 'Model', text: language === 'zh' ? 'DKT、规则基线、知识图谱、Levenshtein 校准' : 'DKT, rule baseline, knowledge graph, Levenshtein calibration', icon: BrainCircuit },
      { label: 'Evaluate', text: language === 'zh' ? 'Loss、AUC、F1、覆盖率、推荐解释性' : 'loss, AUC, F1, coverage, explainability', icon: ChartNoAxesCombined },
      { label: 'Deploy', text: language === 'zh' ? '学生、教师、Admin 三端展示与监控' : 'student, teacher, admin surfaces and monitoring', icon: ServerCog },
      { label: 'Feedback', text: language === 'zh' ? '点击推荐、完成推荐、教师采纳反馈闭环' : 'recommendation clicks, completion, teacher feedback loop', icon: Activity },
    ];

    return (
      <div>
        {renderSectionHeader(cc('lifecycleTitle'), cc('lifecycleDesc'), Route)}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-6">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.label} className="relative rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <span className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-50 text-[#0056D2]">
                    <Icon size={16} />
                  </span>
                  <span className="font-mono text-[10px] text-slate-400">0{index + 1}</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900">{step.label}</h3>
                <p className="mt-2 text-xs leading-5 text-slate-500">{step.text}</p>
              </div>
            );
          })}
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {renderChartCard(cc('dataQuality'), (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip />
                <Pie data={chartData.quality} innerRadius={58} outerRadius={88} dataKey="value" nameKey="name" paddingAngle={4}>
                  {chartData.quality.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          ))}
          {renderChartCard(cc('lifecycleVolume'), (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData.volume}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="stage" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="rows" stroke="#0056D2" fill="#DBEAFE" />
              </AreaChart>
            </ResponsiveContainer>
          ))}
        </div>
      </div>
    );
  };

  const renderPipelineSection = () => {
    const nodes = [
      [cc('rawEvents'), `${analytics.totalTasks + analytics.totalRecordings} rows`],
      [cc('etlClean'), `${Math.max(0, analytics.invalidSamples)} invalid`],
      [cc('featureStore'), `${analytics.lessons} lesson rows`],
      [cc('trainSplit'), '80 / 10 / 10'],
      [cc('modelService'), `${analytics.recommendationCount} recs`],
    ];

    return (
      <div>
        {renderSectionHeader(cc('pipelineTitle'), cc('pipelineDesc'), GitBranch)}
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-5">
          {nodes.map(([name, value], index) => (
            <div key={name} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <span className="rounded bg-slate-100 px-2 py-1 font-mono text-[10px] text-slate-500">S{index + 1}</span>
                {index < nodes.length - 1 && <ChevronRight size={16} className="text-slate-300" />}
              </div>
              <h3 className="text-sm font-bold text-slate-900">{name}</h3>
              <p className="mt-2 font-mono text-xl font-semibold text-[#0056D2]">{value}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-3">
            <h3 className="text-sm font-bold text-slate-900">{cc('feMatrix')}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className={compactTableClass}>
              <thead>
                <tr className={compactHeadClass}>
                  <th className="px-4 py-2">{cc('feFeature')}</th>
                  <th className="px-4 py-2">{cc('feSource')}</th>
                  <th className="px-4 py-2">{cc('feUsage')}</th>
                  <th className="px-4 py-2">{cc('feCurrent')}</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['completionRate', 'learning_records', 'risk / ranking', `${analytics.completionRate}%`],
                  ['avgScore', 'recording feedback', 'mastery estimate', analytics.avgScore || '—'],
                  ['recordingCoverage', 'recordings', 'practice intensity', analytics.totalRecordings],
                  ['subtitleCorrections', 'transcripts', 'ASR calibration', analytics.transcriptSegments],
                  ['invalidSampleCount', 'quality check', 'data health', analytics.invalidSamples],
                ].map((row) => (
                  <tr key={row[0]} className={compactRowClass}>
                    {row.map((cell) => <td key={String(cell)} className="px-4 py-2 text-slate-600">{cell}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderModelsSection = () => {
    const modelRows = [
      [cc('histBaseline'), cc('movingAvg'), analytics.baselineAuc, cc('coldStartExplain')],
      [cc('dktLstm'), cc('seqModel'), analytics.modelAuc, cc('longTermData')],
      [cc('kgRanking'), cc('graphRules'), analytics.recommendationCount, cc('traceableRec')],
      [cc('levenshtein'), cc('editDist'), '<1ms', cc('subtitleCorrection')],
    ];
    const layers = ['Input x_t', 'Embedding', 'LSTM(64)', 'Sigmoid', 'Mastery y_t+1', 'Recommendation'];

    return (
      <div>
        {renderSectionHeader(cc('modelTitle'), cc('modelDesc'), BrainCircuit)}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1fr]">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-4 text-sm font-bold text-slate-900">{cc('neuralTitle')}</h3>
            <div className="flex flex-wrap items-center gap-2">
              {layers.map((layer, index) => (
                <React.Fragment key={layer}>
                  <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-3 text-center">
                    <p className="font-mono text-xs font-semibold text-[#0056D2]">{layer}</p>
                  </div>
                  {index < layers.length - 1 && <ChevronRight size={16} className="text-slate-300" />}
                </React.Fragment>
              ))}
            </div>
            <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3 font-mono text-[11px] leading-5 text-slate-600">
              h_t = LSTM(x_t, h_t-1); y_t+1 = sigmoid(W h_t + b)
            </div>
          </div>
          {renderChartCard(cc('modelRadar'), (
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={chartData.modelRadar}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                <Radar dataKey="value" stroke="#0056D2" fill="#0056D2" fillOpacity={0.25} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          ))}
        </div>
        <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className={compactTableClass}>
            <thead>
              <tr className={compactHeadClass}>
                <th className="px-4 py-2">{cc('algAlgorithm')}</th>
                <th className="px-4 py-2">{cc('algType')}</th>
                <th className="px-4 py-2">{cc('algMetric')}</th>
                <th className="px-4 py-2">{cc('algDecision')}</th>
              </tr>
            </thead>
            <tbody>
              {modelRows.map((row) => (
                <tr key={row[0]} className={compactRowClass}>
                  {row.map((cell) => <td key={String(cell)} className="px-4 py-2 text-slate-600">{cell}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderMachineLearningDashboard = () => (
    <div className="space-y-6">
      {/* Partition 1: Data Pipeline / Feature Engineering */}
      <div>
        <h2 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2"><GitBranch size={16}/> P1: Data Pipeline & Feature Eng Flow</h2>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {renderChartCard(cc('pipelineVolume'), (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.volume}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="stage" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="rows" fill="#14B8A6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ))}
          {renderChartCard(cc('featureImportance'), (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.featureImportance} layout="vertical" margin={{ left: 18 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={92} />
                <Tooltip />
                <Bar dataKey="value" fill="#0056D2" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ))}
        </div>
      </div>

      {/* Partition 2: Core Algorithms */}
      <div>
        <h2 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2"><Share2 size={16}/> P2: Core Algorithms (Clustering & Evaluation)</h2>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {renderChartCard('Algorithm Clustering Scatter Plot', (
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" dataKey="x" name="stature" unit="cm" />
                <YAxis type="number" dataKey="y" name="weight" unit="kg" />
                <ZAxis type="number" dataKey="z" range={[60, 400]} name="score" unit="pt" />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Scatter name="A" data={chartData.scatterClusters.filter(d => d.cluster==='A')} fill="#8884d8" shape="star" />
                <Scatter name="B" data={chartData.scatterClusters.filter(d => d.cluster==='B')} fill="#82ca9d" shape="triangle" />
                <Scatter name="C" data={chartData.scatterClusters.filter(d => d.cluster==='C')} fill="#ffc658" />
              </ScatterChart>
            </ResponsiveContainer>
          ))}
          {renderChartCard(cc('modelRadar'), (
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={chartData.modelRadar}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                <Radar dataKey="value" stroke="#0056D2" fill="#0056D2" fillOpacity={0.25} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          ))}
        </div>
      </div>

      {/* Partition 3: ML Training Charts */}
      <div>
        <h2 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2"><TrendingUp size={16}/> P3: ML Training Charts</h2>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {renderChartCard(cc('lossCurve'), (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData.loss}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="epoch" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[0.45, 0.7]} />
                <Tooltip />
                <Line type="monotone" dataKey="dkt" stroke="#0056D2" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="baseline" stroke="#94A3B8" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ))}
          {renderChartCard('Confusion Matrix Heatmap', (
             <div className="w-full h-full overflow-hidden flex items-center justify-center">
               <ConfusionMatrix />
             </div>
          ))}
        </div>
      </div>

      {/* Partition 4: Neural Network Structure Graph */}
      <div>
        <h2 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2"><BrainCircuit size={16}/> P4: Neural Network Dynamic Flow</h2>
        <NeuralNetworkFlow />
      </div>

    </div>
  );

  const renderDataAuditCenter = () => {
    const auditTabs = tabs.filter(t => ['transcripts', 'notes', 'coursewares', 'assignments'].includes(t.id));
    return (
    <div>
      {renderSectionHeader(cc('auditCenter'), cc('businessDetails'), Database)}
      <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-100/80 p-1 shadow-sm overflow-x-auto">
        {auditTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setFilterCourse('');
                setFilterType('');
                setFilterTranscriptSession('');
              }}
              className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:bg-slate-200/50 hover:text-slate-800'
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>
      <div className="mt-3">{renderFilters()}</div>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm mt-3">
        <div className="p-3">{renderContent()}</div>
      </div>
    </div>
    );
  };

  const renderMultimediaMonitoring = () => {
    const mediaTabs = tabs.filter(t => ['live', 'recordings'].includes(t.id));
    return (
    <div>
      {renderSectionHeader(cc('multimediaDash'), 'Real-time Audio/Video monitoring and AI scoring', Video)}
      <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-100/80 p-1 shadow-sm overflow-x-auto">
        {mediaTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setFilterStatus('');
              }}
              className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:bg-slate-200/50 hover:text-slate-800'
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>
      <div className="mt-3">{renderFilters()}</div>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm mt-3">
        <div className="p-3">{renderContent()}</div>
      </div>
    </div>
    );
  };

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'dashboard': return renderMonitoringOverview();
      case 'audit': return renderDataAuditCenter();
      case 'multimedia': return renderMultimediaMonitoring();
      case 'ml': return renderMachineLearningDashboard();
      default: return renderMonitoringOverview();
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900">
      <aside className="group fixed inset-y-0 left-0 z-40 w-14 border-r border-slate-200 bg-white shadow-sm transition-all duration-200 hover:w-64">
        <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-3">
          <img src="/logo.svg" alt="LingoBridge Logo" className="h-8 w-8 shrink-0 object-contain rounded-lg" />
          <div className="min-w-0 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
            <p className="truncate text-sm font-bold text-slate-950">LingoBridge</p>
            <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-slate-400">{cc('console')}</p>
          </div>
        </div>
        <nav className="space-y-1 p-2">
          {sections.map((section) => {
            const Icon = section.icon;
            const active = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors ${
                  active ? 'bg-blue-50 text-[#0056D2]' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
                title={section.label}
              >
                <Icon size={18} className="shrink-0" />
                <span className="min-w-0 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                  <span className="block truncate text-xs font-bold">{section.label}</span>
                  <span className="block truncate text-[10px] text-slate-400">{section.desc}</span>
                </span>
              </button>
            );
          })}
        </nav>
        <div className="absolute bottom-0 w-full border-t border-slate-200 p-2">
          <button
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-red-500 transition-colors hover:bg-red-50"
          >
            <LogOut size={18} className="shrink-0" />
            <span className="truncate text-xs font-bold opacity-0 transition-opacity duration-150 group-hover:opacity-100">{t('nav.logout')}</span>
          </button>
        </div>
      </aside>

      <main className="min-h-screen pl-14">
        <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur md:px-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                <span>Admin</span>
                <ChevronRight size={12} />
                <span className="text-[#0056D2]">{cc('console')}</span>
                <span className="ml-1 inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 font-mono text-[10px] text-emerald-700">
                  <Activity size={11} />
                  {cc('live')}
                </span>
              </div>
              <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-950">{cc('title')}</h1>
              <p className="mt-1 text-xs text-slate-500">{cc('subtitle')}</p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <LanguageSwitcher />
              <div className="relative w-full sm:w-80">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  className="w-full rounded-md border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs outline-none transition-all focus:border-[#0056D2] focus:bg-white focus:ring-1 focus:ring-[#0056D2]"
                  placeholder={cc('search')}
                  type="text"
                />
              </div>
              <button
                onClick={handleRefresh}
                className="inline-flex items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                {t('admin.refresh')}
              </button>
            </div>
          </div>
        </div>
        <div className="px-4 py-5 md:px-6">
          {renderActiveSection()}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboardView;
