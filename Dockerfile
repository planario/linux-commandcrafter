FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PORT=7256

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY commandcrafter ./commandcrafter
COPY static ./static
COPY pyproject.toml ./

RUN useradd --system --uid 1000 --home /app --shell /usr/sbin/nologin app \
    && chown -R app:app /app
USER app

EXPOSE 7256

HEALTHCHECK --interval=30s --timeout=5s --retries=3 --start-period=5s \
    CMD curl -fsS "http://127.0.0.1:${PORT}/healthz" || exit 1

CMD ["sh", "-c", "exec gunicorn --workers 2 --bind 0.0.0.0:${PORT} --access-logfile - 'commandcrafter:create_app()'"]
