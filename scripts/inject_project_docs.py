#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Safe LaTeX injection helper for the AI course report.

This script intentionally preserves the course-report template skeleton from
docs/05-lecture-delivery/报告/data/*.tex.bak. It does not downgrade and paste
whole lifecycle documents into the report. Instead, it replaces only body text
under existing headings and writes a preview by default.
"""

from __future__ import annotations

import argparse
import re
import shutil
from dataclasses import dataclass
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
REPORT_DIR = ROOT / "docs/05-lecture-delivery/报告"
REPORT_DATA_DIR = REPORT_DIR / "data"
PROJECT_DOCS_DIR = ROOT / "docs/00-project-docs"
PREVIEW_DIR = ROOT / "output/lecture-delivery-preview"

HEADING_RE = re.compile(r"^(\\(?:chapter|section|subsection)\{([^{}]+)\})\s*$")


@dataclass(frozen=True)
class SectionPlan:
    chapter: str
    heading: str
    body: str
    sources: tuple[str, ...]


SECTION_PLANS: tuple[SectionPlan, ...] = (
    SectionPlan(
        "chap01.tex",
        "国内研究背景",
        r"""随着生成式人工智能、学习分析和教育数据挖掘逐步进入高校教学场景，人工智能课程大作业已经不再适合停留在单一算法演示层面。本项目选择 LingoBridge 国际中文学习平台作为工程背景，围绕学生听读练习、录音提交、教师批改、班级学习轨迹沉淀等真实教学流程，构建“学习行为分析与个性化练习推荐”的课程大作业主题。

从国内教育数字化趋势看，中文学习平台、在线课程资源和智慧教学工具正在共同推动语言教学从经验管理转向数据驱动管理。LingoBridge 已具备教师端、学生端和管理端的 MVP 基础能力，能够形成课程、作业、录音、反馈和课堂活动等多类可观测数据。这些数据虽然规模不大，但足以支撑课程大作业所要求的数据预处理、特征构建、模型设计、结果分析和交互展示。""",
        ("01-FA/templates/data/chap01.tex", "01-FA/templates/data/chap02.tex"),
    ),
    SectionPlan(
        "chap01.tex",
        "国外研究背景",
        r"""在国际语言学习产品中，学习行为追踪、闯关式练习、学习提醒和个性化推荐已经成为常见能力。通用语言学习平台更强调大规模用户增长与订阅转化，而学校内部的国际中文教学更强调班级管理、教师反馈和弱网可用性。两类场景的差异说明，本项目不应简单复制通用 App 的推荐逻辑，而应围绕课堂作业完成率、练习频率、错误类型和学习持续性进行轻量化建模。

因此，本报告将国外成熟语言学习平台的产品思路作为参照，把 LingoBridge 定位为面向教学闭环的轻量 AI 辅助系统。推荐模块不追求复杂黑箱模型，而优先采用可解释的规则特征、统计指标和可演示的机器学习基线，让教师能够看懂推荐依据，学生能够感知练习建议。""",
        ("01-FA/templates/data/chap02.tex",),
    ),
    SectionPlan(
        "chap01.tex",
        "研究目的",
        r"""本大作业的目标是设计并实现一个“基于机器学习的国际中文学习行为分析与个性化练习推荐系统”。系统以 LingoBridge MVP 为基础，在不破坏既有教师端、学生端和管理端主流程的前提下，补充数据分析与智能推荐能力。

具体而言，学生端应展示个人学习轨迹、练习建议和班级排名反馈；教师端应展示学生总览、风险学生识别和作业质量趋势；管理端应作为数据中台，展示全局课程、用户、作业和运行状态指标。通过上述设计，项目能够覆盖课程大作业要求中的数据收集、数据清洗、算法设计、交互设计、编码实现、运行测试和报告撰写等环节。""",
        ("prds/json/sprint09-prd-260601-v2.0.json",),
    ),
    SectionPlan(
        "chap04.tex",
        "实验环境与数据集说明",
        r"""实验数据来自 LingoBridge 本地演示环境中的课程、学生、作业、录音提交和教师反馈记录。考虑到课程大作业以本地展示为主，数据集采用模拟教学数据与 MVP 实际运行记录相结合的方式构建，不采集真实学生隐私信息。

数据处理流程包括：从前端交互和后端存储中导出学习记录；清洗缺失字段、异常时间戳和重复提交；按学生、课程、作业和时间窗口聚合特征；最后生成可供规则推荐或机器学习模型使用的训练样本。评估指标包括推荐覆盖率、命中率、教师可解释性、页面展示正确性和本地演示稳定性。""",
        ("analysis/ai-learning-recommendation/README.md", "docs/03-testing-deployment/ai-v2-demo-runbook.md"),
    ),
    SectionPlan(
        "chap05.tex",
        "全文总结",
        r"""本文围绕国际中文学习场景，完成了 LingoBridge 平台的数据分析与个性化练习推荐方案设计。项目的核心价值不在于堆叠复杂模型，而在于把人工智能课程中的数据处理、特征分析、推荐策略和可视化反馈落到一个可运行的教学平台中。

通过教师端、学生端和管理端的协同展示，系统能够体现“数据分析”和“智能推荐”的课程主题：学生获得更具体的练习建议，教师获得班级学习状态判断，管理端获得平台级运行与教学数据总览。后续工作应继续补充真实教学数据、完善模型评估，并将推荐解释与教师反馈结合起来。""",
        ("prds/md/sprint09-prd-260601-v2.0.md",),
    ),
)


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def extract_headings(content: str) -> list[tuple[str, str]]:
    headings: list[tuple[str, str]] = []
    for line in content.splitlines():
        match = HEADING_RE.match(line.strip())
        if match:
            command = match.group(1).split("{", 1)[0]
            headings.append((command, match.group(2)))
    return headings


def restore_template() -> None:
    for bak in sorted(REPORT_DATA_DIR.glob("chap*.tex.bak")):
        target = bak.with_suffix("")
        shutil.copy2(bak, target)
        print(f"[restore] {bak.name} -> {target.name}")


def validate_template(chapter: str) -> None:
    bak = REPORT_DATA_DIR / f"{chapter}.bak"
    current = REPORT_DATA_DIR / chapter
    if not bak.exists():
        raise FileNotFoundError(f"Missing template backup: {bak}")
    if not current.exists():
        raise FileNotFoundError(f"Missing current chapter: {current}")

    expected = extract_headings(read_text(bak))
    actual = extract_headings(read_text(current))
    if expected != actual:
        raise RuntimeError(
            f"Template skeleton changed in {chapter}. Restore from {bak.name} before applying injection."
        )


def inject_section_body(content: str, heading: str, body: str, sources: tuple[str, ...]) -> str:
    lines = content.splitlines()
    output: list[str] = []
    i = 0
    while i < len(lines):
        output.append(lines[i])
        match = HEADING_RE.match(lines[i].strip())
        if match and match.group(2) == heading:
            i += 1
            while i < len(lines) and not HEADING_RE.match(lines[i].strip()):
                i += 1
            source_comment = "% injected sources: " + "; ".join(sources)
            output.extend(["", source_comment, body.strip(), ""])
            continue
        i += 1
    return "\n".join(output).rstrip() + "\n"


def build_chapter(chapter: str) -> str:
    validate_template(chapter)
    content = read_text(REPORT_DATA_DIR / chapter)
    for plan in SECTION_PLANS:
        if plan.chapter == chapter:
            content = inject_section_body(content, plan.heading, plan.body, plan.sources)
    return content


def apply_or_preview(apply: bool) -> None:
    chapters = sorted({plan.chapter for plan in SECTION_PLANS})
    for chapter in chapters:
        rendered = build_chapter(chapter)
        target = REPORT_DATA_DIR / chapter if apply else PREVIEW_DIR / "data" / chapter
        write_text(target, rendered)
        mode = "apply" if apply else "preview"
        print(f"[{mode}] wrote {target}")


def print_skeleton() -> None:
    for bak in sorted(REPORT_DATA_DIR.glob("chap*.tex.bak")):
        print(f"\n== {bak.name} ==")
        for command, title in extract_headings(read_text(bak)):
            print(f"{command} {title}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true", help="overwrite report chapter files")
    parser.add_argument("--restore-template", action="store_true", help="restore chap*.tex from chap*.tex.bak")
    parser.add_argument("--print-skeleton", action="store_true", help="print template heading skeleton")
    args = parser.parse_args()

    if args.restore_template:
        restore_template()
    if args.print_skeleton:
        print_skeleton()
    if not args.restore_template and not args.print_skeleton:
        apply_or_preview(apply=args.apply)


if __name__ == "__main__":
    main()
