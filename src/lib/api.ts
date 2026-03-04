const BASE_URL = "https://api.openf1.org/v1";

async function fetchAPI<T>(endpoint: string, params?: Record<string, string | number>): Promise<T> {
  const url = new URL(`${BASE_URL}/${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, String(value));
    });
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

// Types
export interface Meeting {
  circuit_key: number;
  circuit_image?: string;
  circuit_short_name: string;
  circuit_type?: string;
  country_code: string;
  country_flag?: string;
  country_key: number;
  country_name: string;
  date_end: string;
  date_start: string;
  gmt_offset: string;
  location: string;
  meeting_key: number;
  meeting_name: string;
  meeting_official_name: string;
  year: number;
}

export interface Session {
  circuit_key: number;
  circuit_short_name: string;
  country_code: string;
  country_name: string;
  date_end: string;
  date_start: string;
  gmt_offset: string;
  location: string;
  meeting_key: number;
  session_key: number;
  session_name: string;
  session_type: string;
  year: number;
}

export interface Driver {
  broadcast_name: string;
  driver_number: number;
  first_name: string;
  full_name: string;
  headshot_url?: string;
  last_name: string;
  meeting_key: number;
  name_acronym: string;
  session_key: number;
  team_colour: string;
  team_name: string;
}

export interface SessionResult {
  dnf: boolean;
  dns: boolean;
  dsq: boolean;
  driver_number: number;
  duration: number | null;
  gap_to_leader: number | null;
  number_of_laps: number | null;
  meeting_key: number;
  position: number;
  session_key: number;
}

export interface ChampionshipDriver {
  driver_number: number;
  meeting_key: number;
  points_current: number;
  points_start: number;
  position_current: number;
  position_start: number;
  session_key: number;
}

export interface ChampionshipTeam {
  meeting_key: number;
  points_current: number;
  points_start: number;
  position_current: number;
  position_start: number;
  session_key: number;
  team_name: string;
}

export interface CarData {
  brake: number;
  date: string;
  driver_number: number;
  drs: number;
  meeting_key: number;
  n_gear: number;
  rpm: number;
  session_key: number;
  speed: number;
  throttle: number;
}

export interface LocationData {
  date: string;
  driver_number: number;
  meeting_key: number;
  session_key: number;
  x: number;
  y: number;
  z: number;
}

export interface LapData {
  date_start: string;
  driver_number: number;
  duration_sector_1: number | null;
  duration_sector_2: number | null;
  duration_sector_3: number | null;
  i1_speed: number | null;
  i2_speed: number | null;
  is_pit_out_lap: boolean;
  lap_duration: number | null;
  lap_number: number;
  meeting_key: number;
  session_key: number;
  st_speed: number | null;
}

export interface Position {
  date: string;
  driver_number: number;
  meeting_key: number;
  position: number;
  session_key: number;
}

export interface Interval {
  date: string;
  driver_number: number;
  gap_to_leader: number | null;
  interval: number | null;
  meeting_key: number;
  session_key: number;
}

// API functions
export const api = {
  getMeetings: (params?: Record<string, string | number>) =>
    fetchAPI<Meeting[]>("meetings", params),

  getSessions: (params?: Record<string, string | number>) =>
    fetchAPI<Session[]>("sessions", params),

  getDrivers: (params?: Record<string, string | number>) =>
    fetchAPI<Driver[]>("drivers", params),

  getSessionResult: (params?: Record<string, string | number>) =>
    fetchAPI<SessionResult[]>("session_result", params),

  getChampionshipDrivers: (params?: Record<string, string | number>) =>
    fetchAPI<ChampionshipDriver[]>("championship_drivers", params),

  getChampionshipTeams: (params?: Record<string, string | number>) =>
    fetchAPI<ChampionshipTeam[]>("championship_teams", params),

  getCarData: (params?: Record<string, string | number>) =>
    fetchAPI<CarData[]>("car_data", params),

  getLocation: (params?: Record<string, string | number>) =>
    fetchAPI<LocationData[]>("location", params),

  getLaps: (params?: Record<string, string | number>) =>
    fetchAPI<LapData[]>("laps", params),

  getPositions: (params?: Record<string, string | number>) =>
    fetchAPI<Position[]>("position", params),

  getIntervals: (params?: Record<string, string | number>) =>
    fetchAPI<Interval[]>("intervals", params),
};
