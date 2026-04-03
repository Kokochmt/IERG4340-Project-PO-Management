import { useCompanies } from "@/hooks/useProcurementData";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CompanySelectProps {
  name?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

const CompanySelect = ({ name = "vendor_name", value, onValueChange }: CompanySelectProps) => {
  const { data: companies = [] } = useCompanies();

  return (
    <Select name={name} value={value} onValueChange={onValueChange} defaultValue="-">
      <SelectTrigger>
        <SelectValue placeholder="-" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="-">-</SelectItem>
        {companies.map((c) => (
          <SelectItem key={c.id} value={c.company_name}>
            {c.company_name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default CompanySelect;
