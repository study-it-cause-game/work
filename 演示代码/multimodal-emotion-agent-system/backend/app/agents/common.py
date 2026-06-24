from __future__ import annotations

from app.schemas import EmotionLabel, FileMeta


EMOTION_NAMES: dict[EmotionLabel, str] = {
    "happy": "积极/开心",
    "sad": "悲伤/低落",
    "angry": "愤怒/不满",
    "anxious": "焦虑/紧张",
    "neutral": "中性/平稳",
}

EMOTION_WORDS: dict[EmotionLabel, list[str]] = {
    "happy": ["开心", "高兴", "满意", "喜欢", "期待", "顺利", "轻松", "感谢", "成功", "舒服"],
    "sad": ["难过", "失落", "悲伤", "崩溃", "无助", "疲惫", "低落", "孤独", "痛苦", "哭"],
    "angry": ["生气", "愤怒", "讨厌", "烦", "受够", "投诉", "不满", "糟糕", "差劲", "气死"],
    "anxious": ["焦虑", "紧张", "担心", "压力", "害怕", "恐惧", "慌", "不安", "失眠", "担忧"],
    "neutral": ["一般", "还行", "没事", "正常", "可以", "知道", "了解", "收到"],
}


def clamp(value: float, lower: float, upper: float) -> float:
    return min(upper, max(lower, value))


def file_category(file: FileMeta) -> str:
    content_type = file.content_type or ""
    name = file.filename.lower()
    if content_type.startswith("audio/"):
        return "音频"
    if content_type.startswith("image/"):
        return "图片"
    if content_type.startswith("video/"):
        return "视频"
    if name.endswith(".txt"):
        return "文本"
    return file.category or "未知"


def detect_modalities(text: str, files: list[FileMeta]) -> list[str]:
    modalities: set[str] = set()
    if text.strip():
        modalities.add("文本")
    for file in files:
        category = file_category(file)
        if category == "文本":
            modalities.add("文本")
        elif category == "音频":
            modalities.add("语音")
        elif category == "图片":
            modalities.add("视觉")
        elif category == "视频":
            modalities.add("语音")
            modalities.add("视觉")
    return sorted(modalities)
