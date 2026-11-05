export function readStoredData(key, isValid, storage) {
  try {
    const source = storage ?? window.localStorage;
    const rawValue = source.getItem(key);

    if (rawValue === null) return { status: 'missing' };

    const data = JSON.parse(rawValue);
    if (!isValid(data)) {
      return { status: 'error', message: 'Saved data has an unsupported structure. It has not been changed.' };
    }

    return { status: 'success', data };
  } catch {
    return { status: 'error', message: 'Saved data could not be read. It has not been changed.' };
  }
}

export function saveStoredData(key, data, storage) {
  try {
    const destination = storage ?? window.localStorage;
    const serialized = JSON.stringify(data);
    if (serialized === undefined) {
      return { status: 'error', message: 'This data cannot be saved.' };
    }
    destination.setItem(key, serialized);
    return { status: 'success' };
  } catch {
    return { status: 'error', message: 'Changes could not be saved in this browser.' };
  }
}
