import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AlertSummary } from "@/components/alerts/AlertSummary";
import { AlertCondition } from "@/types/alerts";

const baseCondition: AlertCondition = {
  ruleType: "ou_threshold",
  eventID: "evt_ou_1",
  marketType: "ou",
  teamSide: null,
  threshold: 224,
  direction: "at_or_above",
  timeWindow: "both",
};

describe("AlertSummary", () => {
  it("formats O/U totals without forcing a leading plus sign", () => {
    render(
      <AlertSummary
        condition={baseCondition}
        selectedGame={null}
        notificationChannels={["push"]}
        isVisible
      />,
    );

    expect(screen.getByText(/total reaches 224 or higher/i)).toBeInTheDocument();
    expect(screen.queryByText(/\+224/)).not.toBeInTheDocument();
  });
});

