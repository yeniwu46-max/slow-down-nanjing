export function buildScanUrl(spotId: string, returnPath = "/badges") {
  const params = new URLSearchParams({
    spot: spotId,
    return: returnPath,
  });
  return `/scan?${params.toString()}`;
}
