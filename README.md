
# ✨ Dashboard-projekt med XP, Fantasier og Gamification

Dette projekt er et React + Supabase-baseret dashboard til par, hvor fantasier, belønninger og XP-point gamificerer relationen. Brugere kan tilføje, planlægge og fuldføre fantasier, optjene XP og indløse præmier. Admins kan tilpasse XP-struktur og adgang via indstillinger.

---

## 🗂 Mappestruktur

```
test-deploy/
│
├── app/
│   ├── bucketlist/
│   ├── dashboard/
│   ├── dates/
│   ├── fantasy/
│   ├── login/
│   ├── manifestation/
│   ├── settings/
│   │   ├── access/
│   │   │   └── page.tsx
│   │   ├── categories/
│   │   ├── points/
│   │   │   └── page.tsx
│   │   ├── rewards/
│   │   │   └── page.tsx
│   ├── todo/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
│
├── components/
│   ├── FantasyBoard.tsx
│   ├── RewardClaim.tsx
│   ├── SettingsPage.tsx
│   ├── Sidebar.tsx
│   ├── AppShell.tsx
│   ├── UserStatus.tsx
│   └── ui/
│       └── Modal.tsx
│
├── context/
│   ├── UserContext.tsx
│   ├── XpContext.tsx
│   └── CategoryContext.tsx
│
├── hooks/
│   └── useHasMounted.ts
│
├── lib/
│   ├── supabaseClient.ts
│   ├── getXpSettings.ts
│   ├── navItems.tsx
│   └── utils.ts
```


---

## 🧩 Funktionalitet

### Fantasier
- Kan oprettes med titel, beskrivelse, kategori, billede og effort-niveau (low/medium/high).
- Tre kolonner: `idea`, `planned`, `fulfilled`.
- Drag-and-drop mellem kolonner trigger XP-tildeling baseret på rolle og handling.

### XP Point
- Brugere optjener XP for handlinger som:
  - `add_fantasy`
  - `plan_fantasy`
  - `complete_fantasy`
- Point afhænger af effort-level og rolle.

### Roller
- `mads` og `stine` er definerede roller i `profiles`-tabellen.
- Kun `mads` har adgang til indstillinger (`/settings/*`).
- `stine` har adgang til udvalgte dele baseret på `access_control`.

### XP Settings UI
- Admin (mads) kan justere point pr. handling/effort i `/settings/points`.
- XP-ændringer gemmes i `xp_settings`.

### Profiladgang
- Tabel: `access_control`
- UI: `/settings/access`
- Admin kan give/revokere adgang til `menu_key` pr. bruger.

---

🧠 Funktionalitet

Fantasi Flow (FantasyBoard.tsx)
- Fantasier kan flyttes fra “Idé” → “Planlagt” → “Opfyldt”
- Drag-and-drop styres af DnD Kit
- Ved hver ændring logges XP til xp_log
- Der tjekkes om XP allerede er givet for opfyldelse

XP Logging
- XP læses fra xp_settings
- user_id findes baseret på rolle
- XP logges til xp_log med dato og beskrivelse
- Lokal XP opdateres via XpContext

Access Control (settings/access)
- Bruger vælges i dropdown → checkboxes for tilladte menupunkter
- Gemmer i access_control tabel i Supabase
- Navigation filtreres ud fra adgangslisten ved login

XP Settings (settings/points)
- Admin kan redigere XP pr. handling/effort direkte i inputfelter
- Opdelt i sektioner for Mads og Stine

---

## 🧱 Database-struktur

