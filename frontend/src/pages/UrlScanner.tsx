import { useState } from "react";
import { motion } from "framer-motion";
import { Link2, Info, CheckCircle, AlertTriangle } from "lucide-react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { scanUrl, type UrlScanReport } from "@/services/api";

export default function UrlScanner() {
  const [url, setUrl] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<UrlScanReport | null>(null);
  const { toast } = useToast();

  const handleScan = async () => {
    if (!url.trim()) return;
    setIsScanning(true);
    setScanResult(null);

    try {
      const result = await scanUrl(url);
      setScanResult(result);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Scan failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
      });
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Link2 className="h-4 w-4" />
              URL Security Scanner
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Scan URLs for Threats
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Enter any URL to check for suspicious indicators and potential security threats.
            </p>
          </div>

          {/* URL Input Section */}
          <div className="bg-card rounded-xl border border-border p-6 mb-8">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="url">URL to Scan</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !isScanning) {
                      handleScan();
                    }
                  }}
                />
              </div>
              <Button onClick={handleScan} disabled={isScanning} className="w-full">
                {isScanning ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    Scanning...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Link2 className="h-4 w-4" />
                    Scan URL
                  </div>
                )}
              </Button>
            </div>
          </div>

          {/* Scan Result */}
          {scanResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Scan Result</CardTitle>
                    <Badge
                      variant={
                        scanResult.final_verdict.includes("Low")
                          ? "default"
                          : scanResult.final_verdict.includes("Medium")
                          ? "secondary"
                          : scanResult.final_verdict.includes("High")
                          ? "destructive"
                          : "destructive"
                      }
                    >
                      {scanResult.final_verdict}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>URL</Label>
                      <p className="text-sm text-muted-foreground break-all">{scanResult.url}</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Domain</Label>
                      <p className="text-sm text-muted-foreground">{scanResult.domain}</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Local Indicators</Label>
                      <div className="flex flex-wrap gap-2">
                        {scanResult.local_indicators.map((indicator) => (
                          <Badge key={indicator} variant="outline">
                            {indicator.replace("suspicious_keyword_", "")}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>VirusTotal Status</Label>
                      <p className="text-sm text-muted-foreground">{scanResult.virustotal_status}</p>
                      <p className="text-xs text-muted-foreground">
                        Malicious count: {scanResult.virustotal_malicious_count}
                      </p>
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label>URL AI Note</Label>
                      <p className="text-sm text-muted-foreground">{scanResult.url_ai_note}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-4 border-t border-border">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                      <AlertTriangle className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">Risk Score</span>
                        <span className="text-sm font-bold">{scanResult.risk_score}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-primary"
                          style={{ width: `${Math.min(scanResult.risk_score, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Info Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid md:grid-cols-3 gap-4 mt-12"
          >
            {[
              {
                title: "Local Checks",
                description: "Suspicious keywords, URL length, subdomain count, and more",
              },
              {
                title: "VirusTotal",
                description: "Check URLs against multiple antivirus engines",
              },
              {
                title: "Privacy First",
                description: "URLs are processed locally, no file uploads",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg"
              >
                <Info className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-sm">{item.title}</h3>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </Layout>
  );
}
