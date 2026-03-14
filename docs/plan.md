# Game Spec

**Category:** Spec · **Tags:** #mvp #requirements #technical

Game rules, systems, and technical contracts for Crimson Lane (mobile browser MOBA).

**Related docs:**
[heroes/index.md](heroes/index.md) (hero content) ·
[theme.md](theme.md) (visual/audio theme) ·
[menu.md](menu.md) (menu flow) ·
[index.md](index.md) (SDLC hub & progress)

---

## 1. Scope

**Platform:** Browser only, mobile-first, desktop supported.
**Stack:** HTML · CSS · JavaScript · Three.js.
**Mode:** Solo vs AI. Multiplayer (PeerJS/WebRTC) planned later.

### MVP content

- 1 map (100x100, 3 lanes, river, jungle, bases)
- 5 heroes: Lich, Sniper, Dragon Knight, Shadow Fiend, Windrunner
- 13 items (6 basic, 6 upgrade, TP Scroll)
- Configurable team size (1v1, 3v3, 5v5) with bot fill
- Hero select, main menu, match end flow

### Not in MVP

Multiplayer, matchmaking, login, ranked, draft/ban, replay, tree destruction.

### Performance targets

- 60 FPS desktop, 30+ FPS mid-range mobile.
- Mobile-friendly rendering budgets; avoid per-frame allocations; use instancing.

---

## 2. Match Rules

- **Objective:** Destroy the enemy Ancient.
- **Teams:** Designed for 5v5; solo allows 1v1, 3v3, 5v5 (bots fill).
- **Target duration:** 10–20 minutes.

---

## 3. Map

- 100x100 world units.
- 3 lanes (top, mid, bot) with explicit waypoint paths.
- River crossing mid area.
- Jungle on both sides with camp clearings.
- Bases at opposite corners (Scourge bottom-left, Sentinel top-right).
- Trees are static visual blockers (no destruction in MVP).

---

## 4. Camera & Minimap

### Camera

- Isometric / angled top-down.
- Auto-follow hero; drag/pan to inspect; recenter on idle timeout.
- Limited zoom, no free rotation.

### Minimap

- 2D canvas, always visible.
- Show: allied/enemy heroes, creeps, towers, barracks, ancient, jungle camps, player position.
- Click/tap to pan camera.
- Planned: fog of war overlay, entity dots (see Requirements Plan in [index.md](index.md)).

---

## 5. Stats & Progression

### Core attributes

- Strength → HP, HP regen
- Agility → armor, attack speed
- Intelligence → mana, mana regen

### Derived stats

HP, HP regen, mana, mana regen, attack damage, attack speed, armor, magic resist, move speed, attack range.

### Formulas

```text
HP = baseHP + strength * hpPerStrength + levelGrowthHP
Mana = baseMana + intelligence * manaPerIntelligence + levelGrowthMana
PhysicalDamageTaken = damage * 100 / (100 + armor * 6)
AttackInterval = baseAttackTime / attackSpeedMultiplier
MoveSpeedClamp = min 100 / max 550
RespawnTime = 5 + level * 2
```

### Progression

- XP from nearby kills → level up → unlock/improve abilities.
- Gold from last hits, kills, objectives → buy items.

---

## 6. Ability System

Each hero has Q, W, E, R. System supports: target skills, area skills, skillshots, passives, cooldowns, mana cost, cast time, projectiles, status effects, level scaling.

### Skill cast range taxonomy

Every skill must have a clear range definition. Categories:

| Range type | Description | Example | `castRange` value |
|------------|-------------|---------|-------------------|
| **global** | No range limit; affects all valid targets (e.g. all enemy heroes) | Zeus R — Thundergod's Wrath | `Infinity` or `'global'` |
| **self** | No target; effect centered on caster | Windrun, God's Strength | `0` |
| **self-radius** | No target; AoE around caster | Ravage, Echo Slam | `0` + `effectRadius` |
| **melee** | Unit-target, melee range (~150 units) | Dragon Tail, Dismember | `150` |
| **short** | Point/unit target, ~400–600 units | Frost Nova, Crystal Nova | `400`–`600` |
| **medium** | Point/unit target, ~700–1000 units | Chain Frost, Laguna Blade | `700`–`1000` |
| **long** | Point/unit target, ~1200–1700 units | Powershot, Meat Hook | `1200`–`1700` |
| **very-long** | Unit target, 2000+ units | Assassinate | `2000`/`2500`/`3000` by level |
| **passive** | No cast; always-on or proc-based | Headshot, Dragon Blood | N/A |
| **toggle** | No cast range; orb/buff | Frost Arrows, Rot | N/A |

Special cases (Dota 1 liberties):

- **Zeus R** — Global; damages all enemy heroes. No range check.
- **Shadow Fiend Q** — Three fixed-range razes (200/450/700); no target selection.
- **Shadow Fiend R** — Self-centered AoE (~1000 radius); no cast range.

Hero modules should define `castRangeByLevel` (or `castRange` for fixed) for targetable skills. See [heroes/index.md](heroes/index.md) for per-hero skill specs.

### Status effects (MVP)