-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.access_control (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id uuid DEFAULT gen_random_uuid(),
  menu_key text,
  allowed boolean,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT access_control_pkey PRIMARY KEY (id)
);
CREATE TABLE public.bucketlist (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  type text,
  imageUrl text,
  goals jsonb,
  created_at timestamp without time zone,
  CONSTRAINT bucketlist_pkey PRIMARY KEY (id)
);
CREATE TABLE public.checkin (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  week_number integer,
  year integer,
  need_text text,
  status text,
  xp_awarded smallint,
  evaluator_id uuid,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT checkin_pkey PRIMARY KEY (id),
  CONSTRAINT checkin_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.date_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT date_categories_pkey PRIMARY KEY (id)
);
CREATE TABLE public.fantasies (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  title text,
  description text,
  image_url text,
  category text,
  effort text,
  status text,
  xp_granted boolean,
  fulfilled_date date,
  user_id uuid,
  CONSTRAINT fantasies_pkey PRIMARY KEY (id)
);
CREATE TABLE public.fantasy_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT fantasy_categories_pkey PRIMARY KEY (id)
);
CREATE TABLE public.fantasy_types (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT fantasy_types_pkey PRIMARY KEY (id)
);
CREATE TABLE public.gift_categories (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  name text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT gift_categories_pkey PRIMARY KEY (id)
);
CREATE TABLE public.profile_access (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  menu_key text NOT NULL,
  CONSTRAINT profile_access_pkey PRIMARY KEY (id),
  CONSTRAINT profile_access_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  role text DEFAULT 'user'::text,
  display_name text,
  avatar_url text,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.reward_log (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  title text,
  required_xp smallint,
  claimed_at timestamp without time zone,
  source text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  timestamp timestamp without time zone,
  rewards_id uuid DEFAULT gen_random_uuid(),
  CONSTRAINT reward_log_pkey PRIMARY KEY (id)
);
CREATE TABLE public.rewards (
  title text,
  required_xp smallint,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  type text,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  redeemed boolean DEFAULT false,
  redeemed_at timestamp without time zone,
  user_id uuid DEFAULT gen_random_uuid(),
  assigned_to text,
  category text,
  description text,
  CONSTRAINT rewards_pkey PRIMARY KEY (id)
);
CREATE TABLE public.tasks (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  title text,
  deadline date,
  done boolean,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT tasks_pkey PRIMARY KEY (id)
);
CREATE TABLE public.xp (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  value smallint,
  updated_at timestamp without time zone DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT xp_pkey PRIMARY KEY (id)
);
CREATE TABLE public.xp_log (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  change smallint,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  timestamp timestamp without time zone,
  user_id uuid,
  role text,
  CONSTRAINT xp_log_pkey PRIMARY KEY (id),
  CONSTRAINT xp_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.xp_settings (
  id integer NOT NULL DEFAULT nextval('xp_settings_id_seq'::regclass),
  created_at timestamp with time zone DEFAULT now(),
  role text NOT NULL,
  action text NOT NULL,
  effort text,
  xp integer NOT NULL,
  CONSTRAINT xp_settings_pkey PRIMARY KEY (id)
);
---

## 🚀 Flow og Point-tildeling

### Mads
- `add_fantasy` → 1 XP
- `complete_fantasy` → afhænger af effort (2/3/4 XP)
- `plan_fantasy` → ingen XP
- Når Mads rykker en fantasi til “fulfilled” → **Stine** får point

### Stine
- `add_fantasy` → (100/200/300)
- `plan_fantasy` → (50/100/150)
- `complete_fantasy` → (300/400/500)

---

## ✅ Testresultater

- ✅ Mads tilføjer fantasi → får 1 XP
- ✅ Stine tilføjer fantasi med effort → får korrekt XP
- ✅ Stine planlægger fantasi → får korrekt XP
- ✅ Stine fuldfører fantasi → får korrekt XP
- ✅ Mads fuldfører Stines fantasi → Stine får XP
- ✅ Admin kan redigere XP værdier
- ✅ Adgangsstyring virker via `access_control`

---

## 📦 Supabase Features Bruges

- Auth (login/session)
- Realtime disabled
- `insert`, `select`, `update`, `eq`, `maybeSingle`
- Custom tabel `xp_log`, `xp_settings`, `access_control`
- RLS er deaktiveret (admin only)

---

## 🛠 Næste trin

- [ ] Indfør badges eller niveauer
- [ ] Historik over opnåede XP og milepæle
- [ ] Statistik-side
- [ ] Drag 'n' drop feedback animation
- [ ] Mulighed for at redigere fantasier


Udviklingslog d.4/6 - 2025
1. XP-systemet forenklet:

Vi har fjernet feltet xp_cost og bruger nu kun required_xp til at styre, hvornår en gave kan indløses.

Det gør XP-økonomien mere overskuelig og minimerer kompleksiteten i både visning og indløsning.

2. Oprettelse af gaver:

På siden /settings/rewards kan man nu oprette gaver med følgende felter:

Titel og beskrivelse

XP-krav (required_xp)

Modtager (assigned_to: Mads eller Stine)

Kategori (category: fantasy eller todo)

Type (type: ting, oplevelse eller tjeneste)

Alt gemmes i Supabase, og listen opdateres automatisk efter indsendelse.

3. Dynamisk oprettelse af kategorier og typer:

Vi har lavet en side, hvor man kan tilføje og slette både fantasikategorier og fantasityper direkte fra frontend.

Kategorier gemmes i tabellen fantasy_categories, og typer i fantasy_types.

Opdatering d.4/6 - 2025:
README – XP-baseret Dashboard for Par

Dette projekt er et interaktivt React-dashboard bygget med Supabase, hvor to brugere – Mads og Stine – kan optjene og bruge XP-point gennem "fantasier" og gaver. Systemet er designet med fokus på gamification og relationsudvikling.

Funktioner

1. Fantasier

Fantasier kan tilføjes af begge brugere.

Har felter som titel, beskrivelse, billede, kategori, effort (Low, Medium, High) og status (idea, planned, fulfilled).

Træk-og-slip mellem kolonner med dnd-kit.

XP gives baseret på handling og effort-niveau:

Add fantasy → XP til den der tilføjer

Plan fantasy → XP til modparten

Complete fantasy → XP til modparten

XP gemmes i xp_log-tabellen.

Hvis en fantasi slettes, fjernes også den tilhørende add_fantasy XP-entry fra xp_log.

2. Dashboard / Forside

Viser total XP som cirkeldiagram.

Viser næste gave, som er oprettet til brugeren og ikke er indløst endnu.

Knap til at indløse gaven (aktiveres når XP er nok).

Indløsning trækker XP og markerer gaven som "redeemed".

Viser hvor mange fantasier der er klar til opfyldelse og det samlede XP-potentiale.

3. Gaver (Rewards)

Gaver kan oprettes af brugeren via /settings/rewards.

Gaven tildeles til enten Mads eller Stine via assigned_to + user_id.

Har felter: titel, beskrivelse, required_xp, kategori, type.

Gaver vises i en liste over uindløste gaver på siden.

Mulighed for at redigere eller slette gaver.

Indløste gaver vises i bunden.

4. XP-system (Context)

XpContext giver adgang til nuværende XP og funktioner til at hente/opdatere det.

Automatisk opdatering når bruger logger ind eller point tildeles/fratrækkes.

Teknologi

React + TypeScript

Supabase (auth, database)

dnd-kit (drag & drop fantasier)

react-circular-progressbar (XP-visualisering)

TailwindCSS til styling

Mappestruktur

app/
  ├─ dates/
  ├─ fantasy/
  ├─ login/
  ├─ manifestation/
  ├─ profile/
  ├─ settings/
  ├─ todo/
  ├─ layout.tsx
  ├─ page.tsx
  ├─ checkin.tsx

components/
  ├─ ui/
  │   ├─ badge.tsx
  │   ├─ button.tsx
  │   ├─ card.tsx
  │   ├─ input.tsx
  │   ├─ label.tsx
  │   ├─ modal.tsx
  │   ├─ progress.tsx
  │   ├─ RichTextEditor.tsx
  │   ├─ tabs.tsx
  │   └─ tiptap.css
  ├─ AppShell.tsx
  ├─ BucketBoard.tsx
  ├─ ClientSidebarWrapper.tsx
  ├─ DateIdeasBoard.tsx
  ├─ FantasyBoard.tsx
  ├─ RewardClaim.tsx
  ├─ SettingsPage.tsx
  ├─ Sidebar.tsx
  └─ UserStatus.tsx

context/
  ├─ CategoryContext.tsx
  ├─ UserContext.tsx
  └─ XpContext.tsx

hooks/
  └─ useHasMounted.ts

lib/
  ├─ db.ts
  ├─ getXpSettings.ts
  ├─ navItems.tsx
  ├─ supabaseClient.ts
  └─ utils.ts

Database-tabeller

fantasies: Alle fantasier med status og effort

xp_log: Logger alle XP-tildelinger og fratræk

xp_settings: Opsætning af XP pr. rolle, handling og effort

profiles: Indeholder brugerinfo, rolle og display_name

rewards: Gaver med required XP og redeem-status

gift_categories + fantasy_types: Brugt som dropdown-options til oprettelse

Vigtige regler

XP for fantasier gives kun én gang pr. handling

XP fjernes automatisk, hvis en fantasien slettes (kun for add_fantasy)

Gaver knyttes til en bestemt bruger og bliver kun synlige for denne

En bruger kan kun indløse gave hvis XP >= required_xp

Forfatter

Udviklet i samarbejde med ChatGPT og brugeren, med fokus på at bygge et motiverende og sjovt gamification-system for parforhold.

Videreudvikling

Badges og niveauer

Historik og statistik-visning

Skema over indløste fantasier og præmier

Notifikationer og XP-animationer

Mobiloptimering

Klar til overlevering. Næste udvikler kan nu sætte sig ind i hele systemets struktur, arkitektur og funktioner.

## Check-in system (5 juni 2025)

- Oprettet side: `/checkin` til ugentligt check-in mellem Mads og Stine
- Hver person kan angive op til 3 behov per uge
- Den anden part evaluerer behovene søndag (✅ Opfyldt, ⚖️ Middel, ❌ Ikke opfyldt)
- Point tildeles: ✅ = 30 XP, ⚖️ = 20 XP, ❌ = 10 XP – logges i `xp_log`
- Evaluering er kun tilladt på modpartens behov
- Evaluationsknapper vises kun for modparten og fjernes helt for én selv
- Historik vises opdelt for Mads og Stine, kun for tidligere uger
- Brugerrolle fastlægges via `supabase.auth.getSession()`

### Databaseændringer
- Ny tabel: `checkin`
  - Felter: `id`, `user_id`, `need_text`, `week_number`, `year`, `status`, `xp_awarded`, `evaluator_id`
- Tabel: `xp_log`
  - Nye entries logges med rolle og beskrivelse af evaluering (f.eks. "Check-in behov: fulfilled")

✅ Check-in funktion (opdatering)
Beskrivelse
Checkin-siden giver Mads og Stine mulighed for at indtaste op til 3 behov hver uge. Den anden part evaluerer behovene, og tildeler XP via knapper med tre vurderingsmuligheder: godkendt, middel, eller ikke godkendt.

Funktioner implementeret
Inputfelter til ugentlige behov for Mads og Stine

Gem-funktion, der indsætter behov i checkin-tabellen med status pending

Visning af aktive behov for indeværende uge

Evalueringsknapper vises kun for den anden person (ikke ens egne behov)

Ved evaluering:

XP tildeles baseret på handlingstype (trukket fra xp_settings)

En række tilføjes i xp_log tabellen

Status og XP opdateres i checkin-tabellen

Historik vises med farver og point for tidligere evaluerede behov

Alt data vises pr. bruger

Database-tabeller opdateret
xp_settings

Tilføjet tre handlingstyper til rollen common:

evaluate_fulfilled

evaluate_partial

evaluate_rejected

##### Opdatering 5/6 - 2025 #####

✅ Mads tilføjer fantasi → får 1 XP

✅ Stine får korrekt XP afhængigt af effort ved planlægning (idea og planned) og fuldførelse (planned → fulfilled)

✅ Potentielle XP vises korrekt baseret på fantasier og behov

✅ XP for fantasier læses fra xp_settings afhængigt af rolle, action og effort

✅ XP for checkins afhænger af evaluator_id og handlingstype (evaluate_*)

✅ Checkins tildeles automatisk til modparten ved oprettelse

✅ Admin kan redigere XP-værdier pr. handling og effort via /settings/points

📦 Supabase Features Bruges

Auth (login/session)

Realtime disabled

insert, select, update, eq, maybeSingle, in, or

Custom tabeller: xp_log, xp_settings, fantasies, checkin, access_control

RLS er deaktiveret (admin only)

📊 Databaseændringer (opdateret 5. juni 2025)

Tabel xp_settings:

XP pr. rolle (mads, stine) + action (plan_fantasy, evaluate_partial, etc.) + effort (low/medium/high/null)

Dobbeltopførte eller forkerte værdier ryddet ud for at sikre korrekt xpMap

Tabel checkin:

Tilføjet evaluator_id for at kende hvem der skal evaluere behovet

Evaluering foretages kun af modpart

XP for behov beregnes på dashboardet ud fra forventet handlingstype (evaluate_partial_)

Tabel fantasies:

Fantasier kan tilføjes af Mads eller Stine

XP gives kun til Stine for plan_fantasy og complete_fantasy

Status bruges til at beregne potentiel XP på forsiden

📌 Logik i dashboardet (page.tsx)

Henter brugerens profil og rolle

Henter relevante fantasier og checkins for begge parter

Henter XP-settings for brugerens rolle

Beregner potentielle point:

Checkin XP = antal pending behov * evaluate_partial_

Fantasy XP:

Hvis rolle = stine:

Alle fantasier i status idea og planned → plan_fantasy_{effort}

Hvis planned og xp_granted !== true → complete_fantasy_{effort}

XP vises som cirkeldiagram + næste gave

Indløsning trækker XP og markerer reward som redeemed

✅ Afsluttet

Projektet afspejler nu korrekt gamification-logik:

Rigtig XP-beregning

Tydelig rollefordeling

Korrekt potentielle point på forsiden

Administrerbare XP-indstillinger

Klar til udvidelse med niveauer, statistik og historik

