from __future__ import annotations

import csv
import os
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.font_manager import FontProperties
from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[1]
FIGURES = ROOT / "templates" / "figures"
DATA = ROOT / "templates" / "data" / "market_evidence.csv"
FONT = ROOT / "templates" / "fonts" / "SimHei.ttf"
SCREENSHOT_TOP = Path(os.environ.get("LINGOBRIDGE_POLICY_SCREENSHOT_TOP", ""))
SCREENSHOT_BOTTOM = Path(os.environ.get("LINGOBRIDGE_POLICY_SCREENSHOT_BOTTOM", ""))


def configure_fonts() -> FontProperties:
    font = FontProperties(fname=str(FONT))
    plt.rcParams["font.sans-serif"] = [font.get_name(), "Arial Unicode MS", "SimHei", "sans-serif"]
    plt.rcParams["axes.unicode_minus"] = False
    return font


def read_rows() -> list[dict[str, str]]:
    with DATA.open("r", encoding="utf-8") as file:
        return list(csv.DictReader(file))


def save_policy_screenshot() -> None:
    if not SCREENSHOT_TOP.exists() or not SCREENSHOT_BOTTOM.exists():
        print("Policy screenshots not found, skipped screenshot merge.")
        return

    images = [Image.open(SCREENSHOT_TOP).convert("RGB"), Image.open(SCREENSHOT_BOTTOM).convert("RGB")]
    width = min(image.width for image in images)
    resized = []
    for image in images:
        if image.width != width:
            ratio = width / image.width
            image = image.resize((width, int(image.height * ratio)), Image.Resampling.LANCZOS)
        resized.append(ImageOps.expand(image, border=18, fill="white"))

    gutter = 28
    canvas = Image.new("RGB", (resized[0].width, resized[0].height + resized[1].height + gutter), "white")
    canvas.paste(resized[0], (0, 0))
    canvas.paste(resized[1], (0, resized[0].height + gutter))
    canvas.save(FIGURES / "policy_moe_chinese_education_combined.png", optimize=True)


def save_chinese_demand_chart(rows: list[dict[str, str]], font: FontProperties) -> None:
    national = [
        row
        for row in rows
        if row["dataset"] == "international_chinese"
        and row["indicator"] == "countries_with_chinese_in_national_education_system"
    ]
    learners = [
        row
        for row in rows
        if row["dataset"] == "international_chinese"
        and row["indicator"] == "cumulative_chinese_learners_and_users"
    ]
    market_rm = [row for row in rows if row["dataset"] == "online_language_market_rm"]
    market_gvr = [row for row in rows if row["dataset"] == "online_language_market_gvr"]

    years = [int(row["year"]) for row in national]
    countries = [float(row["value"]) for row in national]
    learner_values = {int(row["year"]): float(row["value"]) for row in learners}

    fig, axes = plt.subplots(1, 2, figsize=(9.8, 4.3), dpi=300, gridspec_kw={"width_ratios": [1.0, 1.35]})

    ax = axes[0]
    ax.plot(years, countries, color="#2563EB", linewidth=2.6, marker="o", markersize=6)
    ax.fill_between(years, countries, [min(countries) - 3] * len(countries), color="#DBEAFE", alpha=0.65)
    for year, value in zip(years, countries):
        ax.text(year, value + 1.2, f"{int(value)}+", ha="center", fontproperties=font, fontsize=9)
    ax.set_title("中文纳入国民教育体系国家数增长", fontproperties=font, fontsize=12, fontweight="bold")
    ax.set_xlabel("年份", fontproperties=font, fontsize=9)
    ax.set_ylabel("国家数", fontproperties=font, fontsize=9)
    ax.set_ylim(64, 96)
    ax.grid(axis="y", linestyle=":", color="#CBD5E1")
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.text(
        2026,
        countries[-1] - 8.5,
        f"2026 年学习和使用中文人数\n接近 {learner_values[2026]:.0f} 百万人",
        ha="right",
        fontproperties=font,
        fontsize=9,
        color="#1E40AF",
        bbox={"facecolor": "#EFF6FF", "edgecolor": "#BFDBFE", "boxstyle": "round,pad=0.35"},
    )

    def series(data: list[dict[str, str]]) -> tuple[list[int], list[float]]:
        ordered = sorted(data, key=lambda row: int(row["year"]))
        return [int(row["year"]) for row in ordered], [float(row["value"]) for row in ordered]

    ax = axes[1]
    rm_years, rm_values = series(market_rm)
    gvr_years, gvr_values = series(market_gvr)
    ax.plot(rm_years, rm_values, color="#64748B", linewidth=2.1, marker="o", markersize=4.5, label="ResearchAndMarkets 2020-2027")
    ax.plot(gvr_years, gvr_values, color="#10B981", linewidth=2.6, marker="o", markersize=4.5, label="Grand View Research 2024-2030")
    ax.fill_between(gvr_years, gvr_values, color="#D1FAE5", alpha=0.38)
    ax.set_title("在线语言学习市场规模趋势", fontproperties=font, fontsize=12, fontweight="bold")
    ax.set_xlabel("年份", fontproperties=font, fontsize=9)
    ax.set_ylabel("十亿美元", fontproperties=font, fontsize=9)
    ax.text(
        2030,
        gvr_values[-1] - 5,
        "2030E\n54.83B",
        ha="right",
        fontproperties=font,
        fontsize=9,
        color="#047857",
        bbox={"facecolor": "#ECFDF5", "edgecolor": "#A7F3D0", "boxstyle": "round,pad=0.3"},
    )
    ax.legend(prop=font, frameon=False, fontsize=8, loc="upper left")
    ax.grid(axis="y", linestyle=":", color="#CBD5E1")
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)

    fig.suptitle("国际中文教育需求与在线语言学习市场趋势", fontproperties=font, fontsize=14, fontweight="bold")
    fig.tight_layout(rect=(0, 0, 1, 0.92))
    fig.savefig(FIGURES / "international_chinese_demand.pdf", bbox_inches="tight")
    fig.savefig(FIGURES / "international_chinese_demand.png", bbox_inches="tight")
    plt.close(fig)


