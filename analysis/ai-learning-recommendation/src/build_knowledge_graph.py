import os
import json
import networkx as nx
import matplotlib.pyplot as plt

def build_graph():
    os.makedirs('output', exist_ok=True)
    
    # 1. 初始化有向图
    G = nx.DiGraph()

    # 知识点定义
    skills = {
        0: ('Initial_b', 'Pinyin'), 1: ('Initial_p', 'Pinyin'),
        2: ('Final_a', 'Pinyin'), 3: ('Final_o', 'Pinyin'),
        4: ('Tone_1', 'Tone'), 5: ('Tone_2', 'Tone'),
        6: ('Tone_3', 'Tone'), 7: ('Tone_4', 'Tone'),
        8: ('Char_ba', 'Character'), 9: ('Char_ma', 'Character'),
        10: ('Char_po', 'Character'),
        11: ('Vocab_baba', 'Vocabulary'), 12: ('Vocab_mama', 'Vocabulary'),
        13: ('Vocab_popo', 'Vocabulary')
    }

    # 添加节点
    for k, (name, category) in skills.items():
        G.add_node(k, name=name, category=category)

    # 2. 建立前置依赖依赖边 (PREREQUISITE_OF)
    # 拼音声母/韵母/声调 -> 汉字拼读
    edges = [
        (0, 8), (2, 8), (7, 8),   # Initial_b + Final_a + Tone_4 -> Char_ba
        (2, 9), (4, 9),           # Final_a + Tone_1 -> Char_ma (省略声母m)
        (1, 10), (3, 10), (5, 10), # Initial_p + Final_o + Tone_2 -> Char_po
        # 汉字 -> 词汇
        (8, 11),  # Char_ba -> Vocab_baba
        (9, 12),  # Char_ma -> Vocab_mama
        (10, 13)  # Char_po -> Vocab_popo
    ]
    G.add_edges_from(edges)

    # 3. 计算图论指标 (PageRank, 度中心性)
    pageranks = nx.pagerank(G)
    in_degrees = dict(G.in_degree())
    out_degrees = dict(G.out_degree())

    # 4. 导出 JSON 数据，供学生端 Mind Map 渲染使用
    graph_data = {
        "nodes": [],
        "links": []
    }
    
    for node in G.nodes:
        graph_data["nodes"].append({
            "id": int(node),
            "name": skills[node][0],
            "category": skills[node][1],
            "pagerank": float(pageranks[node]),
            "in_degree": int(in_degrees[node]),
            "out_degree": int(out_degrees[node])
        })
        
    for source, target in G.edges:
        graph_data["links"].append({
            "source": int(source),
            "target": int(target),
            "type": "PREREQUISITE_OF"
        })

    with open('output/knowledge_graph.json', 'w', encoding='utf-8') as f:
        json.dump(graph_data, f, ensure_ascii=False, indent=2)

    # 5. 绘制极精美的出版物级学术拓扑图
    plt.figure(figsize=(10, 8), dpi=300)
    
    # 节点分类上色
    color_map = {
        'Pinyin': '#4F46E5',      # Indigo
        'Tone': '#F59E0B',        # Amber
        'Character': '#10B981',   # Emerald
        'Vocabulary': '#EF4444'   # Red
    }
    node_colors = [color_map[skills[node][1]] for node in G.nodes]
    
    # 节点大小由 PageRank 决定
    node_sizes = [2000 + pageranks[node] * 10000 for node in G.nodes]

    # 采用 Spring 布局
    pos = nx.spring_layout(G, seed=42, k=0.8)
    
    # 绘制边和节点
    nx.draw_networkx_edges(G, pos, edge_color='#D1D5DB', width=2, arrowsize=20, connectionstyle="arc3,rad=0.1")
    nx.draw_networkx_nodes(G, pos, node_color=node_colors, node_size=node_sizes, alpha=0.9)
    
    # 绘制文字标签
    labels = {node: skills[node][0] for node in G.nodes}
    nx.draw_networkx_labels(G, pos, labels=labels, font_size=8, font_color='white', font_weight='bold')

    plt.title("LingoBridge CN-KG Topological Dependencies Matrix", fontsize=12, fontweight='bold', pad=20)
    plt.axis('off')
    plt.tight_layout()
    plt.savefig('output/knowledge_graph.png', bbox_inches='tight')
    plt.close()
    
    print(f"==> Built Chinese Knowledge Graph. Exported JSON and high-res Topological Map PNG.")

if __name__ == '__main__':
    build_graph()
