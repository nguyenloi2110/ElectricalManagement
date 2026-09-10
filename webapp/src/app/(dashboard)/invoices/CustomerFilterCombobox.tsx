"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronsUpDown, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

export type CustomerOption = { id: string; name: string; phone: string };

interface CustomerFilterComboboxProps {
  selected: CustomerOption | null;
  onSelect: (customer: CustomerOption | null) => void;
}

/** Combobox tìm & lọc hóa đơn theo 1 khách hàng cụ thể (gõ tìm theo tên hoặc SĐT). */
export function CustomerFilterCombobox({ selected, onSelect }: CustomerFilterComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CustomerOption[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults([]);
      return;
    }
    setLoading(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/customers?search=${encodeURIComponent(query.trim())}&page=1`);
        const json = await res.json();
        if (json.success) {
          setResults(
            json.data.items
              .slice(0, 8)
              .map((c: { id: string; name: string; phone: string }) => ({ id: c.id, name: c.name, phone: c.phone })),
          );
        }
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  function handleSelect(customer: CustomerOption | null) {
    onSelect(customer);
    setOpen(false);
    setQuery("");
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full min-w-44 justify-between font-normal sm:w-56"
        >
          <span className="truncate">{selected ? selected.name : "Khách hàng: Tất cả"}</span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput value={query} onValueChange={setQuery} placeholder="Tìm tên hoặc số điện thoại..." />
          <CommandList>
            {selected && (
              <CommandItem value="__clear__" onSelect={() => handleSelect(null)}>
                <X className="h-4 w-4" />
                Bỏ chọn (Tất cả khách hàng)
              </CommandItem>
            )}
            {!query.trim() && (
              <CommandEmpty>Nhập tên hoặc số điện thoại để tìm khách hàng...</CommandEmpty>
            )}
            {query.trim() && !loading && results.length === 0 && (
              <CommandEmpty>Không tìm thấy khách hàng phù hợp</CommandEmpty>
            )}
            {results.map((c) => (
              <CommandItem key={c.id} value={c.id} onSelect={() => handleSelect(c)}>
                <Users className="h-4 w-4" />
                <span className="truncate">{c.name}</span>
                <span className="ml-auto text-xs text-muted-foreground">{c.phone}</span>
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
