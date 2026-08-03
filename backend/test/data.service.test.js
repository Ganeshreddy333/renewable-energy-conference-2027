const { DataService } = require('../src/data/data.service');

describe('DataService raw-query behavior', () => {
  it('stores and returns registration intents through the database adapter', async () => {
    const record = { id: 'registration-1', email: 'test@example.com' };
    const prisma = {
      $executeRawUnsafe: jest.fn().mockResolvedValue(undefined),
      $queryRawUnsafe: jest.fn().mockResolvedValue([record]),
    };
    const service = new DataService(prisma, undefined);

    const created = await service.insert('registration_intents', {
      full_name: 'Test User',
      email: 'test@example.com',
      phone: '123',
      affiliation: 'Org',
      country: 'India',
      designation: 'Speaker',
      plan_key: 'early-speaker',
      plan_name: 'Early Speaker',
      amount_usd: 100,
      currency: 'USD',
      payment_provider: 'stripe',
      payment_status: 'pending',
      status: 'pending',
      notes: 'test',
    });

    expect(created).toEqual(record);

    const rows = await service.list('registration_intents', { email: 'test@example.com' });
    expect(rows).toEqual([record]);
    expect(prisma.$executeRawUnsafe).toHaveBeenCalledTimes(1);
  });
});
