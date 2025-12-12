import { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon, X, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Client, User } from "@shared/schema";

export interface ReportFilters {
  startDate?: Date;
  endDate?: Date;
  driverId?: string;
  clientId?: number;
  status?: string;
  minDistance?: number;
  maxDistance?: number;
}

interface ReportFiltersProps {
  filters: ReportFilters;
  onFiltersChange: (filters: ReportFilters) => void;
  clients: Client[];
  drivers: User[];
  isLoading?: boolean;
}

export function ReportFiltersPanel({
  filters,
  onFiltersChange,
  clients,
  drivers,
  isLoading,
}: ReportFiltersProps) {
  const [isOpen, setIsOpen] = useState(true);

  const clearFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = Object.values(filters).some(
    (v) => v !== undefined && v !== ""
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Filter className="h-4 w-4" />
          Filters
        </CardTitle>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            data-testid="button-clear-filters"
          >
            <X className="mr-1 h-3 w-3" />
            Clear
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="start-date">From Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="start-date"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !filters.startDate && "text-muted-foreground"
                  )}
                  data-testid="button-start-date"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.startDate
                    ? format(filters.startDate, "PPP")
                    : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.startDate}
                  onSelect={(date) =>
                    onFiltersChange({ ...filters, startDate: date })
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="end-date">To Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="end-date"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !filters.endDate && "text-muted-foreground"
                  )}
                  data-testid="button-end-date"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.endDate
                    ? format(filters.endDate, "PPP")
                    : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.endDate}
                  onSelect={(date) =>
                    onFiltersChange({ ...filters, endDate: date })
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="driver">Driver</Label>
          <Select
            value={filters.driverId || "all"}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                driverId: value === "all" ? undefined : value,
              })
            }
          >
            <SelectTrigger data-testid="select-filter-driver">
              <SelectValue placeholder="All drivers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Drivers</SelectItem>
              {drivers.map((driver) => (
                <SelectItem key={driver.id} value={driver.id}>
                  {driver.firstName
                    ? `${driver.firstName} ${driver.lastName || ""}`
                    : driver.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="client">Client</Label>
          <Select
            value={filters.clientId?.toString() || "all"}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                clientId: value === "all" ? undefined : parseInt(value),
              })
            }
          >
            <SelectTrigger data-testid="select-filter-client">
              <SelectValue placeholder="All clients" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Clients</SelectItem>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id.toString()}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={filters.status || "all"}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                status: value === "all" ? undefined : value,
              })
            }
          >
            <SelectTrigger data-testid="select-filter-status">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="min-distance">Min Distance (km)</Label>
            <Input
              id="min-distance"
              type="number"
              min="0"
              placeholder="0"
              value={filters.minDistance || ""}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  minDistance: e.target.value
                    ? parseFloat(e.target.value)
                    : undefined,
                })
              }
              data-testid="input-min-distance"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="max-distance">Max Distance (km)</Label>
            <Input
              id="max-distance"
              type="number"
              min="0"
              placeholder="1000"
              value={filters.maxDistance || ""}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  maxDistance: e.target.value
                    ? parseFloat(e.target.value)
                    : undefined,
                })
              }
              data-testid="input-max-distance"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
