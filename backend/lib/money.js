// Round to whole cents so totals are stable and accepted by payment providers.
export const roundMoney = (value) => Math.round((value + Number.EPSILON) * 100) / 100;
