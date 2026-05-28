import type { ScanResult } from "./contracts";

export const STORAGE_SCAN_RESULT_KEY = "judolDetector:lastScanResult";
export const SCAN_RESULT_MESSAGE = "JUDOL_DETECTOR_SCAN_RESULT";
export const STORAGE_BLUR_KEY = "judolDetector:blurEnabled";
export const RESCAN_REQUEST_MESSAGE = "JUDOL_DETECTOR_RESCAN";

export interface ScanResultMessage {
  type: typeof SCAN_RESULT_MESSAGE;
  result: ScanResult;
}

export type RuntimeMessage = ScanResultMessage;

export function createScanResultMessage(result: ScanResult): ScanResultMessage {
  return {
    type: SCAN_RESULT_MESSAGE,
    result
  };
}

export async function saveScanResult(result: ScanResult): Promise<void> {
  if (typeof chrome === "undefined" || chrome.storage?.local === undefined) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    chrome.storage.local.set({ [STORAGE_SCAN_RESULT_KEY]: result }, () => {
      const lastError = chrome.runtime.lastError;
      if (lastError) {
        reject(new Error(lastError.message));
        return;
      }

      resolve();
    });
  });
}
