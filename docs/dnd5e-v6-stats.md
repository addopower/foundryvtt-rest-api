# dnd5e 6 actor stats compatibility

The fork targets Foundry 14 / dnd5e 6.0.6, while retaining legacy numeric stats.

Sources inspected at upstream tag `release-6.0.6`:

- [MovementField](https://github.com/foundryvtt/dnd5e/blob/release-6.0.6/module/data/shared/movement-field.mjs): source `speeds` values are deterministic FormulaFields; legacy `walk` is a getter for `speeds.walk`.
- [AttributesFields](https://github.com/foundryvtt/dnd5e/blob/release-6.0.6/module/data/actor/templates/attributes.mjs): `prepareMovement` evaluates source formulas and applies conditions, bonuses and multipliers, then stores the final numeric walking speed in both `speeds.walk` and `speed`. `prepareInitiative` still stores the numeric final bonus in `init.total`, including ability, applicable proficiency, numeric bonuses and condition reductions.

The bridge reads prepared values. Walking speed prefers `speeds.walk`, then `speed`, then legacy `walk`; initiative prefers `init.total`, then `init.mod`, then the configured ability modifier (Dexterity when unspecified). The latter fallbacks support partial/legacy data and cannot reconstruct absent final bonuses.

`stats.speedUnits` preserves the system unit key (`ft`, `m`, etc.). Missing units produce an empty string rather than assigning an incorrect unit. Zero values are authoritative. Finite numbers and complete decimal numeric strings are accepted; formulas, dice expressions, partial numeric strings, nonfinite values and objects are never evaluated or guessed. Prepared initiative is not rerolled: random bonuses remain part of the actual initiative roll, not a fixed displayed bonus.

Regression fixtures cover prepared v6 and legacy data, canonical precedence, metric units, zeros, final modifiers, partial/null data, malformed values and the `get-actor-details` route. These use synthetic actor objects and do not validate a running Foundry server or real campaign data.

Build with `CI=true` to prevent the development Vite configuration from copying outputs to a Foundry module directory. Install with the existing pnpm lockfile and `--frozen-lockfile`; no dependency upgrades are required.

Validation on 2026-10-26 (Node 20.20.1, pnpm 12.15.0):

- `corepack pnpm install --frozen-lockfile --ignore-scripts`: passed; package manifest and lockfile unchanged. The initial `npm ci` attempt could not run because this repository uses a pnpm lockfile.
- `corepack pnpm test -- --runInBand tests/dnd5eStats.test.ts tests/dnd5eStatsRoute.test.ts`: 2 suites / 20 tests passed.
- `CI=true MODULE_VERSION=3.4.1-addopower.1 GH_PROJECT=addopower/foundryvtt-rest-api GH_TAG=3.4.1-addopower.1 corepack pnpm build`: TypeScript and Vite build passed. Generated manifest uses fork release URLs; source versions were left unchanged.
- `corepack pnpm exec jest --runInBand`: 4 suites passed / 51 tests passed; existing `webSocketRoutes.test.ts` fails before tests because `Hooks` is undefined during router imports. Reproduced the identical failure on an isolated clean archive of baseline HEAD with the same dependencies. That unrelated fixture remains unchanged.
- `git diff --check`: passed. No runtime installation, real API access, commit or push was performed by this implementation task.

## Changelog and real integration

The official [6.0.0 release notes](https://github.com/foundryvtt/dnd5e/releases/tag/release-6.0.0)
document Foundry14 support, custom movement types, armor speed reduction and the new
movement multiplier. The exact prepared paths were then checked against the installed
6.0.6 sourcemap and the tagged source linked above; the changelog alone is not a schema.

Root integration verified the fork on Foundry14.369/dnd5e6.0.6 through public HTTPS.
A temporary synthetic Fighter matched native prepared values for all six abilities,
saves, eighteen skills, HP, AC and proficiency, plus walking speed/unit and initiative:
30ft/+2 ordinarily,45ft/+6 with deterministic bonuses,0ft/+6 while grappled,
9m/+0 after changing units and bonuses. Preexisting world documents were unchanged.
The external read-only player sheet in the relay fork renders these values without
loading the Foundry canvas. Code and real evidence received independent review.

The original API also returned30/+3 for the existing PC through legacy shims.
It is incorrect to claim that init.total was renamed or that all original initiative
reads failed. The discarded first sheet explicitly projected null; restoring its
fields is part of the companion change, while this module improves canonical movement
access, units and numeric validation.
