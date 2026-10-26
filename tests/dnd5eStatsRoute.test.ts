jest.mock('../src/ts/utils/logger', () => ({ ModuleLogger: { info: jest.fn(), error: jest.fn() } }));
jest.mock('../src/ts/utils/permissions', () => ({
    resolveRequestUser: jest.fn(() => ({ user: null, shouldReturn: false })),
    serializeWithPermission: jest.fn(),
    assertWritePermission: jest.fn(),
}));

test('get-actor-details serializes prepared v6 walking speed, units and initiative', async () => {
    const callbacks: (() => void)[] = [];
    (global as any).Hooks = { once: (_event: string, callback: () => void) => callbacks.push(callback) };
    (global as any).game = { system: { id: 'dnd5e', version: '6.0.6' } };
    (global as any).fromUuid = jest.fn().mockResolvedValue({
        name: 'Synthetic Actor', uuid: 'Actor.synthetic', img: 'synthetic.png', items: [],
        system: {
            attributes: {
                movement: { speeds: { walk: 9 }, speed: 9, units: 'm' },
                init: { total: 8, mod: 2, roll: { bonus: '1d4 + 3' } },
                hp: { value: 10, max: 12 }, ac: { value: 14 },
            },
            abilities: { dex: { mod: 2 } },
        },
    });
    const { router } = await import('../src/ts/network/routers/dnd5e');
    callbacks.forEach(callback => callback());
    const send = jest.fn();
    const route = router.routes.find(route => route.actionType === 'get-actor-details');
    expect(route).toBeDefined();
    await route!.handler({ actorUuid: 'Actor.synthetic', details: ['stats'], requestId: 'synthetic' }, {
        socketManager: { send } as any,
    });
    expect(send).toHaveBeenCalledWith(expect.objectContaining({
        type: 'get-actor-details-result', requestId: 'synthetic',
        data: expect.objectContaining({ stats: expect.objectContaining({ speed: 9, speedUnits: 'm', initBonus: 8 }) }),
    }));
});
