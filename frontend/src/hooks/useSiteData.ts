"use client";

import { useEffect, useMemo, useState } from "react";
import { apiClient } from "@/integrations/api/client";
import type { Tables } from "@/integrations/api/types";

type SiteDataRow = Tables<"site_data">;

const defaultEntries = [
  { data_key: "hero_eyebrow", value: "Renewable Energy - 2027" },
  { data_key: "hero_title_primary", value: "World Conference on Renewable Energy" },
  { data_key: "hero_title_secondary", value: "& Sustainable Energy" },
  { data_key: "hero_date_line", value: "March 3-4, 2027 | #22-28, V.V. Nagar, Chaitanyapuri, Hyderabad, Telangana 500060, India" },
  { data_key: "hero_theme", value: "Conference Theme: Advancing Sustainable Energy Futures: Innovation, Integration, and Global Impact" },
  { data_key: "organizer_name", value: "NVS INTERNATIONAL SERVICES" },
  { data_key: "footer_description", value: "World Conference on Renewable Energy & Sustainable Energy. Join global energy leaders, researchers, speakers, and professionals online for Renewable Energy - 2027." },
  { data_key: "contact_email", value: "info@yourconference.com" },
  { data_key: "contact_phone", value: "+91 8340927492" },
  { data_key: "conference_venue", value: "#22-28, V.V. Nagar, Chaitanyapuri\nHyderabad, Telangana 500060, India" },
  { data_key: "important_dates", value: "" },
  { data_key: "registration_pricing", value: "" },
];

export const getDefaultSiteDataValue = (key: string) =>
  defaultEntries.find((entry) => entry.data_key === key)?.value ?? "";

export const useSiteData = () => {
  const [rows, setRows] = useState<SiteDataRow[]>([]);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      const { data } = await apiClient
        .from("site_data")
        .select("*")
        .eq("is_public", true)
        .order("group_name", { ascending: true })
        .order("label", { ascending: true });

      if (isMounted && data) {
        setRows(data);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  const values = useMemo(() => {
    const map = new Map<string, string>();

    defaultEntries.forEach((entry) => {
      map.set(entry.data_key, entry.value);
    });

    rows.forEach((row) => {
      map.set(row.data_key, row.value ?? "");
    });

    return Object.fromEntries(map);
  }, [rows]);

  return { rows, values };
};
