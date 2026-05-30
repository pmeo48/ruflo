const ESPN_MAP = {
  NBA:   'basketball/nba',
  NFL:   'football/nfl',
  MLB:   'baseball/mlb',
  NHL:   'hockey/nhl',
  NCAAB: 'basketball/mens-college-basketball',
  NCAAF: 'football/college-football',
};

const SOCCER_LEAGUES = ['usa.1', 'eng.1', 'esp.1', 'ger.1', 'ita.1', 'fra.1'];

const CACHE_TTL = 60 * 60 * 1000; // 1 hour

function cacheKey(sport, dateStr) { return `espn_cache_${sport}_${dateStr}`; }

function getCached(sport, dateStr) {
  try {
    const raw = sessionStorage.getItem(cacheKey(sport, dateStr));
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts < CACHE_TTL) return data;
    sessionStorage.removeItem(cacheKey(sport, dateStr));
  } catch {}
  return null;
}

function setCache(sport, dateStr, data) {
  try {
    sessionStorage.setItem(cacheKey(sport, dateStr), JSON.stringify({ ts: Date.now(), data }));
  } catch {}
}

const SKIP_KEYWORDS = ['all-star', 'all star', 'practice', 'g league', 'summer league',
  'exhibition', 'draft', 'awards', 'celebrity', 'skills', 'rising stars'];

function shouldSkip(name) {
  const lower = (name || '').toLowerCase();
  return SKIP_KEYWORDS.some(k => lower.includes(k));
}

function parseOdds(competitors) {
  let mlHome = '-110', mlAway = '+100', spread = null, spreadFav = null, total = null;
  try {
    for (const comp of competitors) {
      for (const line of (comp.odds || [])) {
        if (line.spread) spread = Math.abs(parseFloat(line.spread));
        if (line.moneyLine != null) {
          if (comp.homeAway === 'home') mlHome = line.moneyLine > 0 ? `+${line.moneyLine}` : String(line.moneyLine);
          else mlAway = line.moneyLine > 0 ? `+${line.moneyLine}` : String(line.moneyLine);
        }
      }
    }
  } catch {}
  return { mlHome, mlAway, spread, spreadFav, total };
}

function normalizeEvent(event, sport) {
  try {
    const comp = event.competitions?.[0];
    if (!comp) return null;
    const name = event.name || '';
    if (shouldSkip(name)) return null;

    const homeComp = comp.competitors?.find(c => c.homeAway === 'home');
    const awayComp = comp.competitors?.find(c => c.homeAway === 'away');
    if (!homeComp || !awayComp) return null;

    const home_team = homeComp.team?.displayName || homeComp.team?.name || 'Home';
    const away_team = awayComp.team?.displayName || awayComp.team?.name || 'Away';

    // Try to get odds from competition odds
    let mlHome = '-110', mlAway = '+100', spread_value = 3, spread_favored_team = home_team, total_line = 0;
    const compOdds = comp.odds?.[0];
    if (compOdds) {
      if (compOdds.details) {
        // e.g. "LAL -3.5" or "PK"
        const m = compOdds.details.match(/^(.+?)\s+([-+]?\d+\.?\d*)$/);
        if (m) {
          spread_value = Math.abs(parseFloat(m[2]));
          spread_favored_team = m[1].trim();
        }
      }
      if (compOdds.overUnder) total_line = parseFloat(compOdds.overUnder);
      if (compOdds.homeTeamOdds?.moneyLine != null) {
        const ml = compOdds.homeTeamOdds.moneyLine;
        mlHome = ml > 0 ? `+${ml}` : String(ml);
      }
      if (compOdds.awayTeamOdds?.moneyLine != null) {
        const ml = compOdds.awayTeamOdds.moneyLine;
        mlAway = ml > 0 ? `+${ml}` : String(ml);
      }
    }

    const dateRaw = comp.date || event.date;
    let game_time = '';
    if (dateRaw) {
      game_time = new Date(dateRaw).toLocaleTimeString('en-US', {
        hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York',
      }) + ' ET';
    }

    return {
      id: event.id || `${sport}_${home_team}_${away_team}`,
      sport,
      home_team,
      away_team,
      game_time,
      spread_favored_team: spread_favored_team || home_team,
      spread_value: spread_value || 3,
      moneyline_home: mlHome,
      moneyline_away: mlAway,
      total_line: total_line || (sport === 'MLB' ? 8.5 : sport === 'NHL' ? 5.5 : sport === 'Soccer' ? 2.5 : 220),
    };
  } catch {
    return null;
  }
}

