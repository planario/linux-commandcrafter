"""lxc launch builder. Port of components/LxcBuilder.tsx."""
from __future__ import annotations

from .base import FormData


def build(form: FormData) -> str:
    image = (form.get("image") or "ubuntu:22.04").strip() or "ubuntu:22.04"
    name = (form.get("container_name") or "my-container").strip() or "my-container"
    cores = (form.get("cores") or "").strip()
    ram = (form.get("ram") or "").strip()
    storage = (form.get("storage") or "").strip()

    parts = ["lxc launch", image, name]
    if cores:
        parts.append(f"-c limits.cpu={cores}")
    if ram:
        parts.append(f"-c limits.memory={ram}MB")
    if storage:
        parts.append(f"--device root,size={storage}GB")
    return " ".join(parts).strip()
