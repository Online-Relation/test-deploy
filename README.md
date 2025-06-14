
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
        └── badge.tsx
        └── TagBadge.tsx
        └── button.tsx
        └── card.tsx
        └── input.tsx
        └── label.tsx
        └── progress.tsx
        └── RichTextEditor.tsx
        └── tabs.tsx
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

## Databaseændringer
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

## Opdatering 5/6 - 2025

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

## Dagsrapport d.6/6 - 2025
Hvad vi har lavet i dag
Tilbageført til fungerende version af layout og styling uden global padding (p-6) på .card i globals.css.

Klart skel mellem global styling og lokal padding for cards — padding styres nu lokalt i komponenter som FantasyBoard eller Card.

Gennemgang og fastlæggelse af farver og tekstfarver i globals.css med CSS-variabler for let global farvestyring.

Justering af tailwind.config.js med farver og typografi som tidligere, uden at påvirke layoutet.

Genindført korrekt brug af card-klassen uden global padding i globals.css.

Sikret at padding til cards håndteres via komponenternes egne className og ikke globalt.

Bekræftet, at FantasyBoard og Card komponenter nu bruger de rette klasser uden at ødelægge layout.

Fjernet forsøg på global padding i globals.css som gav layoutproblemer.

Enig om, at global styling skal håndtere farver, typografi og rammer, mens spacing/padding håndteres lokalt for fleksibilitet.

Besluttet at tage en pause på dette stadie for at undgå yderligere forvirring og ødelæggelser.

Database
Ingen ændringer i database eller tabeller i denne session.

Implementerede funktioner
Funktionelle drag & drop kort i FantasyBoard med lokal styling.

Modal til oprettelse og redigering fungerer som tidligere, uden globale stylingkonflikter.

Brug af Tailwind CSS variabler til farver og tekst i globale styles.

## Opdateret: 7. juni 2025


Oprettet mapper for Check-in undersider i app/checkin:

app/checkin/oversigt

app/checkin/mine-behov

app/checkin/historik

app/checkin/evaluering

Tilføjet tilhørende sider page.tsx i hver mappe

Opdateret adgangskontrol for de nye undersider i UserContext.tsx og Sidebar.tsx

Opdateret: 6. juni 2025

Added access control integration in UserContext and Sidebar, ensuring per-user menu visibility.

Refactored Sidebar.tsx to use hierarchical accessHierarchy for main and submenus.

Updated UserContext.tsx to reliably fetch profiles and access_control, converting undefined fields to null.

Documented changes under relevant sections for clarity.

Oversigt

Dette projekt er et personligt dashboard til administration af diverse aktiviteter, blandt andet:

Fantasymodulet (Parforhold)

Check-in (ugentlige behov)

To-Do-liste, Date Ideas, Manifestation, Karriere, Bucketlist

Indstillings­sider til XP‑opsætning, Rewards, Kategorier og Adgangskontroller

#### Opdateret: 9. juni 2025
Projektoversigt

Vi har udviklet en ny side /bucketlist-couple i vores Next.js-app, hvor par kan oprette, redigere og følge deres fælles bucket list.

Nøglefunktioner

Board- og Timeline-visning

Skift mellem oversigt som grid af kort (Board) og en tidslinje (Timeline).

Bucket CRUD

Opret nye buckets med titel, beskrivelse og kategori.

Redigér eksisterende buckets og gem ændringer.

Kategori-funktionalitet

Dropdown-menu i modal for at vælge kategori.

Badge på hvert kort viser kategori-navn.

Delmål (Subgoals)

Tilføj, marker som færdige og track delmål pr. bucket.

Billedupload til delmål

Upload billede per delmål og vis i kortene.

Responsivt design

Grid justeres til mobile, tablet og desktop.

Styling

Globale Tailwind-klasser via globals.css, komponenter med btn, btn-primary osv.

Databaseopdateringer

Vi har oprettet og ændret følgende tabeller i Supabase:

bucketlist_couple

Tilføjede kolonner:

title (text)

description (text)

category (uuid) → fremmednøgle til bucket_categories.id

goals (jsonb) → array af delmål

created_at (timestamptz)

RLS-policies:

SELECT for alle brugere

