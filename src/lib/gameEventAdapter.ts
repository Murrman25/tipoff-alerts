import { GameEventCompat } from "@/backend/contracts/api";
import { GameEvent } from "@/types/games";

function resolveTeamName(team: GameEventCompat["teams"]["home"]): string {
  return team.name || team.names?.long || team.names?.medium || team.teamID;
}

function resolveTeamAbbreviation(team: GameEventCompat["teams"]["home"]): string | undefined {
  return team.abbreviation || team.names?.short;
}

export function adaptGameEvent(event: GameEventCompat): GameEvent {
  return {
    ...event,
    teams: {
      home: {
        ...event.teams.home,
        name: resolveTeamName(event.teams.home),
        abbreviation: resolveTeamAbbreviation(event.teams.home),
      },
      away: {
        ...event.teams.away,
        name: resolveTeamName(event.teams.away),
        abbreviation: resolveTeamAbbreviation(event.teams.away),
      },
    },
  } as GameEvent;
}

export function adaptGameEvents(events: GameEventCompat[]): GameEvent[] {
  return events.map(adaptGameEvent);
}
