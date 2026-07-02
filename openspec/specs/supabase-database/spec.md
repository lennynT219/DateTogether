# supabase-database Specification

## Purpose

Define the PostgreSQL persistence layer via Supabase: schema DDL, seed data (90 predefined + 10 free dates), repository ports, Supabase client factory, and repository implementations that map between snake_case DB rows and camelCase domain entities.

> **Note**: The existing `DateEntry` entity MUST be extended with `orderIndex: number`, `completedBy?: string`, `createdAt: Date`, `updatedAt: Date`. The existing `Memory` entity MUST be extended with `createdBy?: string`. These extensions are a design-phase concern; this spec defines the repository contracts that assume the extended entities.

## Requirements

### Requirement: Database Schema (REQ-DB-001)

The system MUST provide a SQL migration that creates `dates` and `memories` tables with the pgcrypto extension, appropriate indexes, a foreign key with CASCADE delete, and an `updated_at` auto-trigger.

| Table | Column | Type | Constraint |
|-------|--------|------|-----------|
| dates | id | uuid | PK, default gen_random_uuid() |
| dates | title | text | NULLABLE (NULL for free) |
| dates | description | text | NULLABLE |
| dates | category | text | NOT NULL, CHECK IN ('predefined','free') |
| dates | order_index | int | NOT NULL, UNIQUE, 1-100 |
| dates | completed | boolean | NOT NULL, default false |
| dates | completed_at | timestamptz | NULLABLE |
| dates | completed_by | text | NULLABLE |
| dates | created_at | timestamptz | NOT NULL, default now() |
| dates | updated_at | timestamptz | NOT NULL, default now() |
| memories | id | uuid | PK, default gen_random_uuid() |
| memories | date_id | uuid | NOT NULL, FK → dates(id) ON DELETE CASCADE |
| memories | image_url | text | NOT NULL |
| memories | location | text | NULLABLE |
| memories | note | text | NULLABLE |
| memories | created_by | text | NULLABLE |
| memories | created_at | timestamptz | NOT NULL, default now() |

Indexes: `dates(order_index)`, `memories(date_id)`. Trigger: auto-set `updated_at` on `dates` UPDATE.

#### Scenario: Schema creates cleanly

- GIVEN an empty Supabase project
- WHEN the schema migration runs
- THEN both tables exist with all columns, constraints, and indexes

#### Scenario: FK cascade deletes memories

- GIVEN a date row with 2 associated memory rows
- WHEN the date row is deleted
- THEN both memory rows are automatically deleted

#### Scenario: Trigger updates updated_at

- GIVEN a date row with `updated_at = T1`
- WHEN any column on that row is updated
- THEN `updated_at` is set to a value > T1

#### Scenario: Duplicate order_index rejected

- GIVEN a date row with `order_index = 5`
- WHEN inserting another row with `order_index = 5`
- THEN the insert fails with a unique constraint violation

### Requirement: Seed Data (REQ-DB-002)

The system MUST provide a seed migration that inserts exactly 100 rows: 90 with `category = 'predefined'` and normalized titles from the PDF, and 10 with `category = 'free'` and `title = NULL`. `order_index` MUST be sequential 1-100.

Predefined titles (order_index 1-90):

