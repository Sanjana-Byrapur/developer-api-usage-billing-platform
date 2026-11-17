// Allowance is shared across all APIs of a subscription in a UTC calendar month.
// Daily groups are consumed in date/API-id order, providing deterministic allocation.
function allocateAllowance(groups, allowance) {
  if (!Number.isSafeInteger(allowance) || allowance < 0) throw new Error('Invalid allowance');
  let remaining = allowance;
  return [...groups].sort((a, b) => a.day.localeCompare(b.day) || a.api_id - b.api_id).map(group => {
    if (!Number.isSafeInteger(group.request_count) || group.request_count < 0) throw new Error('Invalid request count');
    const included = Math.min(remaining, group.request_count);
    remaining -= included;
    return { ...group, billable_requests: group.request_count - included };
  });
}
function monthBounds(month) {
  if (typeof month !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw Object.assign(new Error('Month must be YYYY-MM'), {status:400});
  const start = new Date(`${month}-01T00:00:00.000Z`);
  const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth()+1, 1));
  return {start, end, from: start.toISOString().slice(0,10), to: new Date(end-1).toISOString().slice(0,10)};
}
module.exports = {allocateAllowance, monthBounds};
