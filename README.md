
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

🔜 Næste skridt
Vi skal arbejde videre på siden
📍 http://localhost:3000/settings/categories

Målet er at:

Tilføje en formular, hvor man kan oprette gave-kategorier og typer direkte fra frontend

Gemme dem i databasen (fx i fantasy_categories og fantasy_types)

Vise og administrere dem med samme UI-struktur som fantasikategorier