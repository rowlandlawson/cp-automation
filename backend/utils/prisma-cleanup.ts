import { deleteMediaAssetIfUnused } from "./prisma-media";

export async function cleanupReplacedMediaAsset(
  previousAssetId: number | null | undefined,
  nextAssetId: number | null | undefined,
): Promise<void> {
  if (!previousAssetId || previousAssetId === nextAssetId) {
    return;
  }

  await deleteMediaAssetIfUnused(previousAssetId);
}