| # | Title | # | Title |
|---|-------|---|-------|
| 1 | Cenar en un restaurante bonito | 46 | Vestir iguales |
| 2 | Viaje fuera de la ciudad | 47 | Disfraz en pareja |
| 3 | Pedir cena a domicilio | 48 | Jugar un videojuego |
| 4 | Armar un rompecabezas | 49 | Estudiar juntos |
| 5 | Preparar un postre | 50 | Hacer una limpieza facial |
| 6 | Pintar un cuadro | 51 | Bailar |
| 7 | Ir a patinar | 52 | Ver un documental |
| 8 | Hacer galletas | 53 | Escuchar musica |
| 9 | Maraton de series o peliculas | 54 | Armar un mueble |
| 10 | Ir a un karaoke | 55 | Volar un papalote |
| 11 | Ir a un mirador | 56 | Guerra de almohadas |
| 12 | Ir a un zoológico | 57 | Pijamada |
| 13 | Ir de compras | 58 | Observar las estrellas |
| 14 | Ir a un museo | 59 | Hacer una cita con tematica |
| 15 | Ir a un circo | 60 | Pasear a nuestras mascotas |
| 16 | Ir a una fiesta | 61 | Salir a caminar |
| 17 | Ir a un nacimiento navideno | 62 | Hacer una fogata |
| 18 | Ir por un helado | 63 | Hacer una sesion de fotos |
| 19 | Ir a un cumpleanos | 64 | Hacer una manualidad |
| 20 | Ir a un baby shower | 65 | Jugar un juego de mesa |
| 21 | Ir a una boda | 66 | Escribir un deseo en un globo |
| 22 | Ir a una cascada | 67 | Comer donas |
| 23 | Ir a pedir algo rico | 68 | Pedir pizza |
| 24 | Ir a un spa | 69 | Ir a un buffet |
| 25 | Ir a acampar | 70 | Hacer una caja de ahorro |
| 26 | Caminar bajo la lluvia | 71 | Ver la luna |
| 27 | Amanecer en algun lugar | 72 | Hacer una carta |
| 28 | Ver una pelicula | 73 | Hacernos un tatuaje |
| 29 | Desayunar juntos | 74 | Ir a un pueblito magico |
| 30 | Ver una serie completa | 75 | Ir a un spa (relajacion) |
| 31 | Hacer yoga juntos | 76 | Cena familiar |
| 32 | Pintar una pared | 77 | Ir por hamburguesas |
| 33 | Dibujar algo | 78 | Un paseo familiar |
| 34 | Cultivar plantas | 79 | Ir a un concierto |
| 35 | Armar un LEGO | 80 | Salir con amigos |
| 36 | (reserved — see note) | 81 | Hacer hot cakes |
| 37 | Disfraz en pareja | 82 | Ir a cenar tacos |
| 38 | Jugar un videojuego | 83 | Ir a Six Flags |
| 39 | Estudiar juntos | 84 | Ir a un escape room |
| 40 | Hacer una limpieza facial | 85 | Sacar un peluche de una maquina |
| 41 | Bailar | 86 | Ir a un parque acuatico |
| 42 | Ver un documental | 87 | Ir a jugar bolos |
| 43 | Escuchar musica | 88 | Guerra de globos |
| 44 | Armar un mueble | 89 | Paseo nocturno en bicicleta |
| 45 | Volar un papalote | 90 | Ir a un planetario |

> **Note**: Titles 36 and 79 have OCR ambiguity. The final seed SQL MUST use manually verified titles. The table above is the spec-level contract; exact wording is a design/implementation concern.

Free spaces: order_index 91-100, `title = NULL`, `category = 'free'`.

#### Scenario: 100 rows seeded

- GIVEN the seed migration has run
- WHEN counting all rows in `dates`
- THEN the result is exactly 100

#### Scenario: 90 predefined with titles

- GIVEN the seed migration has run
- WHEN counting rows WHERE `category = 'predefined'`
- THEN the result is 90 AND all have non-NULL `title`

#### Scenario: 10 free without titles

- GIVEN the seed migration has run
- WHEN counting rows WHERE `category = 'free'`
- THEN the result is 10 AND all have NULL `title`

#### Scenario: Sequential order_index

- GIVEN the seed migration has run
- WHEN selecting all `order_index` values ordered ascending
- THEN the result is the sequence 1, 2, 3, ..., 100 with no gaps or duplicates

### Requirement: DateRepository Port (REQ-DB-003)

The system MUST define a `DateRepository` interface in `src/core/ports/` with the following methods:

| Method | Signature | Returns |
|--------|-----------|---------|
| findAll | `() => Promise<DateEntry[]>` | All 100 dates ordered by `orderIndex`, with nested `memories` |
| findById | `(id: string) => Promise<DateEntry \| null>` | Single date or null |
| findByCategory | `(category: 'predefined' \| 'free') => Promise<DateEntry[]>` | Filtered dates |
| markAsCompleted | `(id: string, completedBy: string) => Promise<DateEntry>` | Updated date with `completed=true` |
| markAsIncomplete | `(id: string) => Promise<DateEntry>` | Updated date with `completed=false` |
| getProgress | `() => Promise<{ completed: number; total: number }>` | Count summary |

#### Scenario: findAll returns 100 ordered dates

- GIVEN 100 seeded date rows
- WHEN `findAll()` is called
- THEN the result has 100 entries ordered by `orderIndex` ascending

#### Scenario: findById found

- GIVEN a date with known id exists
- WHEN `findById(id)` is called
- THEN the matching `DateEntry` is returned

#### Scenario: findById not found

- GIVEN no date with the given id exists
- WHEN `findById(id)` is called
- THEN `null` is returned