Stun, slow, silence, knockback.

### Ability data shape

```js
{
  id: 'frostNova', slot: 'Q',
  castType: 'area-target',
  targetRule: 'enemy-unit-or-ground',
  damageType: 'magical',
  manaCostByLevel: [120,130,145,160],
  cooldownByLevel: [7,6,5,4],
  castRangeByLevel: [600,600,600,600],
  effectValuesByLevel: {
    damage: [75,150,225,300],
    slowPct: [20,30,40,50],
    slowDuration: [4,4,4,4]
  },
  aiHints: { useWhenEnemiesInRadiusAtLeast: 1, minManaPct: 0.2 }
}
```

### Cast pipeline

1. Input → 2. Target validation → 3. Cast start → 4. Animation/wind-up → 5. Mana spend → 6. Cooldown start → 7. Projectile/effect → 8. Hit resolution → 9. Damage/status → 10. VFX/audio.

### Required ability categories (across 5-hero roster)

Single target nuke, projectile skillshot, line ability, area burst, buff, passive aura, transformation, channel, movement/evasion.

---

## 7. Combat

### Damage types

Physical, magical, pure.

### Combat loop

Acquire target → move into range → attack/cast → apply mitigation → apply damage → apply status → check death → handle gold/XP reward → handle respawn.

### Attack rules

- Melee and ranged attacks supported.
- Projectile travel for ranged basic attacks.
- Attack wind-up and recovery timing.

### Combat events

The combat system should emit structured events (damageApplied, unitDied, goldGranted, xpGranted, projectileSpawned, etc.) so UI, VFX, and future networking don't depend on side effects.

---

## 8. Lanes, Creeps & Neutrals

### Lane creeps

- Spawn every 30s per lane.
- Wave: 3 melee + 1 ranged.
- Follow lane waypoints → attack enemies in range → resume march.
- Priority: enemy creeps → heroes (if attacked) → towers → barracks → ancient.

### Lane pathing

Each lane defines: spawn point, ordered path nodes, tower/barracks/ancient checkpoints.

### Last hit & deny

- Last hit: gold to hitter, XP to nearby allies.
- Deny (allied creep < 50% HP): no enemy gold, reduced enemy XP.
- Neutral last hit: gold to killer, XP to nearby allies.

### Neutral camps

- 6 camps (tiered difficulty).
- Each camp: center position, spawn radius, unit composition, leash radius, respawn timer (60s), tier.
- Grants gold and XP on kill.

---

## 9. Structures

### Towers

- Tier 1, 2, 3 per lane + tier 4 base towers (18 total).
- Auto-attack enemies in range; prioritize creeps; switch to hero that attacks allied hero under tower.

### Barracks

- Per-lane (6 total).
- Destroying barracks → that lane's creeps upgrade to mega-creeps (doubled stats, larger size).

### Ancient

- Final objective in each base.
- Match ends when destroyed.

---

## 10. Economy & Respawn

### Gold sources

Creep last hits, neutral kills, hero kills, tower/objective rewards, passive trickle.

### XP sources

Nearby creep deaths, hero kills, neutral kills.

### Death & respawn

- Death animation → respawn timer (5 + level * 2 seconds) → respawn at base.
- Kill reward gold to killer.

### Teleport Scroll

- Purchasable consumable.
- Channel time → teleport to base.
- Spec target: allied structures (currently base only — see Requirements Plan).
- Should be interrupted by stun/death (planned).
- Cooldown to prevent spam.

---

## 11. Items

### Inventory

6 slots. 13 items in MVP.

### Item table

**Components:** Boots of Speed, Iron Branch, Blades of Attack, Ring of Protection, Magic Charm, Vitality Gem.

**Upgrades:** Power Boots, Arcane Boots, Blink Dagger, Lifesteal Blade, Aura Shield, Void Staff.

**Consumable:** TP Scroll.

Coverage: movement, mana, survivability, damage, mobility active, offensive active.

### Item data shape

```js
{
  id: 'powerBoots', name: 'Power Boots', cost: 1400,
  components: ['bootsOfSpeed', 'vitalityGem'],
  bonuses: { moveSpeed: 45, attackSpeed: 20 },
  activeAbilityId: null, passiveId: 'bootsPassive',
  shopCategory: 'movement'
}
```

### Shop definition (mobile landscape + desktop parity)

The shop is treated as a gameplay system, not only a UI panel. It must have deterministic behavior so player and bot purchasing stay consistent.

#### Entry points

- **Mobile:** Tap shop button above/right of inventory stack.
- **Desktop:** Press `B` or click the same HUD shop button.
- **State:** `closed -> browsing -> confirm-buy -> closed` (or back to browsing).

#### Panel layout contract

- **Header:** current gold, close button, optional search/filter.
- **Category rail (left):** Consumable, Attributes, Defense, Mobility, Magic, Upgrades.
- **Item list (center):** item cards with icon, name, cost, and compose/recipe marker.
- **Detail pane (right):** stats/active/passive text, components tree, `Buy` action.
- **Quick-buy strip (bottom):** queued target items (for future automation parity with bots).

