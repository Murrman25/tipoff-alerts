import { MarketType } from "@/types/alerts";
import { MarketToggle } from "./MarketToggle";

interface AlertMarketSelectorProps {
  value: MarketType;
  onChange: (value: MarketType) => void;
}

export const AlertMarketSelector = ({
  value,
  onChange,
}: AlertMarketSelectorProps) => {
  return <MarketToggle value={value} onChange={onChange} />;
};
