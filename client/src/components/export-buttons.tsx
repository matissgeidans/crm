import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import type { ReportFilters } from "./report-filters";

interface ExportButtonsProps {
  filters: ReportFilters;
}

export function ExportButtons({ filters }: ExportButtonsProps) {
  const { toast } = useToast();
  const [exportType, setExportType] = useState<"excel" | "pdf" | null>(null);

  const buildQueryParams = () => {
    const params = new URLSearchParams();
    if (filters.startDate) {
      params.set("startDate", filters.startDate.toISOString());
    }
    if (filters.endDate) {
      params.set("endDate", filters.endDate.toISOString());
    }
    if (filters.driverId) {
      params.set("driverId", filters.driverId);
    }
    if (filters.clientId) {
      params.set("clientId", filters.clientId.toString());
    }
    if (filters.status) {
      params.set("status", filters.status);
    }
    if (filters.minDistance) {
      params.set("minDistance", filters.minDistance.toString());
    }
    if (filters.maxDistance) {
      params.set("maxDistance", filters.maxDistance.toString());
    }
    return params.toString();
  };

  const exportMutation = useMutation({
    mutationFn: async (type: "excel" | "pdf") => {
      setExportType(type);
      const queryParams = buildQueryParams();
      const url = `/api/reports/export/${type}${queryParams ? `?${queryParams}` : ""}`;
      
      const response = await fetch(url, {
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("401: Unauthorized");
        }
        throw new Error("Export failed");
      }

      const blob = await response.blob();
      const filename = type === "excel" 
        ? `towing-report-${new Date().toISOString().split("T")[0]}.xlsx`
        : `towing-report-${new Date().toISOString().split("T")[0]}.pdf`;

      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      return type;
    },
    onSuccess: (type) => {
      toast({
        title: "Export Complete",
        description: `Your ${type === "excel" ? "Excel" : "PDF"} report has been downloaded.`,
      });
      setExportType(null);
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Export Failed",
        description: "Failed to generate the report. Please try again.",
        variant: "destructive",
      });
      setExportType(null);
    },
  });

  const isExporting = exportMutation.isPending;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isExporting} data-testid="button-export">
          {isExporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => exportMutation.mutate("excel")}
          disabled={isExporting}
          data-testid="export-excel"
        >
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Export as Excel
          {exportType === "excel" && (
            <Loader2 className="ml-2 h-3 w-3 animate-spin" />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => exportMutation.mutate("pdf")}
          disabled={isExporting}
          data-testid="export-pdf"
        >
          <FileText className="mr-2 h-4 w-4" />
          Export as PDF
          {exportType === "pdf" && (
            <Loader2 className="ml-2 h-3 w-3 animate-spin" />
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
