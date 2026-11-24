# AGENTS.md — Правила проекта AIU P5R Schedule

## 1. Стек и архитектура
- **Парсинг данных:** Python 3 + `openpyxl` (локальное окружение `.venv/`) -> генерация `public/data/schedule.json` из Google Sheets (`.xlsx`).
- **Фронтенд (будущие этапы):** React + TypeScript + Vite + Tailwind CSS + Framer Motion + Lucide Icons.
- **Структура каталогов:**
  - `data/schedule.xlsx` — скачанная локальная копия таблицы.
  - `scripts/parse_schedule.py` — воспроизводимый парсер расписания.
  - `public/data/schedule.json` — итоговый JSON для фронтенда.

## 2. Целевые группы (канонические ID)
В проекте поддерживаются ровно 4 целевые группы 1-го курса. Любые варианты написания из исходной таблицы (`COMSE-26A`, `COMSE-26 A group`, `COMSE-26B`, `COMSE-26 B group`, `COMCEH-26`, `COMSEH-26`, `COMCIF-26`, `COMFCI-26`, `(COMSE A)`, `(COMSE B)`, `(COMCEH)`, `(COMFCI)`) **обязательно нормализуются** к следующим ID:
- `COMSE26B`
- `COMSE26A`
- `COMSEH26`
- `COMCIF26`

## 3. Слой данных, localStorage и синхронизация
- **Асинхронная загрузка:** базовое расписание фронтенд загружает асинхронно (`fetch`) из `public/data/schedule.json`.
- **Изолированный слой правок (`localStorage`):** пользовательские преподаватели (`isCustom: true`), выбор конкретного преподавателя/аудитории для потоковых пар и любые ручные правки/заметки хранятся отдельным overlay-слоем в `localStorage`. Повторная автосинхронизация с Google Sheets не должна перезаписывать или удалять пользовательский слой.
- **Детерминированные ID:** `lesson.id` и `teacher.id` формируются детерминированно (на основе дня, времени начала, предмета и групп / канонического имени преподавателя), чтобы привязки в `localStorage` сохранялись при обновлении `schedule.json`.
- **Источник Google Sheets:** `https://docs.google.com/spreadsheets/d/1EKBtXh6KMGzqrgh8P_x1-gIwkV5sP6TFfyH-fHMpiOI/edit?usp=drivesdk`

## 4. Команды парсинга и обновления данных
- Скачать актуальную таблицу и пересобрать `public/data/schedule.json`:
  ```bash
  .venv/bin/python scripts/parse_schedule.py --download
  ```
- Пересобрать `public/data/schedule.json` из локального файла `data/schedule.xlsx`:
  ```bash
  .venv/bin/python scripts/parse_schedule.py
  ```

## 5. Дизайн-система (для будущих этапов фронтенда)
- **Стиль:** аутентичный Persona 5 Royal UI — высокая контрастность, динамичные акценты, угловатая/скошенная геометрия (`clip-path`, резкие тени, наклонные бейджи).
- **Палитра:**
  - Phantom Red: `#E60012`
  - Obsidian Black: `#0D0D0D`
  - Stark White: `#FFFFFF`
  - Velvet / Highlight Yellow: `#FFE600`
- **Адаптивность:** читаемость без горизонтального переполнения и обрезаний на ширине `390px` (mobile) и `1440px` (desktop).
