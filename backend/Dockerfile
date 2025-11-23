FROM mambaorg/micromamba:2.0.0

ARG MAMBA_DOCKERFILE_ACTIVATE=1
SHELL ["/bin/bash", "-c"]

WORKDIR /usr/src/app

ENV CONDA_DEFAULT_ENV=moviesync2 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

COPY --chown=micromamba:micromamba requirements.txt /tmp/requirements.txt

RUN micromamba create -y -n ${CONDA_DEFAULT_ENV} python=3.12 \
    && micromamba run -n ${CONDA_DEFAULT_ENV} pip install --no-cache-dir -r /tmp/requirements.txt \
    && rm /tmp/requirements.txt \
    && micromamba clean --all --yes

COPY --chown=micromamba:micromamba ./app ./app

CMD ["micromamba", "run", "-n", "moviesync2", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
