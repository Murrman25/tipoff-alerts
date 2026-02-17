import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import MyAlerts from "@/pages/MyAlerts";

const mockListAlerts = vi.fn();

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "u_1", email: "a25murray@gmail.com" },
    isLoading: false,
  }),
}));

vi.mock("@/hooks/useAlertTemplates", () => ({
  useAlertTemplates: () => ({ data: [], isLoading: false }),
  useCreateTemplate: () => ({ mutate: vi.fn() }),
  useUpdateTemplate: () => ({ mutate: vi.fn() }),
  useDeleteTemplate: () => ({ mutate: vi.fn() }),
}));

vi.mock("@/components/alerts", () => ({
  TemplateCard: () => null,
  CreateTemplateModal: () => null,
}));

vi.mock("@/lib/alertsApi", () => ({
  listAlerts: () => mockListAlerts(),
  deleteAlertById: vi.fn(),
  updateAlertStatus: vi.fn(),
}));

describe("MyAlerts", () => {
  beforeEach(() => {
    mockListAlerts.mockReset();
    mockListAlerts.mockResolvedValue([]);
  });

  it("shows Total line badge for line-based O/U alerts", async () => {
    mockListAlerts.mockResolvedValue([
      {
        id: "ou_line_1",
        rule_type: "ou_threshold",
        event_id: "evt_1",
        market_type: "ou",
        team_side: null,
        threshold: 224,
        direction: "at_or_above",
        time_window: "both",
        is_active: true,
        created_at: "2026-02-17T00:00:00.000Z",
        channels: ["push"],
        valueMetric: "line_value",
        eventName: "Lakers @ Nuggets",
      },
    ]);

    render(
      <MemoryRouter>
        <MyAlerts />
      </MemoryRouter>,
    );

    expect(await screen.findByText("Total line")).toBeInTheDocument();
    expect(
      screen.queryByText(/Legacy O\/U alert is price-based/i),
    ).not.toBeInTheDocument();
  });

  it("shows legacy O/U warning for price-based O/U alerts", async () => {
    mockListAlerts.mockResolvedValue([
      {
        id: "ou_price_1",
        rule_type: "ou_threshold",
        event_id: "evt_2",
        market_type: "ou",
        team_side: null,
        threshold: 42.5,
        direction: "at_or_below",
        time_window: "both",
        is_active: true,
        created_at: "2026-02-17T00:00:00.000Z",
        channels: ["email"],
        valueMetric: "odds_price",
        eventName: "Bears @ Packers",
      },
    ]);

    render(
      <MemoryRouter>
        <MyAlerts />
      </MemoryRouter>,
    );

    expect(
      await screen.findByText(/Legacy O\/U alert is price-based/i),
    ).toBeInTheDocument();
  });
});
