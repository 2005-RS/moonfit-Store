function escapeCsvValue(value: unknown) {
  let normalizedValue = '';

  if (value === null || value === undefined) {
    normalizedValue = '';
  } else if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'bigint'
  ) {
    normalizedValue = String(value);
  } else {
    normalizedValue = JSON.stringify(value);
  }

  if (
    normalizedValue.includes(',') ||
    normalizedValue.includes('"') ||
    normalizedValue.includes('\n')
  ) {
    return `"${normalizedValue.replace(/"/g, '""')}"`;
  }

  return normalizedValue;
}

export function toCsv(
  headers: string[],
  rows: Array<Array<string | number | null | undefined>>,
) {
  const serializedRows = rows.map((row) =>
    row.map((value) => escapeCsvValue(value)).join(','),
  );

  return [headers.join(','), ...serializedRows].join('\n');
}
