"""ffmpeg builder. Port of components/FfmpegBuilder.tsx."""
from __future__ import annotations

from .base import FormData


def build(form: FormData) -> str:
    mode = (form.get("mode") or "convert").strip() or "convert"
    input_file = (form.get("input_file") or "input.mp4").strip() or "input.mp4"
    output_file = (form.get("output_file") or "output.mkv").strip() or "output.mkv"
    audio_codec = (form.get("audio_codec") or "copy").strip() or "copy"
    video_codec = (form.get("video_codec") or "copy").strip() or "copy"
    start_time = (form.get("start_time") or "00:00:10").strip() or "00:00:10"
    duration = (form.get("duration") or "5").strip() or "5"
    fps = (form.get("fps") or "15").strip() or "15"
    width = (form.get("width") or "480").strip() or "480"
    hwaccel = (form.get("hwaccel") or "none").strip() or "none"
    scale = (form.get("scale") or "3840:2160").strip() or "3840:2160"

    parts = ["ffmpeg"]

    if hwaccel != "none" and mode in {"convert", "upscale"}:
        parts.append(f"-hwaccel {hwaccel}")

    if mode in {"createGif", "trim"} and start_time:
        parts.append(f"-ss {start_time}")

    parts.append(f"-i {input_file}")

    if mode == "convert":
        parts.extend([f"-c:v {video_codec}", f"-c:a {audio_codec}", output_file])
    elif mode == "extractAudio":
        parts.extend(["-vn", f"-c:a {audio_codec}", output_file])
    elif mode == "createGif":
        parts.append(f"-t {duration}")
        parts.append(f'-vf "fps={fps},scale={width}:-1:flags=lanczos"')
        parts.append(output_file)
    elif mode == "trim":
        parts.extend([f"-t {duration}", "-c copy", output_file])
    elif mode == "upscale":
        if hwaccel == "cuda":
            parts.append(f'-vf "scale_cuda={scale}"')
            parts.append("-c:v h264_nvenc")
        else:
            parts.append(f"-vf scale={scale}")
            parts.append("-c:v libx264")
        parts.append(output_file)

    return " ".join(parts).strip()
