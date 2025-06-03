# Mit Dashboard – README

Et omfattende gamification-dashboard bygget i Next.js med Supabase som backend. Projektet er udviklet med henblik på at skabe et motiverende, personligt system med XP, præmier, fantasier, todo-opgaver, og meget mere. Systemet er struktureret med en række moduler og boards, og det er muligt at administrere adfærd og point via et login.

---

## 🧱 Teknisk stack

- **Frontend**: Next.js (v15), TypeScript, Tailwind CSS, React, Radix UI, DnD Kit, Chart.js, Tiptap (rich text)
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Deployment**: Railway (med GitHub-integration)

---

## 🌐 Projektstruktur

```
├── app/
│   ├── page.tsx                  → Forside (Dashboard med XP-visualisering)
│   ├── bucketlist/              → Bucketlist board
│   ├── dates/                   → Date Ideas board
│   ├── fantasy/                 → Fantasier med drag/drop, statistik og historik
│   ├── manifestation/           → Manifestation board
│   ├── settings/                → Indstillinger (fx kategorier og præmier)
├── components/                  → Genanvendelige UI-komponenter (modals, kort, editor)
├── context/                     → React context (XP, kategorier)
├── lib/                         → Supabase client og utils
├── public/                      → Statisk indhold (billeder mm.)
├── styles/                      → CSS og Tailwind-konfiguration
├── .env.local                   → Supabase credentials mm. (via Railway Env vars)
├── next.config.js               → Next.js konfiguration
├── tailwind.config.ts           → Tailwind konfiguration
```

---

## 🗃️ Supabase database-struktur

Herunder ses en oversigt over de vigtigste tabeller og deres struktur:

### `xp_log`

| Kolonne      | Type        | Beskrivelse                    |
| ------------ | ----------- | ------------------------------ |
| id           | UUID        | Primærnøgle                    |
| change       | Integer     | Ændring i XP (positiv/negativ) |
| assigned_to  | Text        | 'mads' eller 'stine'           |
| description  | Text        | Hvad XP blev tildelt for       |
| created_at   | Timestamptz | Hvornår tildelingen skete      |

### `xp_settings`

| Kolonne                       | Type    | Beskrivelse                     |
| ----------------------------- | ------- | ------------------------------- |
| id                            | Integer | Skal være 1 (singlerow tabel)   |
| add_fantasy_xp               | Integer | Point for at tilføje en fantasi |
| complete_fantasy_xp_low      | Integer | Point for lav effort            |
| complete_fantasy_xp_medium   | Integer | Point for middel effort         |
| complete_fantasy_xp_high     | Integer | Point for høj effort            |

### `fantasies`

| Kolonne         | Type    | Beskrivelse                            |
| --------------- | ------- | -------------------------------------- |
| id              | UUID    | Fantasiens ID                          |
| title           | Text    | Titel                                  |
| description     | Text    | HTML fra RichTextEditor                |
| category        | Text    | Kategori                               |
| effort          | Text    | Low, Medium eller High                 |
| status          | Text    | idea, planned eller fulfilled          |
| image_url       | Text    | Valgfrit billede                       |
| xp_granted      | Boolean | Om XP er blevet tildelt for opfyldelse |
| fulfilled_date  | Date    | Hvornår den blev opfyldt               |

### `fantasy_categories`

| Kolonne | Type | Beskrivelse        |
| ------- | ---- | ------------------ |
| id      | UUID | ID for kategori    |
| name    | Text | Navn på kategorien |

### `rewards`

| Kolonne      | Type        | Beskrivelse                       |
| ------------ | ----------- | --------------------------------- |
| id           | UUID        | ID                                |
| title        | Text        | Navn på præmien                   |
| required_xp  | Integer     | Pointkrav                         |
| assigned_to  | Text        | 'mads' eller 'stine'              |
| redeemed     | Boolean     | Om den er indløst                 |
| redeemed_at  | Timestamptz | Dato for indløsning               |
| xp_cost      | Integer     | Hvor mange point præmien koster   |

### `reward_log`

| Kolonne     | Type        | Beskrivelse           |
| ----------- | ----------- | --------------------- |
| id          | UUID        | ID                    |
| reward_id   | UUID        | Reference til rewards |
| user_id     | Text        | 'mads' eller 'stine'  |
| created_at  | Timestamptz | Hvornår indløst       |

### `bucketlist`

| Kolonne   | Type    | Beskrivelse          |
| --------- | ------- | -------------------- |
| id        | UUID    | ID                   |
| title     | Text    | Ønske                |
| completed | Boolean | Om den er gennemført |

### `tasks`

| Kolonne   | Type    | Beskrivelse        |
| --------- | ------- | ------------------ |
| id        | UUID    | ID                 |
| title     | Text    | To-do opgave       |
| completed | Boolean | Om opgaven er løst |

---

## 📊 Funktioner

- **XP-system**: Brugere tildeles XP for forskellige handlinger, fx at tilføje fantasier eller fuldføre dem (med differentiering efter effort).
- **Visuelle dashboards**: Cirkeldiagrammer for Mads og Stine, kommende præmier, og mulige pointmuligheder vises dynamisk.
- **Drag-and-drop**: Fantasier kan flyttes mellem statusser.
- **Adminpanel**: Under “Indstillinger” kan man definere pointværdier og administrere præmier og kategorier.
- **Modulopbygget**: Der er separate boards for fantasier, date-ideer, manifestationer og bucketlist.

---

## 🚀 Deployment og miljøvariabler

Projektet deployes via Railway og er koblet til GitHub.

### Miljøvariabler i `.env.local`

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Disse sættes som “Environment Variables” i Railway under projektets settings.

---

## 📌 Tips

- Projektet fungerer som udgangspunkt med ét login, men det er muligt at udvide til individuel auth.
- Alle visninger og XP-funktionalitet er responsive og optimeret til både desktop og mobil.
- Sørg for at `tsconfig.json` har `baseUrl` og korrekt `paths` sat hvis du bruger aliaser med `@/`.

---

## 📄 License

MIT License – frit til personlig brug og udvikling.

---

> Projektet er udviklet af Mads Kristensen og baseret på personlig gamification og relationel motivation.