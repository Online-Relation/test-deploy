
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

### Table: `fantasies`
| Navn          | Type    | Beskrivelse                         |
|---------------|---------|-------------------------------------|
| id            | uuid    | Unik ID                             |
| title         | text    | Titel                               |
| description   | text    | HTML-beskrivelse                    |
| status        | text    | idea/planned/fulfilled              |
| effort        | text    | low / medium / high                 |
| category      | text    | Valgfri kategori                    |
| image_url     | text    | Valgfrit billede                    |
| user_id       | uuid    | Reference til bruger                |
| xp_granted    | boolean | Har brugeren allerede fået XP?     |
| fulfilled_date| date    | Dato for opfyldelse                 |

### Table: `xp_log`
| Navn        | Type     | Beskrivelse                   |
|-------------|----------|-------------------------------|
| id          | int8     | Primærnøgle                   |
| user_id     | uuid     | Reference til bruger          |
| role        | text     | mads eller stine              |
| action      | text     | add_fantasy, plan_fantasy ... |
| effort      | text     | low / medium / high / null    |
| xp          | int4     | Antal XP                      |
| description | text     | Beskrivelse                   |
| created_at  | timestamptz | Timestamp                   |

### Table: `xp_settings`
| Navn   | Type   | Beskrivelse                                |
|--------|--------|---------------------------------------------|
| id     | int4   | Primærnøgle                                 |
| role   | text   | mads eller stine                            |
| action | text   | add_fantasy, plan_fantasy, complete_fantasy|
| effort | text   | low / medium / high / null                 |
| xp     | int4   | XP der gives                                |

### Table: `profiles`
| Navn         | Type | Beskrivelse               |
|--------------|------|---------------------------|
| id           | uuid | ID fra Supabase auth      |
| role         | text | mads eller stine          |
| display_name | text | Visningsnavn              |

### Table: `access_control`
| Navn     | Type | Beskrivelse                       |
|----------|------|------------------------------------|
| user_id  | uuid | Reference til bruger               |
| menu_key | text | fx: fantasy, dashboard, rewards... |
| allowed  | bool | true/false adgang                 |

Database Struktur

1. fantasies

Gemmer fantasier oprettet af Mads eller Stine.

id (uuid)

title, description, image_url, category

effort: low, medium, high

status: idea, planned, fulfilled

xp_granted: boolean (for fulfilled XP)

fulfilled_date: ISO dato

user_id: reference til profil

2. xp_settings

Definerer hvor mange XP der gives ved forskellige handlinger.

id

role: mads / stine

action: fx add_fantasy, plan_fantasy, complete_fantasy

effort: low, medium, high eller '' (for actions uden effort)

xp: integer antal XP der gives

3. xp_log

Gemmer hver gang en XP-hændelse sker.

id

user_id: reference til profil

change: XP antal

description: forklaring, fx "stine – plan_fantasy"

role: mads / stine

created_at: timestamp

4. profiles

Brugerprofiler.

id

email

role: mads / stine / admin

5. access_control

Bruger-specifik adgangsstyring til menupunkter.

user_id

menu_key: fx "fantasy", "todo", "settings"

allowed: boolean

6. rewards

Definerer mulige belønninger.

id

title, description

xp_cost: hvor meget det koster

assigned_to: mads/stine

redeemed: boolean

redeemed_at: timestamp

7. reward_log

Logger hver gang en belønning er indløst.

id

reward_id

user_id

timestamp

8. fantasy_categories

Kategorier brugt til fantasier.

id, name

9. tasks

Bruges til personlig to-do-liste.

id, user_id, title, completed

10. bucketlist

Gemmer individuelle ønsker og livsprojekter.

id, user_id, title, completed

11. xp

Oversigtstabel over akkumuleret XP per bruger (redundant i ny version med log).
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

