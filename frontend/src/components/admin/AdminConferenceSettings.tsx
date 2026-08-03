import { useEffect, useState } from "react";
import { apiClient } from "@/integrations/api/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  defaultImportantDates,
  defaultPricingRows,
  importantDatesKey,
  parseImportantDates,
  parsePricingRows,
  registrationPricingKey,
  type ImportantDateItem,
  type PricingRow,
} from "@/lib/conferenceSettings";

const AdminConferenceSettings = () => {
  const [dates, setDates] = useState<ImportantDateItem[]>(defaultImportantDates);
  const [pricing, setPricing] = useState<PricingRow[]>(defaultPricingRows);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await apiClient
        .from("site_data")
        .select("data_key,value")
        .in("data_key", [importantDatesKey, registrationPricingKey]);

      if (error) {
        toast({ title: "Could not load settings", description: error.message, variant: "destructive" });
        return;
      }

      const values = Object.fromEntries((data || []).map((row: { data_key: string; value: string | null }) => [row.data_key, row.value || ""]));
      setDates(parseImportantDates(values[importantDatesKey]));
      setPricing(parsePricingRows(values[registrationPricingKey]));
    };

    fetchSettings();
  }, [toast]);

  const updateDate = (index: number, field: keyof ImportantDateItem, value: string) => {
    setDates((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item)));
  };

  const updatePrice = (index: number, field: keyof PricingRow, value: string) => {
    setPricing((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? { ...item, [field]: field === "category" || field === "id" ? value : Number(value) || 0 }
          : item,
      ),
    );
  };

  const handleSave = async () => {
    setIsSaving(true);

    const { error } = await apiClient.from("site_data").upsert(
      [
        {
          data_key: importantDatesKey,
          label: "Important Dates",
          value: JSON.stringify(dates),
          group_name: "conference",
          value_type: "json",
          is_public: true,
        },
        {
          data_key: registrationPricingKey,
          label: "Registration Pricing",
          value: JSON.stringify(pricing),
          group_name: "conference",
          value_type: "json",
          is_public: true,
        },
      ],
      { onConflict: "data_key" },
    );

    setIsSaving(false);

    if (error) {
      toast({ title: "Could not save settings", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Conference settings saved" });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle className="font-display">Important Dates & Pricing</CardTitle>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="space-y-4">
          <h3 className="font-display text-xl font-bold text-card-foreground">Important Dates</h3>
          {dates.map((item, index) => (
            <div key={item.id} className="grid gap-3 rounded-md border border-border p-4 lg:grid-cols-5">
              <Input value={item.title} onChange={(event) => updateDate(index, "title", event.target.value)} placeholder="Title" />
              <Input value={item.date} onChange={(event) => updateDate(index, "date", event.target.value)} placeholder="Display date" />
              <Input value={item.desc} onChange={(event) => updateDate(index, "desc", event.target.value)} placeholder="Description" />
              <Input type="date" value={item.startDate || ""} onChange={(event) => updateDate(index, "startDate", event.target.value)} />
              <Input type="date" value={item.endDate || ""} onChange={(event) => updateDate(index, "endDate", event.target.value)} />
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <h3 className="font-display text-xl font-bold text-card-foreground">Registration Pricing</h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-2 py-3">Category</th>
                  <th className="px-2 py-3">Pre-Early Bird</th>
                  <th className="px-2 py-3">Early Bird</th>
                  <th className="px-2 py-3">Midterm</th>
                  <th className="px-2 py-3">On Spot</th>
                </tr>
              </thead>
              <tbody>
                {pricing.map((row, index) => (
                  <tr key={row.id} className="border-b border-border">
                    <td className="px-2 py-3">
                      <Input value={row.category} onChange={(event) => updatePrice(index, "category", event.target.value)} />
                    </td>
                    <td className="px-2 py-3">
                      <Input type="number" value={row.preEarly} onChange={(event) => updatePrice(index, "preEarly", event.target.value)} />
                    </td>
                    <td className="px-2 py-3">
                      <Input type="number" value={row.earlyBird} onChange={(event) => updatePrice(index, "earlyBird", event.target.value)} />
                    </td>
                    <td className="px-2 py-3">
                      <Input type="number" value={row.midterm} onChange={(event) => updatePrice(index, "midterm", event.target.value)} />
                    </td>
                    <td className="px-2 py-3">
                      <Input type="number" value={row.onSpot} onChange={(event) => updatePrice(index, "onSpot", event.target.value)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminConferenceSettings;
