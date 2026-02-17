import { fireEvent, render, screen } from "@testing-library/react";
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
        statusHelperText="League mode prioritizes live games and includes upcoming games within the next 3 days."
      />,
    );

    expect(screen.queryByText("Live + Next 3 Days")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Live" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Upcoming" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "All" })).toBeDisabled();
    expect(
      screen.getByText(
        "League mode prioritizes live games and includes upcoming games within the next 3 days.",
      ),
    ).toBeInTheDocument();
  });

  it("shows smart team suggestions and selects the highlighted option with keyboard", () => {
    const onSelectSearchTeam = vi.fn();
    render(
      <GamesFilters
        filters={{ ...baseFilters, searchQuery: "Bos" }}
        onFiltersChange={vi.fn()}
        totalResults={0}
        teamOptions={[
          { id: "NHL_BOS", name: "Boston Bruins", league: "NHL" },
          { id: "NBA_BOS", name: "Boston Celtics", league: "NBA" },
        ]}
        onSelectSearchTeam={onSelectSearchTeam}
      />,
    );

    const input = screen.getByRole("combobox");
    fireEvent.focus(input);
    expect(screen.getByRole("option", { name: /Boston Bruins/i })).toBeInTheDocument();
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onSelectSearchTeam).toHaveBeenCalledWith({
      id: "NBA_BOS",
      name: "Boston Celtics",
      league: "NBA",
    });
  });

  it("shows selected team pill and clears it", () => {
    const onClearSearchTeam = vi.fn();
    render(
      <GamesFilters
        filters={{
          ...baseFilters,
          searchQuery: "Boston Bruins",
          searchTeam: { id: "NHL_BOS", name: "Boston Bruins", league: "NHL", logoUrl: null },
        }}
        onFiltersChange={vi.fn()}
        totalResults={0}
        onClearSearchTeam={onClearSearchTeam}
      />,
    );

    expect(screen.getByText("Selected team:")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Clear selected team"));
    expect(onClearSearchTeam).toHaveBeenCalledTimes(1);
  });

  it("clears selected team lock when search text diverges", () => {
    const onClearSearchTeam = vi.fn();
    const onFiltersChange = vi.fn();
    render(
      <GamesFilters
        filters={{
          ...baseFilters,
          searchQuery: "Boston Bruins",
          searchTeam: { id: "NHL_BOS", name: "Boston Bruins", league: "NHL", logoUrl: null },
        }}
        onFiltersChange={onFiltersChange}
        totalResults={0}
        onClearSearchTeam={onClearSearchTeam}
      />,
    );

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "Boston B" } });

    expect(onClearSearchTeam).toHaveBeenCalledTimes(1);
    expect(onFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({ searchQuery: "Boston B" }),
    );
  });
});