def save_duolingo_chart(rows: list[dict[str, str]], font: FontProperties) -> None:
    duolingo = [row for row in rows if row["dataset"] == "duolingo"]

    def series(indicator: str) -> tuple[list[int], list[float]]:
        data = sorted([row for row in duolingo if row["indicator"] == indicator], key=lambda row: int(row["year"]))
        return [int(row["year"]) for row in data], [float(row["value"]) for row in data]

    years, mau = series("user_metrics_mau")
    _, paid = series("paid_subscribers")
    _, revenue = series("fy_revenue")

    fig, axes = plt.subplots(1, 2, figsize=(9.6, 4.1), dpi=300)

    axes[0].plot(years, mau, color="#2563EB", linewidth=2.7, marker="o", markersize=5, label="MAU")
    axes[0].plot(years, paid, color="#F97316", linewidth=2.4, marker="o", markersize=5, label="付费订阅者")
    axes[0].set_ylabel("百万人", fontproperties=font, fontsize=9)
    axes[0].set_xlabel("年份", fontproperties=font, fontsize=9)
    axes[0].set_title("用户规模与付费用户增长", fontproperties=font, fontsize=12, fontweight="bold")
    axes[0].legend(prop=font, frameon=False)
    axes[0].grid(axis="y", linestyle=":", color="#CBD5E1")

    axes[1].bar([str(year) for year in years], revenue, color="#10B981", width=0.58)
    for index, val in enumerate(revenue):
        if index in {0, len(revenue) - 1}:
            axes[1].text(index, val + 35, f"{val:,.0f}", ha="center", fontproperties=font, fontsize=8)
    axes[1].set_ylabel("百万美元", fontproperties=font, fontsize=9)
    axes[1].set_xlabel("年份", fontproperties=font, fontsize=9)
    axes[1].set_title("年度收入增长", fontproperties=font, fontsize=12, fontweight="bold")
    axes[1].grid(axis="y", linestyle=":", color="#CBD5E1")

    for ax in axes:
        ax.spines["top"].set_visible(False)
        ax.spines["right"].set_visible(False)

    axes[0].text(years[-1], mau[-1] + 5, f"{mau[-1]:g}M", ha="center", fontproperties=font, fontsize=8, color="#1D4ED8")
    axes[0].text(years[-1], paid[-1] + 4, f"{paid[-1]:g}M", ha="center", fontproperties=font, fontsize=8, color="#C2410C")

    fig.suptitle("多邻国 2019-2025 官方披露经营趋势", fontproperties=font, fontsize=14, fontweight="bold")
    fig.tight_layout(rect=(0, 0, 1, 0.90))
    fig.savefig(FIGURES / "duolingo_scale_growth.pdf", bbox_inches="tight")
    fig.savefig(FIGURES / "duolingo_scale_growth.png", bbox_inches="tight")
    plt.close(fig)


def main() -> None:
    FIGURES.mkdir(parents=True, exist_ok=True)
    font = configure_fonts()
    rows = read_rows()
    save_policy_screenshot()
    save_chinese_demand_chart(rows, font)
    save_duolingo_chart(rows, font)
    print("Evidence assets generated.")


if __name__ == "__main__":
    main()
