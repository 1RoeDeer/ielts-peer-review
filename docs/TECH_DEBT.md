# Technical Debt

Аудит исходников 2026-10-01, live RLS сверена и обновлена 2026-10-03. CONFIRMED ISSUE — доказуемый дефект кода/декларации; POTENTIAL RISK — механизм риска есть, влияние в эксплуатации не проверено; IMPROVEMENT IDEA — предложение без доказанной поломки. Severity и тип доказательства независимы. Пользовательские инциденты и полная production E2E-проверка UNKNOWN.

После аудита внесено исправление D01 в исходники и 2026-10-03 применено к live Supabase. Клиентская версия опубликована на Vercel 2026-10-03. При закрытии пункта проверяйте актуальный исходник и обновляйте связанные предупреждения в AGENTS/ARCHITECTURE/PRODUCT.

# Critical

## D01 — Нет надёжной изоляции классов и авторизации записей

- **STATUS:** RLS MIGRATION APPLIED IN LIVE 2026-10-03; PostgreSQL allow/deny regression проходит локально. Проверка двух разных классов с реальными JWT ещё нужна.
- **AREA:** Authorization, privacy, integrity.
- **FILES:** `supabase_schema.sql`, `supabase/migrations/202610010001_classroom_rls.sql`, `supabase/tests/`, `src/App.tsx`, `src/lib/db.ts`, store, classroom/review components и связанные pages.
- **WAS:** чтение всех классов и широкая запись assignments/essays/reviews; join по UUID без кода; роль из metadata; отсутствие object guards и закрытой пустой очереди.
- **FIX:** права по auth.uid/владельцу/членству, явные table/column grants, private helpers без RLS recursion, join-by-code RPC. Черновики доступны только автору-участнику; reviews guard защищает чужие критерии, комментарии, contributors и teacher fields, пересчитывает peer Band. Самостоятельная роль остаётся UI preference и не участвует в серверной авторизации. Профиль берётся из БД; cache не восстанавливает пользователя/учебные данные, session load имеет generation guard; чужие deep links закрыты.
- **LIVE EVIDENCE:** до миграции policies `auth.role() = authenticated` открывали classes/assignments/essays/reviews всем вошедшим, а grants давали широкие записи. Схема семи таблиц, дополнительные views/functions, grants, владельцы и связанные записи сверены; live миграции `classroom_rls`, `review_status`, `profile_trigger_acl` применены. После них `anon` не имеет table SELECT/private schema/RPC, а оба существующих ученика вошли и увидели свой класс. Security Advisor больше не показывает public trigger warning; join RPC по коду намеренно остаётся доступен вошедшим.
- **REMAINING:** проверить реальные JWT/Data API двух *разных* классов, блокировки UPDATE и запись → reload → второй аккаунт. Историческое авторство ранее доступных для подмены записей требует проверки; migration не восстанавливает его. D04/D07 остаются частично открытыми.

# High

## D02 — Повторное сохранение нового черновика теряет серверную идентичность

- **STATUS:** FIXED AND DEPLOYED; live save/reload остаётся непроверенным.
- **AREA:** Writing persistence.
- **FILES:** `src/store/useStore.ts`, `src/lib/db.ts`, `supabase_schema.sql`, `src/pages/AssignmentPage.tsx`.
- **FIX:** операции по одной паре assignment/author выполняются последовательно; store сохраняет возвращённый UUID и показывает успех только после ответа БД. db helper ищет уже созданную строку и обрабатывает конфликт уникальности при гонке. `client_persistence.cjs` проверяет два save, submit, reload и отказ записи.
- **REMAINING:** проверить реальный PostgREST и два браузера одновременно; сетевой read/update/insert не является атомарной транзакцией.

## D03 — Учительские оценки и статусы рецензированных эссе не сохраняются в БД

- **STATUS:** status migration и frontend сохранения учительской оценки опубликованы в live. Проверка двух live sessions остаётся.
- **AREA:** Grading, workflow state.
- **FILES:** `src/store/useStore.ts`, `src/lib/db.ts`, `src/components/teacher/TeacherGradeEditModal.tsx`.
- **FIX:** учительская форма сохраняет review в Supabase до закрытия и показывает ошибку при отказе. `202610030001_review_status.sql` обновляет essay.status после сохранения partial/full/teacher review и исправляет статусы записей с существующими рецензиями. SQL-регрессия проверяет `reviewing`/`reviewed`; клиентская — сохранение/ошибку teacher grade.
- **REMAINING:** уведомления пишутся отдельными запросами, поэтому review и событие не атомарны; live JWT/Data API, reload и вторая сессия не проверены.

