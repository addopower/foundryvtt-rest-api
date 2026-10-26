/** Accept complete numeric values, never a partial formula or an object shim. */
function finiteNumber(value: unknown): number | undefined {
    if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
    if (typeof value !== "string" || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(value.trim())) return undefined;
    const number = Number(value);
    return Number.isFinite(number) ? number : undefined;
}

/**
 * Read prepared actor data without evaluating rolls or reapplying modifiers.
 * dnd5e 6.0.6 prepares speeds.walk (and speed) as final numbers, despite the
 * source schema using FormulaField. init.total still includes numeric bonuses,
 * proficiency, the chosen ability and condition reductions in that version.
 */
export function getDnd5eMovementAndInitiative(system: any): {
    speed: number;
    speedUnits: string;
    initBonus: number;
} {
    const attributes = system?.attributes;
    const movement = attributes?.movement;
    const init = attributes?.init;
    const ability = init?.ability || "dex";

    return {
        speed: finiteNumber(movement?.speeds?.walk)
            ?? finiteNumber(movement?.speed)
            ?? finiteNumber(movement?.walk)
            ?? 0,
        // Preserve the system unit key; do not silently label metric values ft.
        speedUnits: typeof movement?.units === "string" ? movement.units : "",
        initBonus: finiteNumber(init?.total)
            ?? finiteNumber(init?.mod)
            ?? finiteNumber(system?.abilities?.[ability]?.mod)
            ?? 0,
    };
}