INSERT for authenticated users

UPDATE for authenticated users

Constraints:

Foreign key category → bucket_categories(id)

(Optionelt) category sat til NOT NULL efter migrering af eksisterende data.

bucket_categories

Primærnøgle id (uuid)

name (text) → kategori-navn (fx "Rejser", "Parforhold")

Hvad er næste skridt

Fjerne midlertidige default-kategorier, når alle eksisterende buckets er migreret.

Test og QA af billedupload.

Implementere filtrering pr. tidsperiode i Timeline.

Tilføje bruger-feedback (notifikation ved færdigt delmål).

## 2025-06-09

- **BucketContext**: Added support for deadlines on buckets and subgoals, plus subgoal owner assignment; updated state and methods in `context/BucketContext.tsx`.
- **Bucketlist Couple Page** (`app/bucketlist-couple/page.tsx`): Integrated deadline and owner fields in create/edit modal; default view set to Board; fetched `profiles.display_name` for owner dropdown.
- **BucketTimeline** (`components/BucketTimeline.tsx`): Enhanced timeline to show bucket deadlines, subgoal deadlines, and owner avatars (initials); styling aligned with board cards.
- **Database**:
  - `bucketlist_couple`: Added `deadline` column; updated JSON `goals` objects to include `dueDate` and `owner` fields.
  - `profiles`: Utilizing `display_name` for dropdown.
  - `bucket_categories`: unchanged.

## 2025-06-09
Bucketlist: billedupload og redigering
Tilføjet billedupload til både oprettelse og redigering af mål i bucketlist_couple.

Billeder uploades til Supabase Storage under bucket bucket-images.

Den offentlige billed-URL gemmes i feltet image_url på den enkelte bucket.

updateBucket-funktionen i BucketContext er udvidet med imageUrl som parameter.

addBucket og updateBucket håndterer begge nu valgfrit billede og gemmer det korrekt i databasen.

Fejlhåndtering ved upload er tilføjet, og fetchBuckets() kaldes ved success for at sikre UI-opdatering.

## Opdatering 10/6 - 2025 ##

✅ 
🪣 Bucketlist for Par – Udvidet funktionalitet
Vi har implementeret en komplet bucketlist-funktion til par med følgende features:

Funktionalitet
Brugere (Mads og Stine) kan oprette bucket goals direkte via UI.

Hvert mål kan have et billede, en deadline, en beskrivelse og en kategori.

Brugeren kan tilføje delmål (subgoals) med ejer og eventuel deadline.

Delmål kan markeres som fuldført, og XP tildeles til den ansvarlige – uanset hvem der trykker.

Billeder kan uploades til hvert delmål og vises visuelt.

Data gemmes i Supabase i tabellen bucketlist_couple.

Billeder gemmes i Supabase Storage under bucket bucketlist-couple.

UI-komponenter og filer
/app/bucketlist-couple/page.tsx – visning og oprettelse af mål og delmål.

/context/BucketContext.tsx – styring af buckets, delmål, billeder og XP-logik.

/components/BucketCard.tsx – visning af individuelle bucket mål.

Dashboard-integration
Delmål tælles med i det potentielle XP på forsiden.

Dashboardet tjekker mål der ikke er fuldført, og som har nuværende bruger som owner.

XP beregnes dynamisk ud fra xp_settings, baseret på rollen og handlingen complete_subgoal.

📊 Databaseændringer
bucketlist_couple
Nye felter og struktur:

image_url – billede for hovedmål (bucket)

goals – array af delmål med følgende felter:

id (UUID)

title

done (boolean)

dueDate (valgfri)

owner (user_id fra profiles)

image_url (link til billede)

xp_log
Når et delmål markeres som done, tilføjes en række til xp_log:

change, description, user_id, role

xp_settings
Handling complete_subgoal skal være defineret for både mads og stine med XP-værdi.

📁 Supabase Storage
Billeder gemmes i:

bash
Kopiér
Rediger
bucketlist-couple/bucket-images/{bucketId}_{subgoalId}.jpg
Ved upload konverteres filen til en public URL via getPublicUrl().

Public URL indsættes i goals.image_url.

