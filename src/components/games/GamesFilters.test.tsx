import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { GamesFilters } from "@/components/games/GamesFilters";
import { GamesFilters as GamesFiltersType } from "@/types/games";

const baseFilters: GamesFiltersType = {
  leagueID: [],
  bookmakerID: [],
  betTypeID: [],
  status: "live",
  searchQuery: "",
  oddsAvailable: false,
};

describe("GamesFilters", () => {
  it("locks status controls when league mixed mode is active", () => {
    render(
      <GamesFilters
        filters={baseFilters}
        onFiltersChange={vi.fn()}
        totalResults={0}
        statusLocked
        statusLockLabel="Live + Next 3 Days"
        statusHelperText="League mode prioritizes live games and includes upcoming games within the next 3 days."
      />,
    );

    expect(screen.getByText("Live + Next 3 Days")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Live" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Upcoming" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "All" })).toBeDisabled();
    expect(
      screen.getByText(
        "League mode prioritizes live games and includes upcoming games within the next 3 days.",
      ),
    ).toBeInTheDocument();
  });
});
