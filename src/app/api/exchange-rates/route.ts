import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET /api/exchange-rates — List all exchange rate settings
export async function GET() {
  try {
    const rates = await db.exchangeRateSetting.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(rates);
  } catch (error) {
    console.error('[EXCHANGE_RATES_LIST]', error);
    return NextResponse.json(
      { error: 'Failed to fetch exchange rates' },
      { status: 500 }
    );
  }
}

// PUT /api/exchange-rates — Update an exchange rate setting
// Accepts { id, rate, source? } to update a specific rate,
// or { fromCurrency, toCurrency, rate, source? } to find and update
export async function PUT(request: Request) {
  try {
    const body = await request.json();

    const { id, fromCurrency, toCurrency, rate, source } = body;

    if (rate === undefined || rate === null) {
      return NextResponse.json(
        { error: 'rate is required' },
        { status: 400 }
      );
    }

    let existing;

    if (id) {
      // Update by specific ID
      existing = await db.exchangeRateSetting.findUnique({ where: { id } });
    } else if (fromCurrency && toCurrency) {
      // Find by currency pair
      existing = await db.exchangeRateSetting.findFirst({
        where: { fromCurrency, toCurrency },
      });
    }

    if (!existing) {
      // If no existing rate found and we have currency info, create one
      if (fromCurrency && toCurrency) {
        const newRate = await db.exchangeRateSetting.create({
          data: {
            fromCurrency,
            toCurrency,
            rate,
            source: source ?? 'manual',
            lastUpdated: new Date(),
          },
        });
        return NextResponse.json(newRate, { status: 201 });
      }

      return NextResponse.json(
        { error: 'Exchange rate setting not found. Provide id or fromCurrency/toCurrency pair.' },
        { status: 404 }
      );
    }

    // Update existing rate
    const updateData: Record<string, unknown> = {
      rate,
      lastUpdated: new Date(),
    };
    if (source !== undefined) updateData.source = source;

    const updated = await db.exchangeRateSetting.update({
      where: { id: existing.id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[EXCHANGE_RATES_UPDATE]', error);
    return NextResponse.json(
      { error: 'Failed to update exchange rate' },
      { status: 500 }
    );
  }
}
