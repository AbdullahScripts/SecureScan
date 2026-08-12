import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileSearch,
  Link2,
  File,
  ArrowRight,
  MessageSquare,
  History,
} from "lucide-react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { getFileReports, getUrlReports, type FileScanReport, type UrlScanReport } from "@/services/api";

export default function Dashboard() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fileReports, setFileReports] = useState<FileScanReport[]>([]);
  const [urlReports, setUrlReports] = useState<UrlScanReport[]>([]);

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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reports");
    } finally {
      setLoading(false);
    }
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

  const stats = useMemo(() => {
    const totalScans = allReports.length;
    const fileScans = fileReports.length;
    const urlScans = urlReports.length;
    const highRiskItems = allReports.filter(
      (r) => r.final_verdict === "High Risk"
    ).length;
    const criticalItems = allReports.filter(
      (r) => r.final_verdict === "Critical Risk"
    ).length;
    const avgScanTime = "1.2s";

    return [
      {
        title: "Total Scans",
        value: totalScans.toString(),
        icon: FileSearch,
        color: "text-primary",
      },
      {
        title: "File Scans",
        value: fileScans.toString(),
        icon: File,
        color: "text-success",
      },
      {
        title: "URL Scans",
        value: urlScans.toString(),
        icon: Link2,
        color: "text-secondary",
      },
      {
        title: "High Risk",
        value: highRiskItems.toString(),
        icon: AlertTriangle,
        color: "text-warning",
      },
      {
        title: "Critical",
        value: criticalItems.toString(),
        icon: AlertTriangle,
        color: "text-destructive",
      },
      {
        title: "Avg Scan Time",
        value: avgScanTime,
        icon: Clock,
        color: "text-primary",
      },
    ];
  }, [allReports, fileReports, urlReports]);

  const weeklyScanData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date;
    });

    return last7Days.map((date) => {
      const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
      const fileScans = allReports.filter(
        (r) =>
          r.type === "file" &&
          new Date(r.created_at).toDateString() === date.toDateString()
      ).length;
      const urlScans = allReports.filter(
        (r) =>
          r.type === "url" &&
          new Date(r.created_at).toDateString() === date.toDateString()
      ).length;
      return { day: dayName, files: fileScans, urls: urlScans };
    });
  }, [allReports]);

  const verdictData = useMemo(() => {
    const counts = {
      "Low Risk": 0,
      "Medium Risk": 0,
      "High Risk": 0,
      "Critical Risk": 0,
    };

    allReports.forEach((report) => {
      if (report.final_verdict in counts) {
        counts[report.final_verdict as keyof typeof counts]++;
      }
    });

    const colors = {
      "Low Risk": "hsl(var(--success))",
      "Medium Risk": "hsl(var(--warning))",
      "High Risk": "hsl(var(--destructive))",
      "Critical Risk": "hsl(var(--destructive))",
    };

    return Object.entries(counts)
      .filter(([_, count]) => count > 0)
      .map(([name, value]) => ({ name, value, color: colors[name as keyof typeof colors] }));
  }, [allReports]);

  const recentHighRisk = useMemo(() => {
    return allReports
      .filter(
        (r) =>
          r.final_verdict === "High Risk" || r.final_verdict === "Critical Risk"
      )
      .slice(0, 5);
  }, [allReports]);

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Loading dashboard...</h2>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Failed to load dashboard</h2>
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
            <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
            <p className="text-muted-foreground">
              Monitor your security metrics and scanning activity
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3 mb-8">
            <Button onClick={() => navigate("/scan")} className="gap-2">
              <FileSearch className="h-4 w-4" />
              Scan File
            </Button>
            <Button onClick={() => navigate("/url-scan")} variant="outline" className="gap-2">
              <Link2 className="h-4 w-4" />
              Scan URL
            </Button>
            <Button onClick={() => navigate("/history")} variant="outline" className="gap-2">
              <History className="h-4 w-4" />
              View History
            </Button>
            <Button onClick={() => navigate("/chat")} variant="outline" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Ask Security Assistant
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          {stat.title}
                        </p>
                        <p className="text-2xl font-bold">{stat.value}</p>
                      </div>
                      <div className={`p-3 rounded-lg bg-muted ${stat.color}`}>
                        <stat.icon className="h-5 w-5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            {/* Weekly Scans Chart */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Weekly Scan Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={weeklyScanData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="day" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="files"
                          name="File Scans"
                          stroke="hsl(var(--success))"
                          strokeWidth={2}
                          dot={{ fill: "hsl(var(--success))" }}
                        />
                        <Line
                          type="monotone"
                          dataKey="urls"
                          name="URL Scans"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          dot={{ fill: "hsl(var(--primary))" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Detection Ratio Pie Chart */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Detection Ratio
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={verdictData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {verdictData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Recent High Risk Findings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-primary" />
                  Recent High Risk Findings
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentHighRisk.length === 0 ? (
                  <div className="p-12 text-center">
                    <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No high risk findings</h3>
                    <p className="text-muted-foreground">Great job! No recent high or critical risk items</p>
                  </div>
                ) : (
                  <>
                    <div className="border border-border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead>Target</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Risk Score</TableHead>
                            <TableHead>Verdict</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {recentHighRisk.map((report, index) => (
                            <TableRow
                              key={`${report.type}-${report.id}`}
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
                              <TableCell className="text-muted-foreground">
                                {report.type === "file" ? "File" : "URL"}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {report.risk_score.toFixed(1)}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    report.final_verdict.includes("High")
                                      ? "secondary"
                                      : "destructive"
                                  }
                                >
                                  {report.final_verdict.includes("High") ||
                                  report.final_verdict.includes("Medium") ? (
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                  ) : (
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                  )}
                                  {report.final_verdict}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {new Date(report.created_at).toLocaleDateString()}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => navigate("/history")}
                                  className="gap-1"
                                >
                                  View History
                                  <ArrowRight className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </Layout>
  );
}
