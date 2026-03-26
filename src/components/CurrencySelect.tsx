import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CURRENCIES = [
  { value: "HKD", label: "HKD - Hong Kong Dollar" },
  { value: "USD", label: "USD - US Dollar" },
  { value: "CNY", label: "CNY - Chinese Yuan" },
];

interface CurrencySelectProps {
  name?: string;
  defaultValue?: string;
  onValueChange?: (v: string) => void;
}

const CurrencySelect = ({ name = "currency", defaultValue = "HKD", onValueChange }: CurrencySelectProps) => (
  <Select name={name} defaultValue={defaultValue} onValueChange={onValueChange}>
    <SelectTrigger>
      <SelectValue placeholder="Currency" />
    </SelectTrigger>
    <SelectContent>
      {CURRENCIES.map((c) => (
        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
      ))}
    </SelectContent>
  </Select>
);

export default CurrencySelect;
