// src/config/supabase.js
import { createClient } from "@supabase/supabase-js";
import { optionalCloudClient } from '../utils/optionalCloudClient';

export const supabase = optionalCloudClient(import.meta.env,
  typeof window === 'undefined' ? {} : window.location, createClient);

export const LEADERBOARD_BUCKET = "leaderboard-photos";