#### Scenario: markAsCompleted updates row

- GIVEN an incomplete date
- WHEN `markAsCompleted(id, 'her')` is called
- THEN the returned entry has `completed=true`, `completedAt` set, `completedBy='her'`

#### Scenario: markAsIncomplete resets fields

- GIVEN a completed date
- WHEN `markAsIncomplete(id)` is called
- THEN the returned entry has `completed=false`, `completedAt=null`, `completedBy=null`

#### Scenario: getProgress returns correct counts

- GIVEN 30 completed dates out of 100
- WHEN `getProgress()` is called
- THEN the result is `{ completed: 30, total: 100 }`

### Requirement: MemoryRepository Port (REQ-DB-004)

The system MUST define a `MemoryRepository` interface in `src/core/ports/` with:

| Method | Signature | Returns |
|--------|-----------|---------|
| findByDateId | `(dateId: string) => Promise<Memory[]>` | Memories for a date |
| create | `(memory: Omit<Memory, 'id' \| 'createdAt'>) => Promise<Memory>` | Created memory |
| delete | `(id: string) => Promise<void>` | Void |

#### Scenario: create adds row and returns entity

- GIVEN valid memory data
- WHEN `create(memory)` is called
- THEN a new row is inserted AND the returned `Memory` has `id` and `createdAt` populated

#### Scenario: findByDateId returns memories

- GIVEN a date with 3 memories
- WHEN `findByDateId(dateId)` is called
- THEN 3 `Memory` entries are returned

#### Scenario: findByDateId returns empty for no memories

- GIVEN a date with no memories
- WHEN `findByDateId(dateId)` is called
- THEN an empty array is returned

#### Scenario: delete removes row

- GIVEN a memory with known id
- WHEN `delete(id)` is called
- THEN the row is removed from the database

### Requirement: SupabaseClient Factory (REQ-DB-005)

The system MUST provide a server-side Supabase client factory that creates a typed client using `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from `import.meta.env` with `persistSession: false`. The client MUST NOT be importable from client-side code.

#### Scenario: Client creates with valid env

- GIVEN both env vars are set
- WHEN the factory is called
- THEN a valid Supabase client is returned

#### Scenario: Throws on missing URL

- GIVEN `SUPABASE_URL` is undefined
- WHEN the factory is called
- THEN an error is thrown

#### Scenario: Throws on missing key

- GIVEN `SUPABASE_SERVICE_ROLE_KEY` is undefined
- WHEN the factory is called
- THEN an error is thrown

### Requirement: SupabaseDateRepository Implementation (REQ-DB-006)

The system MUST implement `DateRepository` using the Supabase client, mapping snake_case DB rows to camelCase `DateEntry` entities. `findAll` MUST include nested memories per date.

#### Scenario: findAll returns typed entities

- GIVEN date rows exist in DB
- WHEN `findAll()` is called
- THEN each entry is a valid `DateEntry` with camelCase fields and nested `memories`

#### Scenario: Mapping handles null optional fields

- GIVEN a date row with `description=NULL`, `completedAt=NULL`
- WHEN mapped to `DateEntry`
- THEN the entity has `description=undefined` and `completedAt=undefined`

### Requirement: SupabaseMemoryRepository Implementation (REQ-DB-007)

The system MUST implement `MemoryRepository` using the Supabase client, mapping snake_case rows to camelCase `Memory` entities.

#### Scenario: create returns Memory with id and createdAt

- GIVEN valid input data
- WHEN `create()` is called
- THEN the returned `Memory` has a UUID `id` and `createdAt` Date

#### Scenario: delete succeeds

- GIVEN an existing memory
- WHEN `delete(id)` resolves
- THEN no error is thrown

### Requirement: Environment Variables (REQ-DB-008)

The system MUST require `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` as server-only environment variables, declared in Astro config with `access: 'secret'`, and present in `.env` (gitignored).

#### Scenario: Both vars present

- GIVEN `.env` contains both variables
- WHEN the application starts
- THEN the Supabase client factory operates normally

#### Scenario: Missing URL fails at startup

- GIVEN `SUPABASE_URL` is not set
- WHEN the Supabase client factory is invoked
- THEN an error is thrown before any DB operation

#### Scenario: Missing key fails at startup

- GIVEN `SUPABASE_SERVICE_ROLE_KEY` is not set
- WHEN the Supabase client factory is invoked
- THEN an error is thrown before any DB operation