🧠 Ekstra funktioner
XP bliver ikke givet til den som klikker, men til den som er ejer (owner) af delmålet.

Billeder vises forskelligt afhængigt af profil – men tilgængelige hvis public URL er sat korrekt.

Bug fix: billeder blev tidligere ikke gemt korrekt, fordi image_url ikke blev sendt med i addBucket. Dette er nu løst.

## Opdatering 10/6 - 2025 ##
Ny tabel: compliment_logs

Felter: id (UUID), compliment_id (integer, FK → compliments.id), given_date (date), created_at (timestamptz)

Migreret med justeret type på compliment_id for at matche compliments.id (integer)

Udvidelse af sexlife_logs

Tilføjet kolonner: had_sex (boolean), notes (text), log_date (date), created_at (timestamptz)

Oprettet sexlife_log_tags join-tabel: id, log_id (FK → sexlife_logs.id), tag_id (FK → tags.id), created_at

Ny tabel: tags

Felter: id (UUID), name (text), created_at (timestamptz)

Ny tabel: sexlife_log_tags

Bindetabel til tags: log_id, tag_id (begge UUID)

Ny tabel: wishes

Felter: id (UUID), user_id (UUID, FK → profiles.id), description (text), created_at (timestamptz)

Opdatering af profiles

Tilføjet kolonne buksedragt (text) til tøjstørrelser

## Opdatering d. 10/6 - 2025 ##
Funktionalitet implementeret
Fantasier – Billeder og tilføjelser

Nyt felt hasExtras tilføjet i fantasies-tabellen for at markere fantasier med ekstra tilføjelser.

extra_images array understøttes nu i både database og modal.

Modal har fået et nyt felt (checkbox) til at aktivere ekstra upload.

Understøttelse af multiple image upload, som gemmes i Supabase Storage under fantasies/extras/.

Ved visning i modal:

Hvis extra_images er til stede, vises billedekarusel med pile til at navigere mellem billederne.

Hvis kun image_url findes, vises dette som fallback.

Alle funktioner fra tidligere version (titel, beskrivelse, kategori, effort, redigering, sletning) er bevaret og ikke strippet.

Rettelser og stabilisering
Forhindrede stripning af funktioner i Modal.tsx ved bevidst bevaring af eksisterende funktioner under tilføjelse af billedekarusel.

Rollehentning for XP og adgang kontrolleres fortsat via profiles.

Opdatering pr. 2025-06-10
Hvad vi har lavet i denne session
FantasyBoard komponenten

Genoprettet og rettet supabase-import og kald, så alle funktioner nu virker korrekt.

Tilføjet håndtering af XP, filtrering, kategorier og drag-and-drop (DND-kit).

Rettet bug, så kort kan flyttes korrekt på desktop (drag-and-drop).

Sikret korrekt visning af billeder, beskrivelse og badges på kort.

Tilføjet visning af oprettelsesdato og planlagt dato på kortene.

Implementeret læse- og redigeringsmodal med RichTextEditor og billedupload (inkl. galleri).

Implementeret luk-knap og korrekt håndtering af ekstra billeder i modal.

Mobiltilpasning med dropdown til status (idea, planned, fulfilled).

Rettet håndtering af opdatering og sletning af fantasier via modal.

useFantasyBoardLogic hook

Udvidet data med created_date og planned_date felter.

Håndtering af opdatering af datoer ved oprettelse og flytning mellem statusser.

Ryddet op og sikret supabase-kald til fetch, update, delete, og XP-log.

Modal komponenten

Genindført RichTextEditor til beskrivelse med fuld funktionalitet inkl. formatering.

Tilføjet understøttelse af ekstra billedupload og visning i galleri.

Implementeret luk-knap (krydset øverst).

Sikret mobilvenlig status-dropdown.

Rydelig visning af badges i modal (kategori, indsats).

Databaseændringer
fantasies tabellen er udvidet med følgende nye kolonner:

created_date (date) — dato for oprettelse af fantasi


Opdatering 2025-06-11
Nye funktioner og rettelser
FantasyBoard forbedringer:

Implementeret dato for oprettelse (created_date) og planlagt dato (planned_date) på fantasier.

Udvidet database og frontend til at håndtere og vise disse datoer.