## D04 — Оптимистический успех без обработки ошибок и согласования ID

- **STATUS:** CONFIRMED ISSUE; гонки запросов — POTENTIAL RISK.
- **AREA:** Data consistency, error handling.
- **FILES:** `src/store/useStore.ts`, `src/lib/db.ts`, `src/App.tsx`, `src/components/classroom/JoinClassroomModal.tsx`.
- **PROBLEM:** classroom/assignment creation, essay, peer review и teacher grade теперь подтверждают запись до success; остальные мутации всё ещё могут сразу менять store и показывать success. Чтение при ошибке возвращает [], затирая локальную коллекцию. Notification IDs из insert не возвращаются в store; newly created notifications остаются с временными ID. Уведомления после createAssignment используют реальный assignmentId, но пишутся отдельно и могут не сохраниться. Общий error/rollback workflow не исправлен.
- **IMPACT:** ложное подтверждение сохранения, ошибки переходов/mark-read, невозможность отличить пустой класс от сбоя сети. Быстрая следующая операция может отправить временный ID вместо UUID.
- **RECOMMENDED FIX:** async results и состояния pending/error/saved, mapping серверных ID для всех ссылок, обновление/откат только затронутых сущностей, distinction empty/error; координация зависимых запросов. Не добавлять toast как замену подтверждению БД.

## D05 — Выход из аккаунта и локальный cache (исправление в исходниках, live проверка остаётся)

- **STATUS:** FIXED IN SOURCE для Sidebar logout, восстановления общего cache, auth/data readiness и generation загрузки; live UI/session checks остаются UNKNOWN.
- **AREA:** Session lifecycle, shared-device privacy.
- **FILES:** `src/components/layout/Sidebar.tsx`, `src/components/layout/Header.tsx`, `src/store/useStore.ts`, `src/App.tsx`, `src/pages/LoginPage.tsx`.
- **FIX:** обе кнопки вызывают logout/signOut, при ошибке session сохраняется и выводится предупреждение. App ждёт session/данные, очищает коллекции и activeReview, игнорирует устаревшую загрузку. Persist version 2 сохраняет только тему и удаляет старый persisted cache при миграции; gamification сбрасывается между session.
- **REMAINING:** проверить обе кнопки, expired session, refresh token, reload и последовательный вход двух аккаунтов в браузере с live Auth. Все фоновые мутации пока не координируются с session, см. D04.

## D06 — Экзамен может отправить устаревший текст

- **STATUS:** CONFIRMED ISSUE по замыканию effect; браузерное воспроизведение не выполнялось.
- **AREA:** Timed writing, text loss.
- **FILES:** `src/components/assignment/ExamSimulatorModal.tsx`, `src/pages/AssignmentPage.tsx`.
- **PROBLEM:** interval effect зависит от pause/exit/autosubmit flags, но вызывает handleTimeExpired, захвативший text прежнего render. Набор текста не пересоздаёт interval; автоотправка может использовать initialText или текст на момент последней смены flags. Save & Exit лишь меняет useState родителя и закрывает modal, не вызывает saveDraft. Таймер не восстанавливается после закрытия.
- **IMPACT:** неполная/пустая автоотправка после длительной работы, потеря текста при уходе/перезагрузке страницы, неверное ожидание «сохранено».
- **RECOMMENDED FIX:** стабильный callback с последними данными, единственная idempotent expiry операция, сохраняемый draft/checkpoint и явная семантика выхода. Проверить fake timer и браузерный сценарий с набором последней фразы перед expiry. Не исправлять dependency array механически без проверки повторной отправки.

## D07 — Коллективная рецензия не имеет согласованной модели авторства и конкуренции

