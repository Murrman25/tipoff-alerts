import { GameEvent } from "@/types/games";

// Mock data structured like the SportsGameOdds API response
export const mockGames: GameEvent[] = [
  {
    eventID: "nba_2024_chi_gsw_001",
    sportID: "BASKETBALL",
    leagueID: "NBA",
    teams: {
      home: { teamID: "bulls", name: "Chicago Bulls", abbreviation: "CHI" },
      away: { teamID: "warriors", name: "Golden State Warriors", abbreviation: "GSW" },
    },
    status: {
      startsAt: new Date().toISOString(),
      started: true,
      ended: false,
      finalized: false,
      period: "Q3",
      clock: "7:42",
    },
    score: { home: 78, away: 82 },
    odds: {
      "points-home-game-ml-home": {
        byBookmaker: {
          draftkings: { odds: "-145", available: true },
          fanduel: { odds: "-140", available: true },
        },
      },
      "points-away-game-ml-away": {
        byBookmaker: {
          draftkings: { odds: "+125", available: true },
          fanduel: { odds: "+120", available: true },
        },
      },
      "points-home-game-sp-home": {
        byBookmaker: {
          draftkings: { odds: "-110", spread: "-3.5", available: true },
          fanduel: { odds: "-108", spread: "-3.5", available: true },
        },
      },
      "points-away-game-sp-away": {
        byBookmaker: {
          draftkings: { odds: "-110", spread: "+3.5", available: true },
          fanduel: { odds: "-112", spread: "+3.5", available: true },
        },
      },
      "points-all-game-ou-over": {
        byBookmaker: {
          draftkings: { odds: "-110", overUnder: "224.5", available: true },
          fanduel: { odds: "-108", overUnder: "225", available: true },
        },
      },
      "points-all-game-ou-under": {
        byBookmaker: {
          draftkings: { odds: "-110", overUnder: "224.5", available: true },
          fanduel: { odds: "-112", overUnder: "225", available: true },
        },
      },
    },
  },
  {
    eventID: "nba_2024_den_bos_002",
    sportID: "BASKETBALL",
    leagueID: "NBA",
    teams: {
      home: { teamID: "nuggets", name: "Denver Nuggets", abbreviation: "DEN" },
      away: { teamID: "celtics", name: "Boston Celtics", abbreviation: "BOS" },
    },
    status: {
      startsAt: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
      started: false,
      ended: false,
      finalized: false,
    },
    odds: {
      "points-home-game-ml-home": {
        byBookmaker: {
          draftkings: { odds: "+110", available: true },
          fanduel: { odds: "+108", available: true },
        },
      },
      "points-away-game-ml-away": {
        byBookmaker: {
          draftkings: { odds: "-130", available: true },
          fanduel: { odds: "-128", available: true },
        },
      },
      "points-home-game-sp-home": {
        byBookmaker: {
          draftkings: { odds: "-110", spread: "+2.5", available: true },
        },
      },
      "points-away-game-sp-away": {
        byBookmaker: {
          draftkings: { odds: "-110", spread: "-2.5", available: true },
        },
      },
      "points-all-game-ou-over": {
        byBookmaker: {
          draftkings: { odds: "-105", overUnder: "231.5", available: true },
        },
      },
      "points-all-game-ou-under": {
        byBookmaker: {
          draftkings: { odds: "-115", overUnder: "231.5", available: true },
        },
      },
    },
  },
  {
    eventID: "nfl_2024_min_was_001",
    sportID: "FOOTBALL",
    leagueID: "NFL",
    teams: {
      home: { teamID: "vikings", name: "Minnesota Vikings", abbreviation: "MIN" },
      away: { teamID: "commanders", name: "Washington Commanders", abbreviation: "WAS" },
    },
    status: {
      startsAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      started: false,
      ended: false,
      finalized: false,
    },
    odds: {
      "points-home-game-ml-home": {
        byBookmaker: {
          draftkings: { odds: "-180", available: true },
          betmgm: { odds: "-175", available: true },
        },
      },
      "points-away-game-ml-away": {
        byBookmaker: {
          draftkings: { odds: "+155", available: true },
          betmgm: { odds: "+150", available: true },
        },
      },
      "points-home-game-sp-home": {
        byBookmaker: {
          draftkings: { odds: "-110", spread: "-4.5", available: true },
        },
      },
      "points-away-game-sp-away": {
        byBookmaker: {
          draftkings: { odds: "-110", spread: "+4.5", available: true },
        },
      },
      "points-all-game-ou-over": {
        byBookmaker: {
          draftkings: { odds: "-110", overUnder: "47.5", available: true },
        },
      },
      "points-all-game-ou-under": {
        byBookmaker: {
          draftkings: { odds: "-110", overUnder: "47.5", available: true },
        },
      },
    },
  },
  {
    eventID: "mlb_2024_tex_sf_001",
    sportID: "BASEBALL",
    leagueID: "MLB",
    teams: {
      home: { teamID: "rangers", name: "Texas Rangers", abbreviation: "TEX" },
      away: { teamID: "giants", name: "San Francisco Giants", abbreviation: "SF" },
    },
    status: {
      startsAt: new Date().toISOString(),
      started: true,
      ended: false,
      finalized: false,
      period: "Bot 7th",
    },
    score: { home: 3, away: 4 },
    odds: {
      "points-home-game-ml-home": {
        byBookmaker: {
          draftkings: { odds: "+125", available: true },
          fanduel: { odds: "+130", available: true },
        },
      },
      "points-away-game-ml-away": {
        byBookmaker: {
          draftkings: { odds: "-145", available: true },
          fanduel: { odds: "-150", available: true },
        },
      },
      "points-all-game-ou-over": {
        byBookmaker: {
          draftkings: { odds: "-110", overUnder: "8.5", available: true },
        },
      },
      "points-all-game-ou-under": {
        byBookmaker: {
          draftkings: { odds: "-110", overUnder: "8.5", available: true },
        },
      },
    },
  },
  {
    eventID: "ncaab_2024_duke_unc_001",
    sportID: "BASKETBALL",
    leagueID: "NCAAB",
    teams: {
      home: { teamID: "duke", name: "Duke Blue Devils", abbreviation: "DUKE" },
      away: { teamID: "unc", name: "North Carolina Tar Heels", abbreviation: "UNC" },
    },
    status: {
      startsAt: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
      started: false,
      ended: false,
      finalized: false,
    },
    odds: {
      "points-home-game-ml-home": {
        byBookmaker: {
          draftkings: { odds: "-200", available: true },
        },
      },
      "points-away-game-ml-away": {
        byBookmaker: {
          draftkings: { odds: "+170", available: true },
        },
      },
      "points-home-game-sp-home": {
        byBookmaker: {
          draftkings: { odds: "-110", spread: "-5.5", available: true },
        },
      },
      "points-away-game-sp-away": {
        byBookmaker: {
          draftkings: { odds: "-110", spread: "+5.5", available: true },
        },
      },
      "points-all-game-ou-over": {
        byBookmaker: {
          draftkings: { odds: "-110", overUnder: "152.5", available: true },
        },
      },
      "points-all-game-ou-under": {
        byBookmaker: {
          draftkings: { odds: "-110", overUnder: "152.5", available: true },
        },
      },
    },
  },
  {
    eventID: "nhl_2024_bos_nyr_001",
    sportID: "HOCKEY",
    leagueID: "NHL",
    teams: {
      home: { teamID: "bruins", name: "Boston Bruins", abbreviation: "BOS" },
      away: { teamID: "rangers", name: "New York Rangers", abbreviation: "NYR" },
    },
    status: {
      startsAt: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
      started: false,
      ended: false,
      finalized: false,
    },
    odds: {
      "points-home-game-ml-home": {
        byBookmaker: {
          draftkings: { odds: "-130", available: true },
        },
      },
      "points-away-game-ml-away": {
        byBookmaker: {
          draftkings: { odds: "+110", available: true },
        },
      },
      "points-all-game-ou-over": {
        byBookmaker: {
          draftkings: { odds: "-115", overUnder: "5.5", available: true },
        },
      },
      "points-all-game-ou-under": {
        byBookmaker: {
          draftkings: { odds: "-105", overUnder: "5.5", available: true },
        },
      },
    },
  },
];
