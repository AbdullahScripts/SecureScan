import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  Eye,
  Download,
  File,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ScanRecord {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  status: "safe" | "malware";
  confidence: number;
  scanDate: string;
}

// Generate mock data
const generateMockData = (): ScanRecord[] => {
  const fileTypes = ["exe", "dll", "pdf", "doc", "zip", "js", "py"];
  const data: ScanRecord[] = [];

  for (let i = 0; i < 50; i++) {
    const isMalware = Math.random() > 0.75;
    data.push({
      id: `scan-${i + 1}`,
      fileName: `file_${i + 1}.${fileTypes[Math.floor(Math.random() * fileTypes.length)]}`,
      fileSize: Math.floor(Math.random() * 10000) + 100,
      fileType: fileTypes[Math.floor(Math.random() * fileTypes.length)],
      status: isMalware ? "malware" : "safe",
      confidence: Math.random() * 0.3 + 0.7,
      scanDate: new Date(
        Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000
      ).toISOString(),
    });
  }

  return data.sort(
    (a, b) => new Date(b.scanDate).getTime() - new Date(a.scanDate).getTime()
  );
};

const mockData = generateMockData();

export default function History() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRecord, setSelectedRecord] = useState<ScanRecord | null>(null);
  const itemsPerPage = 10;

  const filteredData = useMemo(() => {
    return mockData.filter((record) => {
      const matchesSearch = record.fileName
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || record.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [searchQuery, statusFilter]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Scan History</h1>
            <p className="text-muted-foreground">
              View and manage all your previous file scans
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by file name..."
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
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="safe">Safe</SelectItem>
                <SelectItem value="malware">Malware</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>File Name</TableHead>
                  <TableHead className="hidden md:table-cell">Type</TableHead>
                  <TableHead className="hidden sm:table-cell">Size</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Confidence</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((record, index) => (
                  <motion.tr
                    key={record.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-border hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => setSelectedRecord(record)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <File className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono text-sm truncate max-w-[150px]">
                          {record.fileName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline" className="uppercase text-xs">
                        {record.fileType}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {(record.fileSize / 1024).toFixed(1)} KB
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={record.status === "safe" ? "outline" : "destructive"}
                        className={
                          record.status === "safe"
                            ? "bg-success/10 text-success border-success/30"
                            : ""
                        }
                      >
                        {record.status === "safe" ? (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        ) : (
                          <AlertTriangle className="h-3 w-3 mr-1" />
                        )}
                        {record.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {Math.round(record.confidence * 100)}%
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {new Date(record.scanDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRecord(record);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
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
          </div>
        </motion.div>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedRecord} onOpenChange={() => setSelectedRecord(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <File className="h-5 w-5 text-primary" />
              Scan Details
            </DialogTitle>
            <DialogDescription>
              Detailed information about this scan
            </DialogDescription>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge
                  variant={selectedRecord.status === "safe" ? "outline" : "destructive"}
                  className={
                    selectedRecord.status === "safe"
                      ? "bg-success/10 text-success border-success/30"
                      : ""
                  }
                >
                  {selectedRecord.status === "safe" ? (
                    <CheckCircle className="h-3 w-3 mr-1" />
                  ) : (
                    <AlertTriangle className="h-3 w-3 mr-1" />
                  )}
                  {selectedRecord.status}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">File Name</p>
                  <p className="font-mono text-sm">{selectedRecord.fileName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">File Type</p>
                  <p className="uppercase">{selectedRecord.fileType}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">File Size</p>
                  <p>{(selectedRecord.fileSize / 1024).toFixed(2)} KB</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Confidence</p>
                  <p>{Math.round(selectedRecord.confidence * 100)}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Scan Date</p>
                  <p>{new Date(selectedRecord.scanDate).toLocaleString()}</p>
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button className="flex-1" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download Report
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
