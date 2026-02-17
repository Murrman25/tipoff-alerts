import { AlertComparator } from "@/backend/alerts/evaluateAlert";

type UiDirection =
  | "at_or_above"
  | "at_or_below"
  | "crosses_above"
  | "crosses_below"
  | "exactly"
  | "lead_by_or_more"
  | "within_points"
  | "trail_by_or_more"
  | "exact_margin"
  | null;

const UI_TO_COMPARATOR: Record<string, AlertComparator> = {
  at_or_above: "gte",
  lead_by_or_more: "gte",
  at_or_below: "lte",
  within_points: "lte",
  trail_by_or_more: "lte",
  crosses_above: "crosses_up",
  crosses_below: "crosses_down",
  exactly: "eq",
  exact_margin: "eq",
};

const COMPARATOR_TO_UI: Record<AlertComparator, string> = {
  gte: "at_or_above",
  lte: "at_or_below",
  eq: "exactly",
  crosses_up: "crosses_above",
  crosses_down: "crosses_below",
};

export function uiDirectionToComparator(direction: UiDirection): AlertComparator {
  if (!direction) {
    return "gte";
  }
  return UI_TO_COMPARATOR[direction] || "gte";
}

export function comparatorToUiDirection(comparator: AlertComparator): string {
  return COMPARATOR_TO_UI[comparator];
}