Rettet fejl ved drag & drop, så statusopdatering sker korrekt på desktop og mobil.

Tilføjet mobil dropdown til statusændring af fantasier.

Optimeret modal med RichTextEditor i stedet for textarea til beskrivelse.

Løst issue med ekstra billeder: Galleri vises korrekt i modal og antal billeder vises som badge på kort.

Implementeret luk-kryds i modal og forbedret scroll i modal.

Sexlife-registrering:

Implementeret funktion til at registrere sexlivsdage med tilknyttede tags.

Tilføjet beregning af gennemsnitligt antal dage med sex pr. uge over de seneste 4 uger.

Rettet fejl i gennemsnitsberegning, så unikke dage tælles korrekt per uge.

Opdateret frontend på sex-side til at vise gennemsnitlig sex-dage pr. uge.

Komplimenter:

Genskabt funktionalitet til at hente dagens kompliment fra databasen.

Tilføjet lokal lagring for at sikre, at dagens kompliment ikke skifter i løbet af dagen.

Visualiserer registreringer af komplimenter pr. måned i et søjlediagram.

Generelle forbedringer og fejlrettelser:

Fuld integration af Supabase-klient i alle relevante filer for at undgå Cannot find name 'supabase'-fejl.

Sikret korrekt opdatering og vedligeholdelse af ekstra billeder i fantasier.

Optimeret håndtering af tilstand i modaler med klar separation mellem visning og redigering.

Fjernet hydration mismatch fejl ved at undgå dynamiske værdier i server-side rendering.

Databaseopdateringer
Tilføjet kolonner i fantasies tabellen:

created_date (DATE)

planned_date (DATE)

Tilføjet kolonne i compliments tabellen:

created_at (TIMESTAMP WITH TIME ZONE, default now())

Tilføjet nye records i sexlife_logs tabellen til registrering af sex-dage med dato og tags.

🛠 Opdatering 11. juni 2025
✅ Opgaveside til par
Ny side: /tasks-couple

Funktioner:

Tilføj opgave med titel, beskrivelse, deadline og ansvarlig (dropdown: Mads eller Stine)

Visning af aktive og fuldførte opgaver i kort

Markér som fuldført → tildeler XP til den ansvarlige (via xp_settings)

Mulighed for at redigere og slette opgaver

Formular vises nederst og fylder mindre (max-w-md)

Database:

Ny tabel tasks_couple

XP hentes ud fra complete_task entry i xp_settings

Fil: /app/tasks-couple/page.tsx

⚙️ Sidebar opdateret
Nyt menupunkt: “Opgaver” (tasks-couple) med ListTodo ikon

“Sex” under parforhold har nu ikon (Heart)

accessHierarchy og iconMap opdateret tilsvarende

🔐 Adgangsside opdateret
/settings/access viser nu hele det opdaterede menuhierarki:

Inkluderer alle punkter fra sidebar, inkl. tasks-couple, fantasy/sex, bucketlist-couple

Alle funktioner til valg, visning og opdatering af adgang er bevaret

Dropdown med brugere og checkboxes per menu entry

Opdatering sker via upsert til access_control

## Opdatering – 2025-06-11 ##
Funktionalitet tilføjet i /app/spil/sellerk/page.tsx
Brugerbaseret tracking af brugte kort

Når en spiller (Mads eller Stine) trækker og fuldfører et kort, gemmes det i truth_dare_log.

Systemet sikrer, at hver spiller skal besvare samme kort, men kort aldrig gentages for en spiller.

usedCardIdsForTurn holder styr på hvilke kort den aktuelle spiller har brugt.

Wildcards hver 20. kort

Et wildcard aktiveres automatisk for hver 20. tur med specialbesked og tvungen valg af type.

Visning af hvor mange kort der er tilbage

Viser hvor mange truth og dare kort den aktive spiller har tilbage inden for det valgte tema.

Antallet opdateres automatisk og vises under profilbilledet for aktiv spiller.

Glidende animation af kort-tilgængelighedsboksen

Når turen skifter, vises/hides boksen med glidende animation under profilbillederne.

Forbedret layout og responsivt design

Større profilbilleder (w-24 h-24)