#### Buy rules

1. Player selects an item card.
2. System validates: enough gold, inventory room/stacking, recipe/component constraints.
3. On success:
   - deduct gold atomically,
   - grant item into inventory or merge components,
   - emit purchase event for announcer/audio/UI hooks.
4. On failure:
   - no state mutation,
   - show explicit reason (`insufficient_gold`, `inventory_full`, `requirements_missing`).

#### Input and feedback

- Single tap selects item (detail view).
- Second tap on `Buy` confirms purchase (no long press required).
- Disabled `Buy` button uses low-opacity + reason text.
- Successful buy flashes inventory slot and plays buy SFX.

#### Simulation contract

Shop APIs should be command-based and shared by human + AI:

```text
openShopCommand
closeShopCommand
buyItemCommand(itemId)
sellItemCommand(slotIndex)   // optional post-MVP
```

Events emitted from simulation:

```text
shopOpened, shopClosed, itemPurchased, itemPurchaseFailed
```

---

## 12. Controls

### Mobile

- Left: virtual joystick (movement).
- Right: attack, Q/W/E/R, item actives, shop access, TP.

### Mobile landscape layout contract (thumb zones)

Use landscape-first HUD zones to prevent hand overlap and accidental taps:

- **Left movement zone:** `0vw-46vw`, bottom-weighted; reserved for joystick ownership.
- **Center view zone:** `30vw-70vw`; lowest HUD density to preserve battlefield visibility.
- **Right action zone:** `54vw-100vw`; skills, attack, item actives, shop trigger.
- **Bottom safe band:** keep core buttons above device gesture/home indicator area.

Minimum touch targets:

- Primary attack: `72-88px` diameter.
- Skills/items: `56-72px` diameter.
- Spacing between action buttons: `>= 10px`.

### Primary attack + skill cluster definition (mobile)

- **Primary attack** is the anchor button on lower-right and must be the largest action control.
- **Skill cluster** is arranged around attack in a reachable arc/diamond:
  - `Q` nearest and fastest to reach,
  - `W`/`E` lateral positions,
  - `R` upper position with distinct ultimate styling.
- Passive skills remain non-interactive (`disabled` visual state).
- Toggle skills persist ON/OFF state with clear active glow.
- Attack button state mirrors combat availability:
  - **Active:** full opacity + pulse/glow.
  - **Out of range/no target:** dimmed + non-interactive.

### Skill casting (planned)

- Tap: quick cast.
- Drag: directional/area aim → release to cast.
- Double-tap: auto-target nearest valid target.

### Virtual joystick definition

Joystick behavior must produce deterministic movement vectors and clean multi-touch ownership.

#### Geometry

- Base radius: `~50-60px`.
- Knob radius: `~22-30px`.
- Max knob displacement equals base radius.
- Dead zone: `~18%` of base radius (ignore micro jitter).

#### Input ownership

- First touch inside left movement zone claims joystick control.
- Claimed touch ID remains bound until `touchend`/`touchcancel`.
- Additional touches cannot steal joystick while claimed.

#### Output mapping

1. Convert knob offset to normalized vector `(-1..1, -1..1)`.
2. Apply dead zone + optional light smoothing.
3. Send `moveCommand` continuously while claimed.
4. On release, send zero vector and visually recenter immediately.

#### Edge behavior

- If touch starts in movement zone but outside current base, joystick can re-anchor to touch start (mobile comfort mode).
- Clamp final movement vector magnitude to `1.0`.
- Prevent joystick events from triggering skill/attack buttons (strict zone separation).

### Desktop

Mouse movement/targeting, keyboard hotkeys (Q/W/E/R, Space stop, B shop, arrows, scroll zoom).

### Input abstraction

All controls map to shared commands: moveCommand, attackCommand, castAbilityCommand, useItemCommand, cameraPanCommand — so mobile, desktop, and future multiplayer share the same simulation path.

---

## 13. AI

### Hero bot states (FSM)

Idle, Move, Attack, Retreat, Cast, Farm, Push, Defend, Buy.

### Priorities

Lane assignment at match start, farm/last hit, deny, retreat on low HP, cast with heuristics, avoid tower dives, buy items via build path, return to lane/jungle after respawn.

### Bot profiles (per hero)

Skill leveling order, item build order, lane preference, retreat threshold, mana threshold, engage conditions.

### Creep AI

Deterministic, lane-following, combat interruption.

### Difficulty

One stable profile in MVP. Planned: Easy / Normal / Hard presets (tune timing and aggression, not separate logic trees).

---

## 14. Architecture

### Separation

Rendering · simulation · input · UI · AI · content data — kept modular.

### Data-driven

Hero defs, skill defs, item defs, creep stats, tower stats, bot params — all in structured config.

### Multiplayer-ready boundaries

Input commands, entity state snapshots, simulation tick, player controller abstraction — clean boundaries exist for future networking. No real multiplayer in MVP.

### System contracts

- Render reads world state, doesn't own gameplay.
- Simulation tick updates all gameplay.
- Input creates commands (not direct mutation).
- AI produces commands like player input.
- UI reads state, dispatches commands.
