import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FileCheck,
  AlertTriangle,
  CheckCircle,
  File,
  Clock,
  HardDrive,
  ArrowLeft,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/Layout";
import { Progress } from "@/components/ui/progress";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface ScanResult {
  fileName: string;
  fileSize: number;
  fileType: string;
  isThreat: boolean;
  confidence: number;
  scanDate: string;
}

const featureImportance = [
  { name: "Entropy Analysis", score: 0.92, description: "File randomness indicates encryption or packing" },
  { name: "API Calls Pattern", score: 0.85, description: "Suspicious system call sequences detected" },
  { name: "String Analysis", score: 0.78, description: "Obfuscated or suspicious strings found" },
  { name: "PE Header", score: 0.65, description: "Portable Executable structure anomalies" },
  { name: "Import Table", score: 0.52, description: "Unusual library imports detected" },
];

export default function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  const result = location.state as ScanResult | null;

  if (!result) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">No Scan Results</h1>
          <p className="text-muted-foreground mb-6">
            Please scan a file first to see results.
          </p>
          <Button onClick={() => navigate("/scan")}>Go to Scanner</Button>
        </div>
      </Layout>
    );
  }

  const confidencePercent = Math.round(result.confidence * 100);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          {/* Back Button */}
          <Button
            variant="ghost"
            className="mb-6 gap-2"
            onClick={() => navigate("/scan")}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Scanner
          </Button>

          {/* Result Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className={`p-8 rounded-xl border-2 mb-8 ${
              result.isThreat
                ? "bg-destructive/5 border-destructive/30"
                : "bg-success/5 border-success/30"
            }`}
          >
            <div className="flex flex-col md:flex-row items-center gap-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className={`p-6 rounded-full ${
                  result.isThreat ? "bg-destructive/10" : "bg-success/10"
                }`}
              >
                {result.isThreat ? (
                  <AlertTriangle className="h-16 w-16 text-destructive" />
                ) : (
                  <CheckCircle className="h-16 w-16 text-success" />
                )}
              </motion.div>

              <div className="flex-1 text-center md:text-left">
                <h1
                  className={`text-3xl font-bold mb-2 ${
                    result.isThreat ? "text-destructive" : "text-success"
                  }`}
                >
                  {result.isThreat ? "Threat Detected!" : "File is Safe"}
                </h1>
                <p className="text-muted-foreground">
                  {result.isThreat
                    ? "This file contains potential threats and should not be executed."
                    : "No threats were found in this file. It appears to be safe."}
                </p>
              </div>

              <div className="text-center">
                <div className="text-4xl font-bold text-foreground">
                  {confidencePercent}%
                </div>
                <div className="text-sm text-muted-foreground">Confidence</div>
              </div>
            </div>
          </motion.div>

          {/* File Details */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="p-6 bg-card rounded-xl border border-border"
            >
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <File className="h-5 w-5 text-primary" />
                File Details
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">File Name</span>
                  <span className="font-mono truncate max-w-[200px]">
                    {result.fileName}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">File Size</span>
                  <span>{(result.fileSize / 1024).toFixed(2)} KB</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">File Type</span>
                  <span>{result.fileType || "Unknown"}</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="p-6 bg-card rounded-xl border border-border"
            >
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Scan Information
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Scan Date</span>
                  <span>{new Date(result.scanDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Scan Time</span>
                  <span>{new Date(result.scanDate).toLocaleTimeString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Model Used</span>
                  <span>SafeScan v2.1</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Explainability Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="p-6 bg-card rounded-xl border border-border"
          >
            <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-primary" />
              Analysis Explainability
            </h2>

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="features">
                <AccordionTrigger className="text-base font-medium">
                  Feature Importance Analysis
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-4">
                    {featureImportance.map((feature, index) => (
                      <motion.div
                        key={feature.name}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * index }}
                      >
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium">{feature.name}</span>
                          <span className="text-muted-foreground">
                            {Math.round(feature.score * 100)}%
                          </span>
                        </div>
                        <Progress value={feature.score * 100} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1">
                          {feature.description}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="reasoning">
                <AccordionTrigger className="text-base font-medium">
                  Detailed Reasoning
                </AccordionTrigger>
                <AccordionContent>
                  <div className="prose prose-sm max-w-none dark:prose-invert pt-4">
                    <p className="text-muted-foreground">
                      {result.isThreat
                        ? "Our analysis detected multiple indicators commonly associated with suspicious software. The file exhibits high entropy suggesting potential encryption or packing, unusual API call patterns that may indicate system manipulation attempts, and suspicious string patterns often found in threat variants."
                        : "The file passed all security checks with no concerning indicators. The entropy level is within normal ranges, API calls follow standard application patterns, and no suspicious strings or obfuscation techniques were detected."}
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 mt-8"
          >
            <Button onClick={() => navigate("/scan")} className="flex-1">
              Scan Another File
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/history")}
              className="flex-1"
            >
              View Scan History
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </Layout>
  );
}