async function fetchLeague(path, dateStr) {
  const url = `https://site.api.espn.com/apis/site/v2/sports/${path}/scoreboard?dates=${dateStr}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`ESPN ${path} HTTP ${resp.status}`);
  const data = await resp.json();
  return data.events || [];
}

export async function fetchGames(sport, dateStr) {
  const cached = getCached(sport, dateStr);
  if (cached) return cached;

  let events = [];
  try {
    if (sport === 'Soccer') {
      const results = await Promise.allSettled(
        SOCCER_LEAGUES.map(lg => fetchLeague(`soccer/${lg}`, dateStr))
      );
      for (const r of results) {
        if (r.status === 'fulfilled') events.push(...r.value);
      }
    } else {
      const path = ESPN_MAP[sport];
      if (!path) return [];
      events = await fetchLeague(path, dateStr);
    }
  } catch (err) {
    console.warn(`ESPN fetch failed for ${sport}:`, err.message);
    return [];
  }

  const games = events
    .map(e => normalizeEvent(e, sport))
    .filter(Boolean);

  setCache(sport, dateStr, games);
  return games;
}

// Mock games for demo/offline mode
export function getMockGames(sport) {
  const mocks = {
    NBA: [
      { id: 'nba_1', sport: 'NBA', home_team: 'Boston Celtics', away_team: 'Miami Heat', game_time: '7:30 PM ET', spread_favored_team: 'Boston Celtics', spread_value: 5.5, moneyline_home: '-220', moneyline_away: '+180', total_line: 218.5 },
      { id: 'nba_2', sport: 'NBA', home_team: 'Golden State Warriors', away_team: 'LA Clippers', game_time: '10:00 PM ET', spread_favored_team: 'Golden State Warriors', spread_value: 3, moneyline_home: '-145', moneyline_away: '+122', total_line: 224 },
    ],
    NFL: [
      { id: 'nfl_1', sport: 'NFL', home_team: 'Kansas City Chiefs', away_team: 'Baltimore Ravens', game_time: '8:20 PM ET', spread_favored_team: 'Kansas City Chiefs', spread_value: 3, moneyline_home: '-162', moneyline_away: '+138', total_line: 48.5 },
    ],
    NHL: [
      { id: 'nhl_1', sport: 'NHL', home_team: 'Colorado Avalanche', away_team: 'Dallas Stars', game_time: '7:00 PM ET', spread_favored_team: 'Colorado Avalanche', spread_value: 1.5, moneyline_home: '-140', moneyline_away: '+118', total_line: 6 },
    ],
    MLB: [
      { id: 'mlb_1', sport: 'MLB', home_team: 'New York Yankees', away_team: 'Boston Red Sox', game_time: '7:05 PM ET', spread_favored_team: 'New York Yankees', spread_value: 1.5, moneyline_home: '-148', moneyline_away: '+126', total_line: 9 },
      { id: 'mlb_2', sport: 'MLB', home_team: 'Los Angeles Dodgers', away_team: 'San Francisco Giants', game_time: '10:10 PM ET', spread_favored_team: 'Los Angeles Dodgers', spread_value: 1.5, moneyline_home: '-178', moneyline_away: '+150', total_line: 8.5 },
    ],
    NCAAB: [
      { id: 'ncaab_1', sport: 'NCAAB', home_team: 'Duke Blue Devils', away_team: 'North Carolina Tar Heels', game_time: '9:00 PM ET', spread_favored_team: 'Duke Blue Devils', spread_value: 4, moneyline_home: '-175', moneyline_away: '+148', total_line: 155.5 },
    ],
    NCAAF: [
      { id: 'ncaaf_1', sport: 'NCAAF', home_team: 'Alabama Crimson Tide', away_team: 'Georgia Bulldogs', game_time: '3:30 PM ET', spread_favored_team: 'Alabama Crimson Tide', spread_value: 6.5, moneyline_home: '-240', moneyline_away: '+198', total_line: 51.5 },
    ],
    Soccer: [
      { id: 'soccer_1', sport: 'Soccer', home_team: 'Manchester City', away_team: 'Arsenal', game_time: '12:30 PM ET', spread_favored_team: 'Manchester City', spread_value: 0.5, moneyline_home: '-130', moneyline_away: '+340', total_line: 2.5 },
    ],
  };
  return mocks[sport] || [];
}
