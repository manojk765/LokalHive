"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Slider } from "@/components/ui/slider";
import { CATEGORIES } from "@/lib/types";
import { CalendarIcon, FilterIcon, Search } from "lucide-react";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";

export interface Filters {
  searchTerm?: string;
  category?: string;
  date?: Date;
  priceRange?: [number, number];
  radius?: number; // in km
}

interface FilterControlsProps {
  onFilterChange: (filters: Partial<Filters>) => void; // Changed to Partial<Filters> for clear
  defaultFilters?: Filters;
}

const ALL_CATEGORIES_VALUE = "ALL_CATEGORIES_PLACEHOLDER";

export function FilterControls({ onFilterChange, defaultFilters = {} }: FilterControlsProps) {
  const [searchTerm, setSearchTerm] = useState(defaultFilters.searchTerm || "");
  const [category, setCategory] = useState(
    defaultFilters.category === "" || defaultFilters.category === undefined
      ? ALL_CATEGORIES_VALUE
      : defaultFilters.category
  );
  const [date, setDate] = useState<Date | undefined>(defaultFilters.date);
  const [priceRange, setPriceRange] = useState<[number, number]>(defaultFilters.priceRange || [0, 200]);

  const handleApplyFilters = () => {
    onFilterChange({
      searchTerm,
      category: category === ALL_CATEGORIES_VALUE ? "" : category,
      date,
      priceRange
    });
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setCategory(ALL_CATEGORIES_VALUE);
    setDate(undefined);
    setPriceRange([0, 200]);
    onFilterChange({
      searchTerm: "",
      category: "", // Send empty string to signify all categories
      date: undefined,
      priceRange: [0, 200]
    });
  };

  return (
    <Card className="p-4 md:p-6 mb-6 shadow-sm rounded-lg">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        <div className="space-y-2">
          <Label htmlFor="search">Search Sessions</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              type="text"
              placeholder="Keywords, title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger id="category">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_CATEGORIES_VALUE}>All Categories</SelectItem>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={"outline"}
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="price">Price Range: ₹{priceRange[0]} - ₹{priceRange[1] === 1000 ? '1000+' : priceRange[1]}</Label>
          <Slider
            id="price"
            min={0}
            max={1000}
            step={10}
            value={[priceRange[0], priceRange[1]]}
            onValueChange={(value) => setPriceRange(value as [number, number])}
            className="py-2"
          />
          <p className="text-xs text-muted-foreground mt-1">Adjust the slider and click 'Apply Filters' to update results.</p>
        </div>
      </div>
      <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-end">
        <Button variant="outline" onClick={handleClearFilters}>Clear Filters</Button>
        <Button onClick={handleApplyFilters}><FilterIcon className="mr-2 h-4 w-4"/>Apply Filters</Button>
      </div>
    </Card>
  );
}
