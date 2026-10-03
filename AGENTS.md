# Project Overview

IELTS Peer Review — веб-приложение для преподавателей и учеников, готовящихся к IELTS Writing. Преподаватель создаёт класс и задания; ученики пишут эссе и оценивают друг друга по четырём критериям, оставляя комментарии в тексте. Ценность — регулярная практика и организованная обратная связь в учебной группе.

CURRENT: React SPA с прямым доступом к Supabase. PARTIAL: переход от локального демо к надёжному многопользовательскому продукту. AI/LLM, платежей и отдельного прикладного сервера нет. Наличие экрана или сообщения об успехе не доказывает сохранение в БД.

# Tech Stack

React, TypeScript, Vite, React Router, Zustand persist, Supabase Auth + PostgreSQL/Data API, Tailwind CSS/PostCSS, Lucide, Oxlint. Пакетный менеджер — npm; актуальные версии и ограничения Node смотрите в `package.json` и `package-lock.json`.

# Architecture Summary

`src/main.tsx` → `src/App.tsx` (маршруты, auth, первоначальная загрузка) → страницы/компоненты → `src/store/useStore.ts` (состояние и бизнес-операции) → `src/lib/db.ts` (преобразование данных и запросы) → Supabase.

Store сохраняет в localStorage только тему; пользователь и учебные данные загружаются из Supabase. Создание классов/заданий и основной цикл эссе/рецензий/учительских оценок ждут подтверждения БД; часть уведомлений и других мутаций ещё требует контроля ошибок. Источник новой схемы и RLS — `supabase_schema.sql`; для существующей БД есть версии в `supabase/migrations/`. Миграции и frontend-исправления опубликованы в live 2026-10-03; перед изменениями снова проверяйте текущее состояние облака. Межклассовый тест с реальными JWT остаётся. Подробнее: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

# Repository Map

| Path | Purpose |
| --- | --- |
| `src/App.tsx` | Маршрутизация, ProtectedRoute, auth listener, loadAllData |
| `src/pages/` | Экранные сценарии, фильтрация и агрегаты |
| `src/components/layout/` | Оболочка, навигация, уведомления |
| `src/components/classroom/` | Создание класса/задания, вступление по коду |
| `src/components/assignment/` | Редактор, экзамен, работы учеников, обратная связь, образцы |
| `src/components/review/` | Выделение текста, комментарии, критерии оценки |
| `src/components/feedback/` | Просмотр комментариев и предложенных исправлений |
| `src/components/teacher/` | Форма выставления/исправления учительской оценки |
| `src/components/ui/` | Toast, счётчики, геймификация |
| `src/store/useStore.ts` | Общий store, мутации, расчёт Band, локальное хранение |
| `src/lib/db.ts`, `src/lib/supabase.ts` | Доступ к данным и клиент Supabase |
| `src/types/index.ts` | Доменные интерфейсы |
| `src/data/mockData.ts` | Демо-сущности, статические образцы эссе, badges |
| `src/index.css`, `tailwind.config.js` | Активные стили, темы, CSS tokens |
| `supabase_schema.sql` | Таблицы, ограничения, RLS, trigger профиля; не migration runner |
| `public/`, `src/assets/` | Статические ресурсы |

# Where To Look First

| Task | Start Here | Related Areas |
| --- | --- | --- |
| Вход/регистрация/выход | `src/pages/LoginPage.tsx`, `src/App.tsx` | store, `src/components/layout/Header.tsx`, `src/components/layout/Sidebar.tsx`, SQL profiles/RLS |
| Схема/доступ к данным | `supabase_schema.sql`, `src/lib/db.ts` | types, store, вызывающая страница |
| Классы и задания | `src/pages/ClassroomPage.tsx`, `src/components/classroom/` | store, db, `src/pages/AssignmentsPage.tsx` |
| Черновик/отправка эссе | `src/pages/AssignmentPage.tsx`, `src/components/assignment/EssayEditor.tsx` | saveDraft/submitEssay в store, upsertEssay в db |
| Экзаменационный режим | `src/components/assignment/ExamSimulatorModal.tsx` | AssignmentPage, types, db |
| Взаимная оценка/Band | `src/pages/ReviewPage.tsx`, `src/components/review/CriteriaPanel.tsx` | CriteriaSection, submitReview/calculateOverallBand в store |
| Комментарии в тексте | `src/components/review/EssayPanel.tsx` | FloatingTooltip, CommentCard, `src/components/feedback/FeedbackViewer.tsx` |
| Учительская оценка | `src/components/teacher/TeacherGradeEditModal.tsx` | updateReviewByTeacher/createTeacherReview в store; сейчас локальные |
| Результаты/очередь | `src/pages/ResultsPage.tsx`, `src/pages/ReviewsPage.tsx` | DashboardPage, EssaysPage, ClassroomPage |
| UI/тема/навигация | `src/index.css`, `src/components/layout/` | нужная страница, tailwind.config.js; App.css не подключён |
| Учебный prompt/образцы | `src/components/classroom/CreateAssignmentModal.tsx`, `src/data/mockData.ts` | AssignmentPage, ModelEssayPanel; это не AI-промпты |
| Сборка/окружение | `package.json`, `vite.config.ts`, `src/lib/supabase.ts` | tsconfig-файлы, package-lock.json, ARCHITECTURE Deployment |

