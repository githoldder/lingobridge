import React from 'react';
import { ArrowLeft, Brain, ChevronRight, Network, Sparkles, Target } from 'lucide-react';

interface KnowledgeGraphViewProps {
  onNavigate?: (target: string) => void;
}

const nodes = [
  { id: 'initials', label: '声母 Initials', mastery: 84, color: 'bg-blue-500', desc: 'b/p/m/f, zh/ch/sh, z/c/s' },
  { id: 'finals', label: '韵母 Finals', mastery: 78, color: 'bg-emerald-500', desc: 'ai/ei/ui, an/en/in, ang/eng/ing' },
  { id: 'tone3', label: 'Tone 3 上声', mastery: 62, color: 'bg-amber-500', desc: '降升曲线和连读变调' },
  { id: 'tone4', label: 'Tone 4 去声', mastery: 54, color: 'bg-rose-500', desc: '高起急降，句尾力度不足' },
  { id: 'words', label: '词语 Words', mastery: 72, color: 'bg-indigo-500', desc: '核心课堂词卡和作业词汇' },
];

const edges = [
  ['声母', '拼音组合'],
  ['韵母', '拼音组合'],
  ['声调', '可懂度评分'],
  ['Tone 4', 'AI 专项练习'],
  ['词语', '课后作业'],
];

const KnowledgeGraphView: React.FC<KnowledgeGraphViewProps> = ({ onNavigate }) => {
  return (
    <div id="knowledge-graph-view" className="space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => onNavigate?.('dashboard')}
          className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-600 hover:border-[#0056D2] hover:text-[#0056D2] transition-colors"
        >
          <ArrowLeft size={16} />
          返回首页
        </button>
        <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-xs font-black text-[#0056D2] border border-blue-100">
          <Sparkles size={14} />
          DKT-Acoustics Knowledge Trace
        </div>
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-[2.5rem] bg-white border border-gray-100 p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gray-900 text-white flex items-center justify-center">
              <Network size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900">中文学习知识图谱</h1>
              <p className="text-sm text-gray-500 font-medium">按发音、声调、词汇与作业表现生成的学生端追踪视图</p>
            </div>
          </div>

          <div className="relative min-h-[420px] rounded-[2rem] bg-gray-50 border border-gray-100 overflow-hidden p-6">
            <div className="absolute inset-x-10 top-1/2 h-px bg-gray-200" />
            <div className="absolute left-1/2 top-10 bottom-10 w-px bg-gray-200" />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5 relative z-10">
              {nodes.map((node) => (
                <button
                  key={node.id}
                  type="button"
                  onClick={() => node.id === 'tone4' && onNavigate?.('homework')}
                  className="min-h-36 rounded-3xl bg-white border border-gray-100 p-5 text-left shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all"
                >
                  <div className={`w-10 h-10 rounded-2xl ${node.color} text-white flex items-center justify-center mb-4`}>
                    <Brain size={20} />
                  </div>
                  <div className="text-sm font-black text-gray-900">{node.label}</div>
                  <div className="text-xs text-gray-500 mt-2 leading-relaxed">{node.desc}</div>
                  <div className="mt-4 h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div className={`h-full ${node.color}`} style={{ width: `${node.mastery}%` }} />
                  </div>
                  <div className="mt-2 text-[10px] font-black text-gray-400 uppercase">{node.mastery}% mastery</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-[2.5rem] bg-gray-900 text-white p-7 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <Target size={22} className="text-rose-300" />
              <h2 className="text-lg font-black">AI 当前建议</h2>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed">
              Tone 4 去声仍是当前最薄弱节点，建议进入“我的学习路径”完成专项纠错练习。
            </p>
            <button
              type="button"
              onClick={() => onNavigate?.('homework')}
              className="mt-6 w-full rounded-2xl bg-white text-gray-900 py-3 text-sm font-black flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors"
            >
              进入 AI 专项
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="rounded-[2.5rem] bg-white border border-gray-100 p-7 shadow-sm">
            <h2 className="text-lg font-black text-gray-900 mb-5">依赖链</h2>
            <div className="space-y-3">
              {edges.map(([from, to]) => (
                <div key={`${from}-${to}`} className="flex items-center gap-3 text-sm font-bold text-gray-600">
                  <span className="rounded-xl bg-gray-50 px-3 py-2">{from}</span>
                  <ChevronRight size={14} className="text-gray-300" />
                  <span className="rounded-xl bg-blue-50 text-[#0056D2] px-3 py-2">{to}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
};

export default KnowledgeGraphView;
