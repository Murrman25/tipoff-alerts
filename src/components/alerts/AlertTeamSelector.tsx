import { GameEvent } from "@/types/games";
import { TeamSelectCards } from "./TeamSelectCards";

interface AlertTeamSelectorProps {
  game: GameEvent | null;
  value: "home" | "away" | null;
  onChange: (value: "home" | "away" | null) => void;
}

export const AlertTeamSelector = ({
  game,
  value,
  onChange,
}: AlertTeamSelectorProps) => {
  return <TeamSelectCards game={game} value={value} onChange={onChange} />;
};