CTA'er (Sandhed, Konsekvens, Jeg fuldførte det) har nu pænere animation ved visning.

Mindre afstande mellem komponenter for mobiloptimering.

Temafarver og chips

Nye temaer glow, sol, romantik har fået farveindstillinger (baggrund, kortkant, knapfarve).

Aktiv chip vises tydeligere med scale, farvet baggrund og border.

Inaktive chips er lidt nedtonede (opacity-80) og har hover-effekt.

Default chip-funktionalitet

Hvis man spiller med temaet default, vælges kort tilfældigt uanset kategori.

Viser samlet antal tilbageværende truth og dare kort i hele databasen for den aktive spiller.

Ændringer i databasen (Supabase)
Ny tabel: truth_dare_log

Kolonner: user_id, card_id

Logger hvilke kort hver spiller har haft, så de ikke får dem igen.

Indhold i truth_dare_cards

+300 kort importeret med category sat til fx "Frækkeste".

CSV'er opdateret til at have store begyndelsesbogstaver på kategorier.

Indhold i game_themes

Nye rækker tilføjet:

glow: gule farver

sol: lysegul/solskin

romantik: lyserød/romantisk

✅ 2025-06-12 – Drag & Drop fejl og opdateringer
Det er lavet i dag:

Vi har gennemgået og genindsat hele koden til /app/components/FantasyBoard.tsx uden at fjerne funktioner.

Vi har tilføjet sensors med PointerSensor, rectIntersection som collisionDetection, samt DragOverlay og activeFantasyId for at understøtte korrekt drag state.

handleDragEnd og handleDragStart er blevet korrekt koblet til.

XP-logik og status-opdatering ved drag mellem kolonner virker som forventet.

Vi har tilføjet visuel feedback når man trækker kort.

Men:

Drag & drop fungerer stadig ikke – kort hopper tilbage til deres oprindelige kolonne, og handleDragEnd kaldes korrekt, men ændringer slår ikke igennem visuelt.

Vi mistænker, at useFantasyBoardLogic ikke opdaterer fantasies hurtigt nok eller korrekt efter statusændring.

Plan fremad:

Tjek om fetchFantasies() bliver kaldt rigtigt efter update.

Undersøg om setFantasies kaldes, og om state opdateres synligt.

Overvej at anvende sortable fra @dnd-kit/sortable hvis nuværende løsning bliver for ustabil.

## ✅ Opdatering: Profilside (2025-06-13) ##
Vi har udvidet og redesignet /app/profile/page.tsx med fokus på visuel lækkerhed, personlighed og gamification.

🎯 Funktioner
Faner (Tabs): Tøjstørrelser, Ønskeliste og Kærlighed

Avatar-upload til Supabase Storage

Tøjstørrelser: Formular til bh, trusser, jeans osv.

Ønskeliste: Dynamisk liste der gemmes i wishes-tabellen

Kærlighedsfanen indeholder:

5 kærlighedssprog (dropdowns)

Dopamin-triggers (drag & drop, chips, gemmes i profiles.dopamine_triggers som JSON)

Overraskelser (tekstfelt gemt i profiles.surprise_ideas)

🧱 Databaseændringer
Tabel: profiles

Tilføjede kolonner:
love_language_1 text,
love_language_2 text,
love_language_3 text,
love_language_4 text,
love_language_5 text,
dopamine_triggers text,
surprise_ideas text

📦 Supabase Features Bruges
from('profiles').update(...)

Storage: upload af avatar

wishes-insert og delete

JSON-stringifikation og parsing af dopamin-liste

## Opdatering 13/6 - 2025 ##
✅ Parquizzen integreret som spilfunktion

Ny side: /spil/quizzen

Spørgsmål hentes dynamisk fra Supabase-tabel couple_quiz_questions (kun aktive)

To svar-knapper: "Gættede rigtigt" og "Gættede forkert"

Når en knap trykkes:

XP logges til xp_log baseret på action quiz_correct eller quiz_wrong og brugerens rolle

Næste spørgsmål vises automatisk

✅ XP-systemet udvidet med quiz-points

Ny kategori i /settings/points:

Handlingstyper: quiz_correct, quiz_wrong

