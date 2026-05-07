FROM python:3.12-slim

WORKDIR /app
COPY . .

ENV HOST=0.0.0.0
ENV PORT=8765
ENV REFRESH_MIN_SECONDS=1800

EXPOSE 8765
CMD ["python", "scripts/server.py"]
