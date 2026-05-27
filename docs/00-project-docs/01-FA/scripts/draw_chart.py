import os
import matplotlib.pyplot as plt
import numpy as np

# Ensure figures folder exists
os.makedirs('figures', exist_ok=True)

# Simulate requests and cost data
requests = np.arange(0, 10001, 500)
# Uncached cost grows strictly linearly (approx 0.005 CNY per query)
cost_no_cache = requests * 0.005
# Cached cost approaches asymptotic limit of 85% savings as hits grow
cost_with_cache = 0.005 * requests * (0.15 + 0.85 * np.exp(-requests / 2000))

# Custom professional sizing
fig, ax = plt.subplots(figsize=(6.5, 4.2), dpi=300)

# Plots
ax.plot(requests, cost_no_cache, label='无缓存架构 (Linear Uncached Cost)', color='#EF4444', linewidth=2.2, linestyle='--')
ax.plot(requests, cost_with_cache, label='双层缓存架构 (Asymptotic Cached Cost)', color='#10B981', linewidth=2.8)

# Shading for saved costs
ax.fill_between(requests, cost_no_cache, cost_with_cache, color='#10B981', alpha=0.12, label='累计节省预算 (Cost Savings ~85%)')

# Grid and styling
ax.grid(True, linestyle=':', alpha=0.6, color='#D1D5DB')
ax.spines['top'].set_visible(False)
ax.spines['right'].set_visible(False)
ax.spines['left'].set_color('#9CA3AF')
ax.spines['bottom'].set_color('#9CA3AF')

# Fonts fallback for cross-platform Chinese rendering
plt.rcParams['font.sans-serif'] = ['Arial Unicode MS', 'SimHei', 'STHeiti', 'sans-serif']
plt.rcParams['axes.unicode_minus'] = False

# Titles & Labels
ax.set_title('LingoBridge 平台语音交互 API 累计运行成本对比', fontsize=12, fontweight='bold', pad=15)
ax.set_xlabel('累计语音请求次数 (Requests)', fontsize=9.5, labelpad=8)
ax.set_ylabel('累计调用费用 / 元 (Total Cost in CNY)', fontsize=9.5, labelpad=8)

ax.set_xlim(0, 10000)
ax.set_ylim(0, 52)

# Legends
ax.legend(loc='upper left', frameon=True, facecolor='white', edgecolor='#F3F4F6', fontsize=8.5)
plt.tight_layout()

# Save as PDF vector graphic and PNG preview
plt.savefig('figures/cost_comparison.pdf', format='pdf', bbox_inches='tight')
plt.savefig('figures/cost_comparison.png', format='png', bbox_inches='tight')
print("Chart successfully generated at figures/cost_comparison.pdf")