- **STATUS:** CONFIRMED ISSUE для смешанной семантики; lost updates/дубликаты — POTENTIAL RISK.
- **AREA:** Review data model, concurrency, correctness.
- **FILES:** `src/store/useStore.ts`, `src/lib/db.ts`, `supabase_schema.sql`, `src/pages/ReviewsPage.tsx`, `src/pages/AssignmentPage.tsx`, `src/pages/DashboardPage.tsx`, `src/pages/ResultsPage.tsx`.
- **PROBLEM:** store выбирает первую review по essayId и обновляет общий JSON. SQL guard теперь запрещает перезапись чужого вклада и teacher grades, но уникальность выбранной модели и revision/atomic merge отсутствуют. isComplete=true даже для partial, а разные счётчики считают reviewerId либо contributors. Слияние комментариев возвращает удалённые из activeReview старые comments, так как начинает с existingComments. Учительские изменения не синхронизируют все признаки modular coverage.
- **IMPACT:** вклад ученика может не учитываться, требование reviews вводит в заблуждение; одновременные рецензенты могут затереть друг друга или создать две записи; невозможно надёжно восстановить историю решений.
- **RECOMMENDED FIX:** сначала выбрать одну модель: отдельные отзывы или единая оценка с независимыми вкладами. Затем согласовать constraints, atomic merge/versioning, deletes, teacher override, partial/full states и selectors статистики. Протестировать два аккаунта одновременно и повторную отправку одной оценки.

## D08 — Release-скрипты переписывают Git history

- **STATUS:** CONFIRMED ISSUE в скриптах; запуск/ущерб не подтверждены.
- **AREA:** Deployment, repository safety.
- **FILES:** `deploy.bat`, `fix_email.bat`, `package.json`, `supabase_schema.sql`.
- **PROBLEM:** deploy делает add -A/commit/force-push main без проверок; fix_email меняет global Git identity, amend и force-push. CI и migration runner отсутствуют. Добавлены SQL migrations и `vercel.json` SPA rewrite, но это ещё не готовый release workflow.
- **IMPACT:** риск перезаписи чужих коммитов, случайной публикации несвязанных изменений и невоспроизводимых релизов/схемы.
- **RECOMMENDED FIX:** отдельная задача безопасного release workflow с проверками, защищённой веткой, preview, миграциями и rollback. Проверить фактический hosting/Supabase setup. Скрипты не запускать для проверки документации.

# Medium

## D09 — Нет тестового барьера и runtime-контрактов данных

- **STATUS:** CONFIRMED ISSUE как пробел проверки; расширение типизации — IMPROVEMENT IDEA.
- **AREA:** Testing, type safety, maintainability.
- **FILES:** `package.json`, `.oxlintrc.json`, `tsconfig.app.json`, `tsconfig.node.json`, `src/lib/db.ts`, `src/types/index.ts`.
- **PROBLEM:** test script/CI и прикладной test runner отсутствуют; для D01 добавлен PostgreSQL RLS regression в `supabase/tests/`. strict TypeScript не включён. JSON/rows приводятся через casts, компоненты ожидают полную criteria/checklist структуру даже при SQL default criteria={}. Lint baseline имеет warnings, в том числе stale dependencies.
- **IMPACT:** сборка проходит при дефектах сохранения, прав и неполных JSON; malformed data может ломать render. Изменения центрального store имеют большой радиус влияния без регрессий.
- **RECOMMENDED FIX:** сначала тесты persistence/RLS/session/review/time expiry, затем schema-derived types и runtime boundary validation. Включать strict постепенно. Делить store и выделять selectors/чистые функции по мере работы, без полного переписывания.

## D10 — Вход по нормализованному имени не обеспечивает стабильную идентичность

- **STATUS:** CONFIRMED ISSUE для коллизий/пустой нормализации и отсутствия recovery; email confirmation — POTENTIAL RISK.
- **AREA:** Onboarding, account recovery.
- **FILES:** `src/pages/LoginPage.tsx`, `src/App.tsx`, `supabase_schema.sql`.
- **PROBLEM:** разные имена могут превращаться в одинаковый synthetic email. Если допустимых символов не остаётся, добавляется Date.now(), поэтому повторный вход не воспроизводит адрес регистрации. UI допускает такие непустые имена. Recovery flow нет; с включённым email confirmation немедленный signIn не завершится, а адрес не подтверждается реальным пользователем.
- **IMPACT:** неоднозначные имена, блокировка входа для части пользователей и отсутствие восстановления пароля.
- **RECOMMENDED FIX:** выбрать стабильный логин, определить политику уникальности/поддерживаемых символов и recovery без потери существующих аккаунтов. Проверить фактические настройки Auth; не менять email identity без плана миграции.

## D11 — Некорректные границы текстового ввода, выделений и CSV

