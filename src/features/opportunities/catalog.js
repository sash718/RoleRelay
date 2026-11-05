const supportedModes = new Set(['online', 'offline', 'hybrid']);

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isNullableString(value) {
  return value === null || typeof value === 'string';
}

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

function isNullableDate(value) {
  return value === null || (isNonEmptyString(value) && !Number.isNaN(Date.parse(value)));
}

function isValidEvent(event) {
  return (
    event !== null
    && typeof event === 'object'
    && isNonEmptyString(event.id)
    && isNonEmptyString(event.title)
    && isNonEmptyString(event.organizer)
    && isNonEmptyString(event.category)
    && supportedModes.has(event.mode)
    && isNullableString(event.location)
    && isNullableDate(event.startsAt)
    && isNullableDate(event.registrationDeadline)
    && isNonEmptyString(event.description)
    && isHttpUrl(event.sourceUrl)
    && (event.registrationUrl === null || isHttpUrl(event.registrationUrl))
    && isNonEmptyString(event.lastVerifiedAt)
    && !Number.isNaN(Date.parse(event.lastVerifiedAt))
  );
}

export function validateOpportunityCatalog(catalog) {
  if (
    catalog === null
    || typeof catalog !== 'object'
    || catalog.catalogVersion !== 1
    || !isNonEmptyString(catalog.lastCheckedAt)
    || Number.isNaN(Date.parse(catalog.lastCheckedAt))
    || !Array.isArray(catalog.events)
    || !catalog.events.every(isValidEvent)
  ) {
    throw new Error('The opportunity catalog has an unsupported structure.');
  }

  return catalog.events;
}

export async function loadOpportunityCatalog(fetcher = fetch) {
  let response;

  try {
    response = await fetcher('/events.json');
  } catch {
    throw new Error('The opportunity catalog is unavailable.');
  }

  if (!response.ok) {
    throw new Error('The opportunity catalog is unavailable.');
  }

  try {
    const catalog = await response.json();
    return validateOpportunityCatalog(catalog);
  } catch (error) {
    if (error.message === 'The opportunity catalog has an unsupported structure.') {
      throw error;
    }

    throw new Error('The opportunity catalog could not be read.', { cause: error });
  }
}
