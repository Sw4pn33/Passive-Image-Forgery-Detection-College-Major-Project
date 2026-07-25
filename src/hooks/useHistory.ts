import { useEffect, useState } from "react";
import { getHistory, subscribeHistory } from "@/lib/history";
import type { StoredResult } from "@/lib/types";

export function useHistory() {
  const [items, setItems] = useState<StoredResult[]>([]);
  useEffect(() => {
    setItems(getHistory());
    return subscribeHistory(setItems);
  }, []);
  return items;
}