- **STATUS:** CONFIRMED ISSUE для алгоритмов; влияние конкретных IME/табличных приложений — POTENTIAL RISK.
- **AREA:** Writing UX, annotation correctness, export safety.
- **FILES:** `src/components/assignment/EssayEditor.tsx`, `src/components/assignment/TeacherSubmissionsView.tsx`, `src/components/review/EssayPanel.tsx`, `src/components/feedback/FeedbackViewer.tsx`, `src/components/assignment/ModelEssayPanel.tsx`.
- **PROBLEM:** editor блокирует undo/redo/replacement и прирост длины, что не доказывает paste. Highlights допускают пересечения, но renderer повторно выводит перекрывающийся текст; offsets предполагают разделитель длиной два символа, а selection через абзацы не обрабатывается полноценно. CSV заключает name в кавычки без escaping вложенных кавычек и защиты от spreadsheet formulas.
- **IMPACT:** легитимный ввод может отклоняться; комментарии привязываются к неверному фрагменту; экспорт может искажать ячейки или трактовать имя как формулу в принимающем приложении.
- **RECOMMENDED FIX:** проверить доступность/IME и смягчить недостоверные anti-cheat assertions; единая модель spans/offsets с тестами пересечений и переносов; корректное CSV escaping и нейтрализация формул. Browser-only ограничения не представлять как защищённый экзамен.

## D12 — Продукт показывает смесь неполных, локальных и демонстрационных данных

- **STATUS:** CONFIRMED ISSUE.
- **AREA:** Analytics, notifications, demo boundary.
- **FILES:** `src/pages/DashboardPage.tsx`, `src/pages/ClassroomsPage.tsx`, `src/pages/AssignmentPage.tsx`, `src/pages/ResultsPage.tsx`, `src/store/useStore.ts`, `src/lib/db.ts`, `src/data/mockData.ts`, `supabase_schema.sql`.
- **PROBLEM:** Dashboard «Avg Band Received» исправлен в исходнике и считает полученные оценки; live deployment не подтверждён. ClassroomsPage ищет учителя в mockUsers вместо users. Model essays привязаны к demo IDs. Typing metrics не пишутся в БД; XP/streak/badges локальны, после D01 сбрасываются между session, streak updater не вызывается. markAllNotificationsRead/clearNotification работают локально. Legacy общие notifications теперь скрыты RLS; Realtime доставки нет.
- **IMPACT:** результаты/ведомость могут вводить в заблуждение, новые классы не получают обещанные образцы, уведомления возвращаются после загрузки и не отражают активность других пользователей своевременно.
- **RECOMMENDED FIX:** отделить demo mode, убрать фиктивный прогресс, унифицировать selectors received/given/contributed, определить persistence каждой метрики. Сделать явную стратегию refresh и read-per-recipient. Сначала исправить данные основного цикла, затем геймификацию.

## D13 — Полная загрузка общего store ограничивает рост

- **STATUS:** POTENTIAL RISK; механизм подтверждён кодом, профиль нагрузки UNKNOWN.
- **AREA:** Performance, scalability, cache.
- **FILES:** `src/App.tsx`, `src/lib/db.ts`, `src/store/useStore.ts`, `src/pages/ClassroomPage.tsx`, `src/pages/ResultsPage.tsx`, `supabase_schema.sql`.
- **PROBLEM:** fetchAll/select(*) ограничен RLS, но всё ещё без pagination; множество подписок на весь store и вложенных find/filter; нет server cache/invalidation или дополнительных query indexes. Ограничение ответа Supabase может обрезать выборку. Persist больших учебных массивов удалён в D01.
- **IMPACT:** возможны неполные очереди/результаты, рост загрузки и задержки ввода/перерисовок. Текущий масштаб, на котором это проявится, не измерен.
- **RECOMMENDED FIX:** после scoped RLS — scoped queries и pagination; user-bound cache, targeted selectors, серверные агрегаты/индексы по измеренным запросам. Не внедрять сложную инфраструктуру без профилирования.

# Low

Отдельные косметические замечания в реестр не включены. IMPROVEMENT IDEA: при следующей работе с соответствующим модулем объединять повторяющиеся Band/category helpers, согласовывать язык интерфейса и удалять неиспользуемые шаблонные assets. Это не блокеры и не повод для самостоятельного большого рефакторинга.
