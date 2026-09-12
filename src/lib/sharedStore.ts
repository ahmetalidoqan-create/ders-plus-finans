import type { AppData } from "@/types";

type SharedPayload = {
  exists: boolean;
  data: unknown;
};

export async function fetchSharedAppData(): Promise<SharedPayload> {
  try {
    const response = await fetch("/api/app-data");
    if (!response.ok) return { exists: false, data: null };
    return (await response.json()) as SharedPayload;
  } catch {
    return { exists: false, data: null };
  }
}

export async function saveSharedAppData(data: AppData) {
  try {
    await fetch("/api/app-data", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  } catch {
    /* localStorage cache remains */
  }
}

export async function deleteSharedAppData() {
  try {
    await fetch("/api/app-data", { method: "DELETE" });
  } catch {
    /* ignore */
  }
}
