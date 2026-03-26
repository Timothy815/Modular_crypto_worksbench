export const MODULE_INSTANCE_ID_PATTERN = /^[A-Za-z0-9_-]+$/;

export function normalizeModuleInstanceIdCandidate(value: string) {
  return value.trim();
}

export function getModuleInstanceIdValidationError(
  value: string,
  existingIds: Iterable<string>,
  currentId?: string,
) {
  const candidate = normalizeModuleInstanceIdCandidate(value);
  if (!candidate) {
    return 'Module IDs cannot be empty.';
  }

  if (!MODULE_INSTANCE_ID_PATTERN.test(candidate)) {
    return 'Use only letters, numbers, hyphens, or underscores.';
  }

  if (candidate !== currentId && new Set(existingIds).has(candidate)) {
    return `Module ID "${candidate}" is already in use.`;
  }

  return null;
}
