import os
import numpy as np
import pandas as pd

def generate_logs():
    np.random.seed(42)
    os.makedirs('data', exist_ok=True)
    os.makedirs('output', exist_ok=True)

    # 1. 知识点与关联字典
    # K0: b, K1: p, K2: a, K3: o, K4: 1st Tone, K5: 2nd Tone, K6: 3rd Tone, K7: 4th Tone
    # K8: 爸, K9: 妈, K10: 婆, K11: 爸爸, K12: 妈妈, K13: 婆婆
    skills = {
        0: 'Initial_b', 1: 'Initial_p', 2: 'Final_a', 3: 'Final_o',
        4: 'Tone_1', 5: 'Tone_2', 6: 'Tone_3', 7: 'Tone_4',
        8: 'Character_ba', 9: 'Character_ma', 10: 'Character_po',
        11: 'Vocabulary_baba', 12: 'Vocabulary_mama', 13: 'Vocabulary_popo'
    }

    # 2. 题库设计 (每个题目有主知识点，以及关联的前置辅助知识点列表)
    # 格式：{item_id: (main_skill, auxiliary_skills)}
    items = {
        101: (0, [2]),      # 拼读 ba
        102: (1, [3]),      # 拼读 po
        103: (4, [2]),      # 第一声 a
        104: (7, [2]),      # 第四声 a
        105: (5, [3]),      # 第二声 o
        106: (8, [0, 2, 7]),  # 汉字 爸 (b + a + Tone_4)
        107: (9, [2, 4]),     # 汉字 妈 (m + a + Tone_1) -> 简化m为a的一部分
        108: (10, [1, 3, 5]), # 汉字 婆 (p + o + Tone_2)
        109: (11, [8]),       # 词汇 爸爸
        110: (12, [9]),       # 词汇 妈妈
        111: (13, [10])       # 词汇 婆婆
    }

    # 3. 模拟 100 名学生的学习日志
    # 每个学生有自己独特的基础能力向量 (14维，对应14个知识点的初始掌握度)
    num_students = 100
    logs = []

    for student_id in range(1, num_students + 1):
        # 不同的学生类型：优秀生、声调薄弱生、拼音薄弱生
        student_type = np.random.choice(['excellent', 'weak_tone', 'weak_initial', 'average'], p=[0.2, 0.25, 0.15, 0.4])
        
        # 初始能力分布
        abilities = np.random.uniform(0.3, 0.6, 14)
        if student_type == 'excellent':
            abilities += 0.25
        elif student_type == 'weak_tone':
            abilities[[4, 5, 6, 7]] -= 0.25 # 声调能力极差
        elif student_type == 'weak_initial':
            abilities[[0, 1]] -= 0.3 # 拼音双唇音不分

        abilities = np.clip(abilities, 0.05, 0.95)

        # 每个学生模拟 50 次答题行为
        # DKT 要求序列有先后依赖，这里按照题目难易程度大致升序模拟
        item_sequence = []
        for _ in range(50):
            # 80% 概率选择难度相近的题，20% 随机
            if len(item_sequence) < 15:
                # 刚开始学基础声韵母和声调
                candidates = [101, 102, 103, 104, 105]
            elif len(item_sequence) < 35:
                # 进阶学汉字
                candidates = [101, 102, 103, 104, 105, 106, 107, 108]
            else:
                # 进阶学词汇
                candidates = [106, 107, 108, 109, 110, 111]
            
            chosen_item = np.random.choice(candidates)
            item_sequence.append(chosen_item)

        for step, item_id in enumerate(item_sequence):
            main_skill, aux_skills = items[item_id]
            
            # 计算学生在此题上的答对概率，受主知识点和前置依赖知识点的共同影响
            main_prob = abilities[main_skill]
            aux_prob = np.mean([abilities[aux] for aux in aux_skills]) if aux_skills else 1.0
            
            # 综合概率 = 0.7 * 主掌握度 + 0.3 * 前置条件掌握度
            success_prob = 0.7 * main_prob + 0.3 * aux_prob
            
            # 添加随机扰动 (疲劳或粗心)
            success_prob = np.clip(success_prob * 0.9 + 0.05, 0.05, 0.95)
            
            correct = 1 if np.random.rand() < success_prob else 0
            
            # 学习效应：如果答对了，相关知识点的掌握度获得不同幅度的提升
            learning_gain = 0.08 if correct == 1 else 0.02
            abilities[main_skill] = np.clip(abilities[main_skill] + learning_gain, 0.05, 0.98)
            for aux in aux_skills:
                abilities[aux] = np.clip(abilities[aux] + learning_gain * 0.4, 0.05, 0.98)

            logs.append({
                'student_id': student_id,
                'student_type': student_type,
                'item_id': item_id,
                'skill_id': main_skill,
                'correct': correct,
                'step': step,
                'timestamp': f"2026-06-02 {step:02d}:00:00"
            })

    df = pd.DataFrame(logs)
    df.to_csv('data/demo_learning_logs.csv', index=False)
    print(f"==> Generated Sim Learning Logs: {len(df)} rows across {num_students} students.")

if __name__ == '__main__':
    generate_logs()
