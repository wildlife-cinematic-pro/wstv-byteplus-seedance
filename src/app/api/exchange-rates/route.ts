import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { privateJson, requireAuthenticatedUser, requireProtectedMutation } from '@/lib/auth/guards';
import { exchangeRatePutSchema } from '@/lib/tracker-validation';
import { firstZodErrorMessage } from '@/lib/budget-validation';

// GET /api/exchange-rates — List all exchange rate settings
export async function GET(request: NextRequest) {
  const guard = await requireAuthenticatedUser(request);
  if ('response' in guard) return guard.response;
  try {
    const rates = await db.exchangeRateSetting.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return privateJson(rates);
  } catch (error) {
    console.error('[EXCHANGE_RATES_LIST]', error);
    return privateJson(
      { error: 'Failed to fetch exchange rates' },
      { status: 500 }
    );
  }
}

// PUT /api/exchange-rates — Update an exchange rate setting
// Accepts { id, rate, source? } to update a specific rate,
// or { fromCurrency, toCurrency, rate, source? } to find and update
export async function PUT(request: NextRequest) {
  const guard = await requireProtectedMutation(request);
  if ('response' in guard) return guard.response;
  const parsed = exchangeRatePutSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return privateJson({ error: firstZodErrorMessage(parsed.error) }, { status: 400 });
  }

  try {
    const { id, fromCurrency, toCurrency, rate, source } = parsed.data;

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
        return privateJson(newRate, { status: 201 });
      }

      return privateJson(
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

    return privateJson(updated);
  } catch (error) {
    console.error('[EXCHANGE_RATES_UPDATE]', error);
    return privateJson(
      { error: 'Failed to update exchange rate' },
      { status: 500 }
    );
  }
}
