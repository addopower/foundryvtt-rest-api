import { getDnd5eMovementAndInitiative } from '../src/ts/utils/dnd5eStats';

describe('prepared dnd5e movement and initiative', () => {
    test('v6 prepared values include movement effects and the final initiative bonus', () => {
        // Source formulas may be "30 + 10" and "@prof + 2"; prepared fields
        // already contain effects, proficiency, ability and condition changes.
        const system = {
            attributes: {
                movement: { speeds: { walk: 20, fly: 60 }, speed: 20, units: 'ft', bonus: '10', multiplier: 0.5 },
                init: { total: 9, mod: 3, prof: { flat: 4 }, roll: { bonus: '2 + 1d4' } },
            },
            abilities: { dex: { mod: 3 } },
        };
        Object.defineProperty(system.attributes.movement, 'walk', {
            get: () => { throw new Error('legacy shim should not be read'); },
        });
        expect(getDnd5eMovementAndInitiative(system)).toEqual({ speed: 20, speedUnits: 'ft', initBonus: 9 });
    });

    test('preserves zero final values over nonzero fallbacks', () => {
        expect(getDnd5eMovementAndInitiative({
            attributes: { movement: { speeds: { walk: 0 }, speed: 30, walk: 40, units: 'm' }, init: { total: 0, mod: 3 } },
            abilities: { dex: { mod: 4 } },
        })).toEqual({ speed: 0, speedUnits: 'm', initBonus: 0 });
    });

    test('supports legacy movement and numeric strings without changing units', () => {
        expect(getDnd5eMovementAndInitiative({
            attributes: { movement: { walk: ' 9.5 ', units: 'm' }, init: { total: '-2' } },
        })).toEqual({ speed: 9.5, speedUnits: 'm', initBonus: -2 });
    });

    test('uses the prepared speed when mapping contains an unprepared formula', () => {
        expect(getDnd5eMovementAndInitiative({
            attributes: { movement: { speeds: { walk: '30 + @prof' }, speed: 35 }, init: { total: null, mod: -1 } },
        })).toEqual({ speed: 35, speedUnits: '', initBonus: -1 });
    });

    test('fallback uses configured initiative ability rather than always dexterity', () => {
        expect(getDnd5eMovementAndInitiative({
            attributes: { init: { ability: 'int' } }, abilities: { dex: { mod: 1 }, int: { mod: 5 } },
        }).initBonus).toBe(5);
    });

    test.each([null, undefined, {}, { attributes: null }])('missing data has numeric defaults (%p)', system => {
        expect(getDnd5eMovementAndInitiative(system)).toEqual({ speed: 0, speedUnits: '', initBonus: 0 });
    });

    test.each(['30 + 10', '1d6', '30ft', '@abilities.dex.mod', '', ' ', NaN, Infinity, { value: 30 }, true])(
        'does not roll or guess an unprepared value (%p)', value => {
            expect(getDnd5eMovementAndInitiative({
                attributes: { movement: { speeds: { walk: value } }, init: { total: value } },
            })).toEqual({ speed: 0, speedUnits: '', initBonus: 0 });
        },
    );
});
