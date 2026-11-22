import { getSupabaseClient, isSupabaseConfigured } from "./supabase";
import { SavedScan, KisanProfile, SyncStatus } from "@/types";
import { getSavedScansFromIndexedDB, replaceLocalScans } from "./storage";

export interface SyncResult {
  status: SyncStatus;
  message?: string;
  syncedCount?: number;
  scans?: SavedScan[];
}

// Convert base64 data URL to Blob for Supabase Storage upload
function base64ToBlob(base64: string): Blob | null {
  try {
    const parts = base64.split(";base64,");
    if (parts.length !== 2) return null;
    const contentType = parts[0].split(":")[1] || "image/jpeg";
    const raw = window.atob(parts[1]);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);
    for (let i = 0; i < rawLength; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
    }
    return new Blob([uInt8Array], { type: contentType });
  } catch (e) {
    console.error("Base64 to blob conversion failed:", e);
    return null;
  }
}

// Upload leaf scan image to Supabase Storage
export async function uploadLeafImageToStorage(
  userId: string,
  scanId: string,
  imageSrc: string
): Promise<string | null> {
  const supabase = getSupabaseClient();
  if (!supabase || !imageSrc || !imageSrc.startsWith("data:image")) {
    return null;
  }

  try {
    const blob = base64ToBlob(imageSrc);
    if (!blob) return null;

    const fileName = `${userId}/${scanId}.jpg`;
    const { data, error } = await supabase.storage
      .from("scans")
      .upload(fileName, blob, {
        contentType: "image/jpeg",
        upsert: true,
      });

    if (error) {
      console.warn("Storage upload error (using thumbnail fallback):", error.message);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from("scans")
      .getPublicUrl(data.path);

    return publicUrlData?.publicUrl || null;
  } catch (err) {
    console.warn("Failed to upload scan image to bucket:", err);
    return null;
  }
}

// Google OAuth Sign In
export async function signInWithGoogle(): Promise<{ error: Error | null }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { error: new Error("Supabase is not configured. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local") };
  }

  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });
    return { error: error ? new Error(error.message) : null };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err : new Error("Failed to initialize Google login.") };
  }
}

// Sign Out
export async function signOut(): Promise<{ error: Error | null }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { error: null };

  try {
    const { error } = await supabase.auth.signOut();
    return { error: error ? new Error(error.message) : null };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err : new Error("Failed to sign out.") };
  }
}

// Fetch Farmer Profile
export async function fetchKisanProfile(): Promise<KisanProfile | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return null;

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.warn("Error fetching profile from DB:", error.message);
    }

    if (profile) {
      return {
        id: profile.id,
        email: profile.email || user.email,
        full_name: profile.full_name || user.user_metadata?.full_name || "Kisan Brother",
        avatar_url: profile.avatar_url || user.user_metadata?.avatar_url,
        state: profile.state || "Punjab",
        district: profile.district || "Ludhiana",
        preferred_crops: profile.preferred_crops || ["Wheat", "Paddy / Rice"],
        updated_at: profile.updated_at,
      };
    }

    // Default profile from auth metadata
    return {
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || user.user_metadata?.name || "Kisan Brother",
      avatar_url: user.user_metadata?.avatar_url,
      state: "Punjab",
      district: "Ludhiana",
      preferred_crops: ["Wheat", "Paddy / Rice"],
    };
  } catch (err) {
    console.error("fetchKisanProfile exception:", err);
    return null;
  }
}

// Update Farmer Profile
export async function saveKisanProfile(profile: Partial<KisanProfile>): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const payload = {
      id: user.id,
      full_name: profile.full_name,
      email: user.email,
      avatar_url: profile.avatar_url || user.user_metadata?.avatar_url,
      state: profile.state,
      district: profile.district,
      preferred_crops: profile.preferred_crops,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("profiles").upsert(payload);
    if (error) {
      console.error("Failed to update profile:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("saveKisanProfile exception:", err);
    return false;
  }
}

// Auto-Merge & Sync All Scans between IndexedDB & Supabase
export async function syncScansWithCloud(): Promise<SyncResult> {
  if (!isSupabaseConfigured()) {
    return {
      status: "idle",
      message: "Supabase credentials not configured in environment.",
    };
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return { status: "offline", message: "Database offline" };
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { status: "idle", message: "Not signed in; scans remain safely stored on this device." };
    }

    // 1. Get all local scans from IndexedDB
    const localScans = await getSavedScansFromIndexedDB();

    // 2. Upload any local scan to Supabase that hasn't been synced or needs image upload
    for (const scan of localScans) {
      let cloudImageUrl = scan.imageUrl;
      if (!cloudImageUrl && scan.imageThumbnail?.startsWith("data:image")) {
        cloudImageUrl = (await uploadLeafImageToStorage(user.id, scan.id, scan.imageThumbnail)) || undefined;
      }

      const row = {
        id: scan.id,
        user_id: user.id,
        timestamp: scan.timestamp,
        image_url: cloudImageUrl || null,
        image_thumbnail: scan.imageThumbnail,
        diagnosis: scan.diagnosis,
        severity: scan.severity,
        severity_gauge: scan.severity_gauge || null,
        tanki_quick_dose: scan.tanki_quick_dose || null,
        advisory: scan.advisory,
        weather_snapshot: scan.weatherSnapshot || null,
      };

      await supabase.from("scans").upsert(row, { onConflict: "id" });
    }

    // 3. Fetch all scans from cloud for this user
    const { data: cloudRows, error: fetchErr } = await supabase
      .from("scans")
      .select("*")
      .eq("user_id", user.id)
      .order("timestamp", { ascending: false });

    if (fetchErr) {
      console.error("Failed to fetch cloud scans:", fetchErr.message);
      return { status: "error", message: fetchErr.message };
    }

    // 4. Merge cloud rows with local scans into a unified list
    const cloudScans: SavedScan[] = (cloudRows || []).map((row) => ({
      id: row.id,
      timestamp: row.timestamp,
      imageThumbnail: row.image_thumbnail || row.image_url || "",
      imageUrl: row.image_url || undefined,
      diagnosis: row.diagnosis,
      severity: row.severity,
      severity_gauge: row.severity_gauge,
      tanki_quick_dose: row.tanki_quick_dose,
      advisory: row.advisory,
      weatherSnapshot: row.weather_snapshot,
      synced_to_cloud: true,
    }));

    // Merge by id (cloud prioritized, plus any local not yet on cloud)
    const scanMap = new Map<string, SavedScan>();
    for (const s of cloudScans) scanMap.set(s.id, s);
    for (const s of localScans) {
      if (!scanMap.has(s.id)) {
        scanMap.set(s.id, { ...s, synced_to_cloud: true });
      }
    }

    const mergedScans = Array.from(scanMap.values()).sort((a, b) => b.timestamp - a.timestamp);

    // Save unified merged scans back to IndexedDB and localStorage
    await replaceLocalScans(mergedScans);

    return {
      status: "synced",
      syncedCount: mergedScans.length,
      scans: mergedScans,
      message: `Successfully synced ${mergedScans.length} diagnostic scans with cloud.`,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Sync error";
    console.error("syncScansWithCloud exception:", err);
    return { status: "error", message: msg };
  }
}
