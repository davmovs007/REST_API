# Task Management API

Полноценное приложение для управления задачами: REST API по спецификации, Swagger UI и адаптивная русскоязычная панель управления. Проект использует трёхслойную архитектуру `controller -> service -> repository`, миграции Flyway и единые ответы об ошибках в формате `application/problem+json`.

## Возможности

- CRUD-задачи с неизменяемой датой создания и статусами `NEW`, `IN_PROGRESS`, `DONE`.
- Пагинация, поиск по заголовку и описанию, фильтр по статусу.
- Валидация входных данных: заголовок обязателен и ограничен 100 символами; описание — до 2 000.
- Swagger/OpenAPI: интерактивная документация API.
- PostgreSQL для production, H2 для локального запуска и интеграционных тестов.
- Flyway-миграции, Actuator health check, Docker/Docker Compose и интеграционные тесты.
- Удобный интерфейс на `/`: создание, редактирование, смена статуса, поиск, фильтрация и удаление задач без перезагрузки страницы.

## Быстрый старт

Требуется JDK 21+ и Maven 3.6.3+.

```bash
mvn spring-boot:run
```

После запуска доступны:

| Адрес | Назначение |
| --- | --- |
| http://localhost:8080/ | Панель управления задачами |
| http://localhost:8080/swagger-ui.html | Swagger UI |
| http://localhost:8080/v3/api-docs | OpenAPI 3 JSON |
| http://localhost:8080/actuator/health | Health check |
| http://localhost:8080/h2-console | H2 Console (только локальный профиль) |

Локальная H2 БД использует URL `jdbc:h2:mem:tasktracker`, пользователя `sa` и пустой пароль.

## API

Базовый путь: `/api/v1`.

| Метод | Путь | Назначение |
| --- | --- | --- |
| `GET` | `/tasks?page=0&size=20` | Список задач в стабильном пагинированном формате |
| `GET` | `/tasks/{id}` | Одна задача |
| `POST` | `/tasks` | Создание задачи |
| `PUT` | `/tasks/{id}` | Обновление переданных полей; можно передать только `status` |
| `DELETE` | `/tasks/{id}` | Удаление задачи |

Необязательные параметры списка: `status=NEW|IN_PROGRESS|DONE` и `query=текст`.

Создание:

```bash
curl -i -X POST http://localhost:8080/api/v1/tasks \
  -H 'Content-Type: application/json' \
  -d '{"title":"Подготовить отчёт","description":"Собрать данные за Q3"}'
```

Смена статуса:

```bash
curl -X PUT http://localhost:8080/api/v1/tasks/1 \
  -H 'Content-Type: application/json' \
  -d '{"status":"IN_PROGRESS"}'
```

При ошибках API отвечает Problem Details и сохраняет требуемые поля `timestamp`, `status`, `error`, `message`, `path`; при валидации дополнительно возвращается объект `errors`.

## Проверка качества

```bash
mvn test
mvn package
```

Интеграционный тест проходит путь создания, получения, пагинации, status-only обновления, удаления, валидации и 404 Problem Details.

## Production в Docker

```bash
docker compose up --build
```

Compose поднимает PostgreSQL 17 и приложение с профилем `prod`. Для собственного окружения задайте `DATABASE_URL`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`, а при необходимости `DB_POOL_SIZE` и `DB_MIN_IDLE`. Пароли из `compose.yaml` предназначены только для локальной разработки.
