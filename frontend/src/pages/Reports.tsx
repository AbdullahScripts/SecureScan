import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  Eye,
  File,
  Link2,
  Trash2,
  MessageSquare,
  Loader2,
} from "lucide-react";
import { Layout } from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { formatFileSize, getFileReports, getFileReport, getUrlReports, getUrlReport, explainFileReport, explainUrlReport, deleteFileReport, deleteSelectedFileReports, clearFileReports, deleteUrlReport, deleteSelectedUrlReports, clearUrlReports, type FileScanReport, type UrlScanReport, type FileReportExplainResponse } from "@/services/api";

export default function Reports() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fileReports, setFileReports] = useState<FileScanReport[]>([]);
  const [urlReports, setUrlReports] = useState<UrlScanReport[]>([]);
  const [selectedReports, setSelectedReports] = useState<number[]>([]);
  const [selectedReport, setSelectedReport] = useState<FileScanReport | UrlScanReport | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [explanationLoading, setExplanationLoading] = useState(false);
  const [explanation, setExplanation] = useState<FileReportExplainResponse | null>(null);
  const [recentPage, setRecentPage] = useState(1);
  const [recentActivityItems, setRecentActivityItems] = useState<any[]>([]);
  const [clearedReportIds, setClearedReportIds] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<string>("file-reports");
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmDialogType, setConfirmDialogType] = useState<"delete-one" | "delete-selected" | "clear-recent">("delete-one");
  const [confirmDialogMessage, setConfirmDialogMessage] = useState<string>("");
  const [pendingDeleteReportId, setPendingDeleteReportId] = useState<number | null>(null);
  const recentItemsPerPage = 5;

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const [fileData, urlData] = await Promise.all([
        getFileReports(),
        getUrlReports(),
      ]);
      setFileReports(fileData.reports);
      setUrlReports(urlData.reports);
      const combined = [
        ...fileData.reports.map((r) => ({ ...r, type: "file" as const })),
        ...urlData.reports.map((r) => ({ ...r, type: "url" as const })),
      ];
      const sorted = combined.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      const filtered = sorted.filter((item) => !clearedReportIds.includes(item.id));
      setRecentActivityItems(filtered);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  const handleClearRecentActivity = () => {
    setConfirmDialogType("clear-recent");
    setConfirmDialogMessage("Clear recent activity?");
    setConfirmDialogOpen(true);
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const allReports = useMemo(() => {
    const combined = [
      ...fileReports.map((r) => ({ ...r, type: "file" as const })),
      ...urlReports.map((r) => ({ ...r, type: "url" as const })),
    ];
    return combined.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [fileReports, urlReports]);

  const paginatedRecentReports = useMemo(() => {
    const start = (recentPage - 1) * recentItemsPerPage;
    return recentActivityItems.slice(start, start + recentItemsPerPage);
  }, [recentActivityItems, recentPage]);

  const totalRecentPages = Math.ceil(recentActivityItems.length / recentItemsPerPage);

  const handleDelete = (id: number) => {
    setPendingDeleteReportId(id);
    setConfirmDialogType("delete-one");
    setConfirmDialogMessage("Delete this report?");
    setConfirmDialogOpen(true);
  };

  const handleDeleteSelected = () => {
    if (selectedReports.length === 0) {
      return;
    }
    setConfirmDialogType("delete-selected");
    setConfirmDialogMessage("Delete selected reports?");
    setConfirmDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      if (confirmDialogType === "delete-one" && pendingDeleteReportId !== null) {
        if (activeTab === "file-reports") {
          await deleteFileReport(pendingDeleteReportId);
        } else {
          await deleteUrlReport(pendingDeleteReportId);
        }
        toast({
          title: "Report deleted",
          description: "Report deleted successfully.",
        });
        await fetchReports();
      } else if (confirmDialogType === "delete-selected") {
        if (activeTab === "file-reports") {
          await deleteSelectedFileReports(selectedReports);
        } else {
          await deleteSelectedUrlReports(selectedReports);
        }
        toast({
          title: "Reports deleted",
          description: "Selected reports deleted successfully.",
        });
        setSelectedReports([]);
        await fetchReports();
      } else if (confirmDialogType === "clear-recent") {
        const idsToClear = recentActivityItems.map((item) => item.id);
        setClearedReportIds((prev) => [...prev, ...idsToClear]);
        setRecentActivityItems([]);
        setRecentPage(1);
        toast({
          title: "Recent activity cleared",
          description: "Recent activity cleared successfully.",
        });
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Failed to delete",
        description: err instanceof Error ? err.message : "An error occurred",
      });
    } finally {
      setConfirmDialogOpen(false);
      setPendingDeleteReportId(null);
    }
  };

  const toggleReportSelection = (idOrIds: number | number[]) => {
    setSelectedReports((prev) => {
      if (Array.isArray(idOrIds)) {
        return idOrIds;
      }
      return prev.includes(idOrIds) ? prev.filter((r) => r !== idOrIds) : [...prev, idOrIds];
    });
  };

  const openReportModal = async (report: FileScanReport | UrlScanReport) => {
    try {
      if ("file_name" in report) {
        const fullReport = await getFileReport(report.id);
        setSelectedReport(fullReport);
      } else {
        const fullReport = await getUrlReport(report.id);
        setSelectedReport(fullReport);
      }
      setIsModalOpen(true);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Failed to load report details",
        description: err instanceof Error ? err.message : "An error occurred",
      });
    }
  };

  const handleExplainReport = async (report: FileScanReport | UrlScanReport) => {
    try {
      setExplanationLoading(true);
      setExplanation(null);
      let exp: FileReportExplainResponse;
      if ("file_name" in report) {
        exp = await explainFileReport(report.id);
      } else {
        exp = await explainUrlReport(report.id);
      }
      setExplanation(exp);
      setShowExplanation(true);
      if (!isModalOpen) {
        if ("file_name" in report) {
          const fullReport = await getFileReport(report.id);
          setSelectedReport(fullReport);
        } else {
          const fullReport = await getUrlReport(report.id);
          setSelectedReport(fullReport);
        }
        setIsModalOpen(true);
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Failed to explain report",
        description: err instanceof Error ? err.message : "An error occurred",
      });
    } finally {
      setExplanationLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Loading reports...</h2>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Failed to load reports</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={fetchReports}>Try Again</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">History</h1>
            <p className="text-muted-foreground">
              View and manage all your file and URL scan reports
            </p>
          </div>

          {/* Section A: Recent Activity */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Recent Activity</h2>
              <div className="flex items-center gap-2">
                {recentActivityItems.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={handleClearRecentActivity}
                    className="gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Clear Recent Activity
                  </Button>
                )}
                {totalRecentPages > 1 && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={recentPage === 1}
                      onClick={() => setRecentPage((p) => p - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {recentPage} of {totalRecentPages}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={recentPage === totalRecentPages}
                      onClick={() => setRecentPage((p) => p + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
            {recentActivityItems.length === 0 ? (
              <div className="border border-border rounded-lg p-12 text-center">
                <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No recent activity</h3>
                <p className="text-muted-foreground">Scan a file or URL to see activity here</p>
              </div>
            ) : (
              <div className="border border-border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Target</TableHead>
                      <TableHead className="hidden md:table-cell">Type</TableHead>
                      <TableHead className="hidden md:table-cell">Extension/Domain</TableHead>
                      <TableHead>Verdict</TableHead>
                      <TableHead className="hidden md:table-cell">Created Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedRecentReports.map((report: any, index: number) => (
                      <motion.tr
                        key={`${report.type}-${report.id}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b border-border hover:bg-muted/30 transition-colors"
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {report.type === "file" ? (
                              <File className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Link2 className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span className="font-mono text-sm truncate max-w-[200px]">
                              {report.type === "file" ? report.file_name : report.url}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">
                          {report.type === "file" ? "File" : "URL"}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">
                          {report.type === "file" ? report.file_extension : report.domain}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              report.final_verdict.includes("Low")
                                ? "outline"
                                : report.final_verdict.includes("Medium")
                                ? "secondary"
                                : "destructive"
                            }
                            className={
                              report.final_verdict.includes("Low")
                                ? "bg-success/10 text-success border-success/30"
                                : ""
                            }
                          >
                            {report.final_verdict.includes("Low") ||
                            report.final_verdict.includes("Medium") ? (
                              <CheckCircle className="h-3 w-3 mr-1" />
                            ) : (
                              <AlertTriangle className="h-3 w-3 mr-1" />
                            )}
                            {report.final_verdict}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">
                          {new Date(report.created_at).toLocaleString()}
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* Section B: Reports */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Reports</h2>
              {selectedReports.length > 0 && (
                <Button
                  variant="destructive"
                  onClick={handleDeleteSelected}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Selected
                </Button>
              )}
            </div>

            <Tabs defaultValue="file-reports" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="file-reports">File Reports</TabsTrigger>
                <TabsTrigger value="url-reports">URL Reports</TabsTrigger>
              </TabsList>

              <TabsContent value="file-reports" className="mt-6">
                <ReportsTable
                  type="file"
                  data={fileReports}
                  selectedReports={selectedReports}
                  onToggleSelection={toggleReportSelection}
                  onOpenReport={openReportModal}
                  onDelete={handleDelete}
                  onExplainReport={handleExplainReport}
                  explanationLoading={explanationLoading}
                />
              </TabsContent>

              <TabsContent value="url-reports" className="mt-6">
                <ReportsTable
                  type="url"
                  data={urlReports}
                  selectedReports={selectedReports}
                  onToggleSelection={toggleReportSelection}
                  onOpenReport={openReportModal}
                  onDelete={handleDelete}
                  onExplainReport={handleExplainReport}
                  explanationLoading={explanationLoading}
                />
              </TabsContent>
            </Tabs>

            {/* Confirmation Dialog */}
            <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Confirm</DialogTitle>
                  <DialogDescription>
                    {confirmDialogMessage}
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex gap-2 sm:gap-2">
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button variant="destructive" onClick={confirmDelete}>
                    Confirm
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </motion.div>

        {/* Report Details Modal */}
        <Dialog open={isModalOpen} onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) {
            setShowExplanation(false);
            setExplanation(null);
          }
        }}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{showExplanation ? "Report Explanation" : "Report Details"}</DialogTitle>
              <DialogDescription>
                {showExplanation ? "AI-generated report explanation" : "Complete scan report details"}
              </DialogDescription>
            </DialogHeader>
            {showExplanation && explanation ? (
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Source</p>
                  <Badge variant="outline">
                    {explanation.source === "groq" ? "Groq" : explanation.source === "local_fallback" ? "Local Fallback" : "Local Guardrail"}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Explanation</p>
                  <div className="p-4 bg-muted rounded-lg text-sm whitespace-pre-wrap">
                    {explanation.explanation}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Recommended Action</p>
                  <div className="p-4 bg-primary/5 rounded-lg text-sm whitespace-pre-wrap">
                    {explanation.recommended_action}
                  </div>
                </div>
              </div>
            ) : (
              selectedReport && (
                <div className="space-y-6">
                  {"file_name" in selectedReport ? (
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">File Name</p>
                        <p className="font-medium">{selectedReport.file_name}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">File Extension</p>
                        <p className="font-medium">{selectedReport.file_extension}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">File Size</p>
                        <p className="font-medium">{formatFileSize(selectedReport.file_size)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">SHA256 Hash</p>
                        <p className="font-mono text-xs truncate">{selectedReport.sha256_hash}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">YARA Matches</p>
                        <p className="font-medium">
                          {Array.isArray(selectedReport.yara_matches) && selectedReport.yara_matches.length > 0 
                            ? selectedReport.yara_matches.map((m: any) => m.rule).join(", ")
                            : "No matches"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">VirusTotal Status</p>
                        <p className="font-medium">{selectedReport.virustotal_status}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">VirusTotal Malicious Count</p>
                        <p className="font-medium">{selectedReport.virustotal_malicious_count}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">AI Scanner Label</p>
                        <p className="font-medium capitalize">{selectedReport.ai_label}</p>
                      </div>
                      {selectedReport.ai_label !== "skipped" && selectedReport.ai_label !== "unavailable" && selectedReport.ai_label !== "unknown" && (
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">AI Confidence</p>
                          <p className="font-medium">{(selectedReport.ai_confidence * 100).toFixed(0)}%</p>
                        </div>
                      )}
                      {selectedReport.ai_note && (
                        <div className="space-y-1 md:col-span-2">
                          <p className="text-sm text-muted-foreground">AI Note</p>
                          <p className="font-medium text-sm">{selectedReport.ai_note}</p>
                        </div>
                      )}
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Risk Score</p>
                        <p className="font-medium">{selectedReport.risk_score.toFixed(1)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Final Verdict</p>
                        <p className="font-medium">{selectedReport.final_verdict}</p>
                      </div>
                      <div className="space-y-1 md:col-span-2">
                        <p className="text-sm text-muted-foreground">Created Time</p>
                        <p className="font-medium">{new Date(selectedReport.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-1 md:col-span-2">
                        <p className="text-sm text-muted-foreground">URL</p>
                        <p className="font-medium truncate">{selectedReport.url}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Domain</p>
                        <p className="font-medium">{selectedReport.domain}</p>
                      </div>
                      <div className="space-y-1 md:col-span-2">
                        <p className="text-sm text-muted-foreground">Local Indicators</p>
                        <p className="font-medium">
                          {selectedReport.local_indicators.length > 0 
                            ? selectedReport.local_indicators.join(", ")
                            : "No indicators"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">VirusTotal Status</p>
                        <p className="font-medium">{selectedReport.virustotal_status}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">VirusTotal Malicious Count</p>
                        <p className="font-medium">{selectedReport.virustotal_malicious_count}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">URL AI Label</p>
                        <p className="font-medium capitalize">{selectedReport.url_ai_label}</p>
                      </div>
                      {selectedReport.url_ai_note && (
                        <div className="space-y-1 md:col-span-2">
                          <p className="text-sm text-muted-foreground">URL AI Note</p>
                          <p className="font-medium text-sm">{selectedReport.url_ai_note}</p>
                        </div>
                      )}
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Risk Score</p>
                        <p className="font-medium">{selectedReport.risk_score.toFixed(1)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Final Verdict</p>
                        <p className="font-medium">{selectedReport.final_verdict}</p>
                      </div>
                      <div className="space-y-1 md:col-span-2">
                        <p className="text-sm text-muted-foreground">Created Time</p>
                        <p className="font-medium">{new Date(selectedReport.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                </div>
              )
            )}
            <div className="flex gap-2 justify-end">
              {selectedReport && !showExplanation && (
                <Button
                  onClick={() => handleExplainReport(selectedReport)}
                  disabled={explanationLoading}
                  className="gap-2"
                >
                  {explanationLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <MessageSquare className="h-4 w-4" />
                  )}
                  Explain Report
                </Button>
              )}
              {showExplanation && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowExplanation(false);
                    setExplanation(null);
                  }}
                >
                  Back to Details
                </Button>
              )}
              <DialogClose asChild>
                <Button variant="outline">Close</Button>
              </DialogClose>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}

interface ReportsTableProps {
  type: "file" | "url";
  data: FileScanReport[] | UrlScanReport[];
  selectedReports: number[];
  onToggleSelection: (idOrIds: number | number[]) => void;
  onOpenReport: (report: FileScanReport | UrlScanReport) => void;
  onDelete: (id: number) => void;
  onExplainReport: (report: FileScanReport | UrlScanReport) => void;
  explanationLoading: boolean;
}

function ReportsTable({
  type, data, selectedReports, onToggleSelection, onOpenReport, onDelete, onExplainReport, explanationLoading }: ReportsTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredData = useMemo(() => {
    return (data as any[]).filter((record) => {
      let matchesSearch = true;
      if (type === "file") {
        matchesSearch = (record as FileScanReport).file_name
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
      } else {
        matchesSearch = (record as UrlScanReport).url
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
      }

      const matchesStatus =
        statusFilter === "all" || record.final_verdict.includes(statusFilter);

      return matchesSearch && matchesStatus;
    });
  }, [data, searchQuery, statusFilter, type]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  if (data.length === 0) {
    return (
      <div className="border border-border rounded-lg p-12 text-center">
        <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">
          No {type === "file" ? "file" : "URL"} reports yet
        </h3>
        <p className="text-muted-foreground">
          Scan a {type === "file" ? "file" : "URL"} to see reports here
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={
              type === "file"
                ? "Search by file name..."
                : "Search by URL..."
            }
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by verdict" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Verdicts</SelectItem>
            <SelectItem value="Low">Low Risk</SelectItem>
            <SelectItem value="Medium">Medium Risk</SelectItem>
            <SelectItem value="High">High Risk</SelectItem>
            <SelectItem value="Critical">Critical Risk</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-12">
                <Checkbox
                  checked={filteredData.length > 0 && filteredData.every((record: any) => selectedReports.includes(record.id))}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      const allFilteredIds = filteredData.map((record: any) => record.id);
                      const newSelected = Array.from(new Set([...selectedReports, ...allFilteredIds]));
                      onToggleSelection(newSelected);
                    } else {
                      const filteredIds = new Set(filteredData.map((record: any) => record.id));
                      const newSelected = selectedReports.filter((id) => !filteredIds.has(id));
                      onToggleSelection(newSelected);
                    }
                  }}
                />
              </TableHead>
              <TableHead>
                {type === "file" ? "File Name" : "URL"}
              </TableHead>
              <TableHead className="hidden md:table-cell">
                {type === "file" ? "Extension" : "Domain"}
              </TableHead>
              <TableHead className="hidden md:table-cell">Risk Score</TableHead>
              <TableHead>Verdict</TableHead>
              <TableHead className="hidden md:table-cell">Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((record: any, index: number) => (
              <motion.tr
                key={record.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="border-b border-border hover:bg-muted/30 transition-colors"
              >
                <TableCell>
                  <Checkbox
                    checked={selectedReports.includes(record.id)}
                    onCheckedChange={() => onToggleSelection(record.id)}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {type === "file" ? (
                      <File className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Link2 className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="font-mono text-sm truncate max-w-[200px]">
                      {type === "file" ? record.file_name : record.url}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">
                  {type === "file" ? record.file_extension : record.domain}
                </TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">
                  {record.risk_score.toFixed(1)}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      record.final_verdict.includes("Low")
                        ? "outline"
                        : record.final_verdict.includes("Medium")
                        ? "secondary"
                        : "destructive"
                    }
                    className={
                      record.final_verdict.includes("Low")
                        ? "bg-success/10 text-success border-success/30"
                        : ""
                    }
                  >
                    {record.final_verdict.includes("Low") ||
                    record.final_verdict.includes("Medium") ? (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    ) : (
                      <AlertTriangle className="h-3 w-3 mr-1" />
                    )}
                    {record.final_verdict}
                  </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">
                  {new Date(record.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-1 justify-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onOpenReport(record)}
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onExplainReport(record)}
                      title="Explain Report"
                    >
                      {explanationLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <MessageSquare className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(record.id)}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-6">
        <p className="text-sm text-muted-foreground">
          Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
          {Math.min(currentPage * itemsPerPage, filteredData.length)} of{" "}
          {filteredData.length} results
        </p>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="icon"
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