# Core Commands

Из корня проекта:

| Purpose | Command / status |
| --- | --- |
| Установка по lockfile | `npm ci` — только когда установка входит в задачу |
| Dev | `npm run dev` |
| Build + TypeScript | `npm run build` (`tsc -b && vite build`), пишет в `dist/` |
| Lint | `npm run lint` |
| Preview сборки | `npm run preview` |
| Typecheck без записи | `node node_modules/typescript/bin/tsc -p tsconfig.app.json --noEmit --incremental false`, затем аналогично с `tsconfig.node.json` |
| Client persistence regression | `node supabase/tests/client_persistence.cjs` |
| Database migration | SQL-файлы в `supabase/migrations/` запускаются после сравнения live schema/grants; автоматического runner/deploy pipeline нет. `supabase_schema.sql` предназначен для новой БД, не для повседневной проверки |

`src/lib/supabase.ts` требует `VITE_SUPABASE_URL` и `VITE_SUPABASE_ANON_KEY`. В репозитории нет `.env.example`. Значения не печатайте. Для Node сверяйте engines зависимостей в lockfile.

# Important Conventions

- Доменные объекты — camelCase; SQL — snake_case; преобразование находится в `src/lib/db.ts`.
- Сначала ищите существующий компонент/операцию store. Новые запросы помещайте в текущую границу доступа к данным, а не размазывайте по UI.
- Роли `teacher`/`student` в интерфейсе не заменяют серверную авторизацию. Проверяйте владельца класса, членство, автора работы и RLS.
- Сохраняйте четыре ключа критериев, смысл `isComplete`/`isPartial`, авторство вкладов и индексы комментариев. `isComplete` сейчас означает отправленную, в том числе частичную, рецензию.
- При правках сохранения проверяйте UUID, повторный save, обновление страницы и второй аккаунт. Локальный успех не равен подтверждению БД.
- Используйте активную тему из `src/index.css`; учитывайте мобильную навигацию и обе темы. В UI смешаны русский и английский — единого i18n-слоя нет.
- Не запускайте `deploy.bat`/`fix_email.bat` как проверку: они делают force-push; второй также меняет глобальную Git-конфигурацию и amend-коммит.
- Для Vercel SPA deep links необходим `vercel.json`. Проверяйте прямое открытие `/assignments/:id` и других защищённых маршрутов после деплоя.
- Для закрытого пилота сначала сверяйте production schema/policies/grants и применяйте миграции в тестовой БД, затем проверяйте двумя аккаунтами из разных классов и anon; только после этого обновляйте production. Не полагайтесь на зелёную сборку как на доказательство сохранения или изоляции.
- Не помещайте Git PAT, service_role key, database password или другие секреты в Git remote URL, браузерный `VITE_*` код, документацию либо сообщения. Если доступ к Vercel/Supabase нужен агенту, используйте авторизованную CLI-сессию/панель с нужными правами; не вставляйте ключи в чат.

# Agent Rules

1. Начинайте с `AGENTS.md` и определяйте область задачи.
2. Не сканируйте весь репозиторий без необходимости; читайте нужный исходник и его непосредственные зависимости.
3. До новой реализации ищите существующую. Делайте минимально необходимое изменение без несвязанного рефакторинга.
4. Не добавляйте dependency, если задача разумно решается текущим стеком; не изменяйте несвязанные файлы.
5. Запускайте релевантные проверки; явно сообщайте, что не проверено. Успешная сборка не проверяет RLS или сохранение данных.
6. До изменения schema проверяйте SQL, наличие migrations, db mappings, types и зависимые сценарии. Не предполагайте совпадение SQL-файла с production.
7. Не раскрывайте secrets и не читайте значения `.env` без необходимости; секретные серверные ключи нельзя помещать в браузерный код.
8. Не считайте демоданные, UI claims и рекомендации фактическими возможностями сервера. Не повторяйте известные дефекты как архитектурный образец.
9. Документация помогает найти исходник, который вы обязаны прочитать перед изменением. При противоречии код — окончательный источник истины о реализации.

# Documentation Routing

- Architecture details → [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): границы, таблицы, потоки, точки изменения, проверки.
- Product context → [docs/PRODUCT.md](docs/PRODUCT.md): продуктовый цикл, фактические и предлагаемые возможности.
- Technical debt → [docs/TECH_DEBT.md](docs/TECH_DEBT.md): существенные дефекты, риски, приоритеты.

# Documentation Maintenance

Обновляйте соответствующий документ, когда существенно меняются архитектура, структура, основной сценарий, БД, API, AI-интеграции, команды или поведение продукта. При исправлении долга перепроверьте связанные предупреждения в остальных документах. Мелкие UI/локальные правки не требуют переписывания документации. Храните пути и причины решений, а не номера строк, секреты, копии реализации или сгенерированные данные.
