import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { EmptyGamesState } from "@/components/games/EmptyGamesState";

describe("EmptyGamesState", () => {
  it("shows global no-live message and CTA", () => {
    render(<EmptyGamesState variant="globalNoLive" onShowUpcoming={vi.fn()} />);

    expect(screen.getByText("No live games right now")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Show Upcoming" })).toBeInTheDocument();
  });

  it("shows league mixed empty messaging", () => {
    render(<EmptyGamesState variant="leagueWindowEmpty" />);

    expect(screen.getByText("No league games in the next 3 days")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Show Upcoming" })).not.toBeInTheDocument();
  });

  it("shows filtered empty messaging and clear action", () => {
    render(<EmptyGamesState variant="filtered" onClearFilters={vi.fn()} />);

    expect(screen.getByText("No games match your filters")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear all filters" })).toBeInTheDocument();
  });
});