Kan justeres individuelt for mads og stine

XP tildeles ved hjælp af eksisterende XpContext og xp_settings

✅ Fejlrettelser og forbedringer

Tilføjet manglende kolonner action og user_id til xp_log

Fejl 400 ved POST til xp_log løst

Fjernet global padding-konflikter

XP-opdatering fejlede pga. manglende action-kolonne i schema — nu rettet

Spil: Parquizzen

Implementeret XP-feedback med animation:

🎉 Konfettiregn ved korrekt svar

💥 Rød eksplosion + shake-effekt ved forkert svar

Tilføjet hop-animation på point-beskeder via framer-motion

Tilføjet visning af:

Antal spørgsmål tilbage til den aktive svarer

Bar-graf med rigtige og forkerte svar for både Mads og Stine

Statistik vises altid for begge par – uanset hvem der har tur

Responsivt layout til mobil og desktop (flex og auto-wrap)

## ✅ Dags dato: 2025-06-14 — Opdatering af funktioner, database og struktur ##

🔧 Nye funktioner
Funktion	Beskrivelse
Anbefalingssider pr. quiz	Dynamisk side under /fantasy/anbefalinger/[quizKey] som viser resultater, grafer og anbefalinger.
ChatGPT-integration	Genererer anbefalinger baseret på jeres svar og baggrundsbeskrivelse.
Visualisering med Chart.js	Doughnut + Bar charts med svarfordeling og enighedsniveau.
Caching af anbefalinger	Anbefalinger gemmes i quiz_meta og genbruges ved reload.
Redigerbar baggrundstekst	Ny side under /settings/couple-background med textarea til personlig historik, som tages med i ChatGPT-prompt.
UI-forbedringer	Blødere visning, brug af Card, farvekoder, profilbilleder og tabs til visningstyper.

🗃️ Nye tabeller og kolonner i Supabase
Tabelnavn	Kolonner	Beskrivelse
quiz_meta	quiz_key, intro, published, background, recommendations	Indeholder quiz-info, baggrundstekst og genererede anbefalinger.
couple_background (tidligere foreslået separat, nu samlet i quiz_meta)	Se ovenfor	Gemmer parrets historie som én tekst.
quiz_questions	id, question, type, order, quiz_key	Spørgsmål pr. quiz. Bruges til vurdering af enighed.
quiz_responses	question_id, answer, user_id, quiz_key	Brugersvar som matcher op mod spørgsmål.
profiles (eksisterende)	id, display_name, avatar_url	Bruges til visning og statistik.
(ændring)	access_control	Ingen ændringer, men system udvidet med adgang til anbefalingssiden.

🗂️ Nye og opdaterede filer
Fil / Mappe	Beskrivelse
/app/fantasy/anbefalinger/[quizKey]/page.tsx	Hovedsiden for visning af quizresultater, grafer og anbefalinger.
/app/api/recommendations/route.ts	Serverless route med POST-request til OpenAI, genererer anbefalinger baseret på svar og baggrund.
/app/settings/couple-background/page.tsx	Ny settings-side til at skrive/redigere baggrundshistorie for parret.
/lib/openaiClient.ts	Wrapper med hardcoded API-nøgle (provisorisk, bør flyttes til .env.local).
/components/ui/textarea.tsx	Simpel Tailwind-baseret Textarea-komponent.
/components/ui/card.tsx	Bruges til at indkapsle visning af spørgsmål og anbefalinger.
/components/ui/button.tsx	Brugt til tab-visning og navigation.
/fantasy/anbefalinger/page.tsx	Oversigtsside med links til de forskellige quiz-anbefalinger.

🤖 Prompt og anbefalinger
Systemet genererer anbefalinger ud fra:

Enighedsniveau i svar (grøn, gul, rød)

Spørgsmålenes ordlyd

Baggrundshistorie skrevet i quiz_meta.background

Brugeren kan tilføje "må ikke nævnes"-ord (som f.eks. "utroskab") i baggrunden

Anbefalinger cache’s første gang og vises hurtigt næste gang

📈 Næste step
Mål	Status
Tildeling af XP ved gennemførsel af quiz	❌ Ikke implementeret endnu