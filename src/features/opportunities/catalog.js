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
    && typeof event.isDemo === 'boolean'
    && (
      event.isDemo
        ? event.lastVerifiedAt === null
        : isNonEmptyString(event.lastVerifiedAt) && !Number.isNaN(Date.parse(event.lastVerifiedAt))
    )
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

let catalogCache = null;

export function clearOpportunityCatalogCache() {
  catalogCache = null;
}

export async function loadOpportunityCatalog(fetcher = fetch) {
  // If running in browser with default fetch and already loaded, return cached catalog
  if (fetcher === fetch && catalogCache && catalogCache.length > 0) {
    return catalogCache;
  }

  let response;

  if (fetcher !== fetch) {
    // Custom test mock fetcher
    try {
      response = await fetcher('/events.json');
    } catch (err) {
      throw new Error('The opportunity catalog is unavailable.', { cause: err });
    }
  } else {
    // In-browser environment: attempt multiple valid path resolutions
    const urlsToTry = [
      '/events.json',
      'events.json',
      './events.json',
      ...(typeof window !== 'undefined' && window.location ? [`${window.location.origin}/events.json`] : []),
    ];

    let lastError = null;
    for (const url of urlsToTry) {
      try {
        const res = await fetcher(url);
        if (res && res.ok) {
          response = res;
          break;
        }
      } catch (err) {
        lastError = err;
      }
    }

    if (!response || !response.ok) {
      throw new Error('The opportunity catalog is unavailable.', { cause: lastError });
    }
  }

  if (!response.ok) {
    throw new Error('The opportunity catalog is unavailable.');
  }

  try {
    const catalog = await response.json();
    const validatedEvents = validateOpportunityCatalog(catalog);
    if (fetcher === fetch) {
      catalogCache = validatedEvents;
    }
    return validatedEvents;
  } catch (error) {
    if (error.message === 'The opportunity catalog has an unsupported structure.') {
      throw error;
    }

    throw new Error('The opportunity catalog could not be read.', { cause: error });
  }
}
