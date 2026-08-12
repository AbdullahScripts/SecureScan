// import { useCallback, useState } from "react";
// import { useDropzone } from "react-dropzone";
// import { motion, AnimatePresence } from "framer-motion";
// import { Upload, File, CheckCircle, AlertTriangle, Loader2, Shield, MessageSquare, FileText, RefreshCw } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Progress } from "@/components/ui/progress";
// import { useToast } from "@/hooks/use-toast";
// import { useNavigate } from "react-router-dom";
// import { scanFile, type FileScanReport, explainFileReport, formatFileSize } from "@/services/api";

// type ScanStatus = "idle" | "uploading" | "scanning" | "complete";

// export function FileUpload() {
//   const [file, setFile] = useState<File | null>(null);
//   const [status, setStatus] = useState<ScanStatus>("idle");
//   const [progress, setProgress] = useState(0);
//   const [scanReport, setScanReport] = useState<FileScanReport | null>(null);
//   const [explaining, setExplaining] = useState(false);
//   const [explanation, setExplanation] = useState<{ source: string; explanation: string; recommended_action: string } | null>(null);
//   const { toast } = useToast();
//   const navigate = useNavigate();

//   const simulateScan = useCallback(async (uploadedFile: File) => {
//     setStatus("uploading");
//     setProgress(0);
//     setScanReport(null);

//     try {
//       // Simulate upload progress
//       const uploadInterval = setInterval(() => {
//         setProgress((prev) => {
//           if (prev >= 100) {
//             clearInterval(uploadInterval);
//             return 100;
//           }
//           return prev + 20;
//         });
//       }, 100);

//       await new Promise((resolve) => setTimeout(resolve, 500));
//       clearInterval(uploadInterval);
//       setProgress(100);

//       setStatus("scanning");
//       setProgress(0);

//       const scanInterval = setInterval(() => {
//         setProgress((prev) => {
//           if (prev >= 80) {
//             clearInterval(scanInterval);
//             return 80;
//           }
//           return prev + 10;
//         });
//       }, 200);

//       const result = await scanFile(uploadedFile);

//       clearInterval(scanInterval);
//       setProgress(100);
//       setScanReport(result);

//       setStatus("complete");
//     } catch (error) {
//       console.error("Scan error:", error);
//       toast({
//         variant: "destructive",
//         title: "Scan failed",
//         description:
//           error instanceof Error ? error.message : "Failed to analyze file. Please try again.",
//       });
//       setStatus("idle");
//     }
//   }, [toast]);

//   const onDrop = useCallback(
//     (acceptedFiles: File[]) => {
//       if (acceptedFiles.length > 0) {
//         const uploadedFile = acceptedFiles[0];
//         setFile(uploadedFile);
//         simulateScan(uploadedFile);
//       }
//     },
//     [simulateScan]
//   );

//   const { getRootProps, getInputProps, isDragActive } = useDropzone({
//     onDrop,
//     multiple: false,
//     accept: {
//       "application/x-msdownload": [".exe"],
//       "application/x-dosexec": [".dll", ".com"],
//       "application/octet-stream": [".bin"],
//     },
//   });

//   const resetUpload = () => {
//     setFile(null);
//     setStatus("idle");
//     setProgress(0);
//     setExplanation(null);
//   };

//   const handleExplainReport = async () => {
//     if (!scanReport) return;
//     setExplaining(true);
//     try {
//       const result = await explainFileReport(scanReport.id);
//       setExplanation(result);
//     } catch (error) {
//       toast({
//         variant: "destructive",
//         title: "Failed to get explanation",
//         description: error instanceof Error ? error.message : "Could not generate report explanation.",
//       });
//     } finally {
//       setExplaining(false);
//     }
//   };

//   const statusConfig = {
//     idle: {
//       icon: Upload,
//       text: "Drop your file here or click to browse",
//       color: "text-muted-foreground",
//       bg: "bg-muted/50",
//     },
//     uploading: {
//       icon: Loader2,
//       text: "Uploading file...",
//       color: "text-primary",
//       bg: "bg-primary/5",
//     },
//     scanning: {
//       icon: Shield,
//       text: "Analyzing file for threats...",
//       color: "text-primary",
//       bg: "bg-primary/5",
//     },
//     complete: {
//       icon: CheckCircle,
//       text: "Scan complete!",
//       color: "text-primary",
//       bg: "bg-primary/5",
//     },
//   };

//   const config = statusConfig[status];
//   const StatusIcon = config.icon;

//   return (
//     <div className="w-full max-w-2xl mx-auto">
//       <AnimatePresence mode="wait">
//         <motion.div
//           key={status}
//           initial={{ opacity: 0, scale: 0.95 }}
//           animate={{ opacity: 1, scale: 1 }}
//           exit={{ opacity: 0, scale: 0.95 }}
//           transition={{ duration: 0.3 }}
//         >
//           <div
//             {...(status === "idle" ? getRootProps() : {})}
//             className={`
//               relative overflow-hidden rounded-xl border-2 border-dashed p-12
//               transition-all duration-300 cursor-pointer
//               ${isDragActive ? "border-primary bg-primary/5 scale-[1.02]" : "border-border"}
//               ${config.bg}
//             `}
//           >
//             {status === "idle" && <input {...getInputProps()} />}

//             <div className="flex flex-col items-center gap-6">
//               <motion.div
//                 animate={
//                   status === "uploading" || status === "scanning"
//                     ? { rotate: 360 }
//                     : status === "idle"
//                     ? { y: [0, -8, 0] }
//                     : {}
//                 }
//                 transition={
//                   status === "uploading" || status === "scanning"
//                     ? { repeat: Infinity, duration: 1, ease: "linear" }
//                     : { repeat: Infinity, duration: 2, ease: "easeInOut" }
//                 }
//                 className={`p-4 rounded-full ${
//                   status === "complete"
//                     ? scanReport?.final_verdict.includes("Low")
//                       ? "bg-success/20"
//                       : scanReport?.final_verdict.includes("Critical") || scanReport?.final_verdict.includes("High")
//                       ? "bg-destructive/20"
//                       : "bg-primary/10"
//                     : "bg-primary/10"
//                 }`}
//               >
//                 <StatusIcon
//                   className={`h-12 w-12 ${config.color} ${
//                     status === "uploading" || status === "scanning" ? "animate-spin" : ""
//                   }`}
//                 />
//               </motion.div>

//               <div className="text-center">
//                 <p className={`text-lg font-medium ${config.color}`}>{config.text}</p>
//                 {file && (
//                   <div className="flex items-center justify-center gap-2 mt-2 text-sm text-muted-foreground">
//                     <File className="h-4 w-4" />
//                     <span>{file.name}</span>
//                     <span className="text-xs">
//                       ({formatFileSize(file.size)})
//                     </span>
//                   </div>
//                 )}
//               </div>

//               {(status === "uploading" || status === "scanning") && (
//                 <div className="w-full max-w-xs">
//                   <Progress value={progress} className="h-2" />
//                   <p className="text-center text-sm text-muted-foreground mt-2">
//                     {progress}%
//                   </p>
//                 </div>
//               )}

//               {status === "complete" && (
//                 <div className="flex flex-wrap justify-center gap-3 w-full">
//                   <Button onClick={handleExplainReport} variant="default" disabled={explaining}>
//                     <MessageSquare className="h-4 w-4 mr-2" />
//                     {explaining ? "Explaining..." : "Explain Report"}
//                   </Button>
//                   <Button onClick={() => navigate("/reports")} variant="outline">
//                     <FileText className="h-4 w-4 mr-2" />
//                     View Saved Report
//                   </Button>
//                   <Button onClick={resetUpload} variant="outline">
//                     <RefreshCw className="h-4 w-4 mr-2" />
//                     Scan Another File
//                   </Button>
//                 </div>
//               )}
//             </div>

//             {/* Animated background effect */}
//             {(status === "uploading" || status === "scanning") && (
//               <motion.div
//                 className="absolute inset-0 pointer-events-none"
//                 initial={{ opacity: 0 }}
//                 animate={{ opacity: 1 }}
//               >
//                 <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent" />
//                 <motion.div
//                   className="absolute bottom-0 left-0 right-0 h-1 bg-primary/30"
//                   animate={{ scaleX: [0, 1, 0], x: ["-100%", "0%", "100%"] }}
//                   transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
//                 />
//               </motion.div>
//             )}
//           </div>

//           {/* Scan Report Details */}
//           {scanReport && status === "complete" && (
//             <motion.div
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: 0.3 }}
//               className="mt-8 w-full max-w-2xl mx-auto"
//             >
//               <div className="border border-border rounded-xl p-6 bg-card">
//                 <div className="flex items-center justify-between mb-4">
//                   <h3 className="text-xl font-bold">Scan Report</h3>
//                   <p className="text-xs text-muted-foreground">
//                     This report has been saved automatically to your scan history.
//                   </p>
//                 </div>
//                 <div className="grid md:grid-cols-2 gap-4">
//                   <div className="space-y-1">
//                     <p className="text-sm text-muted-foreground">File Name</p>
//                     <p className="font-medium truncate">{scanReport.file_name}</p>
//                   </div>
//                   <div className="space-y-1">
//                     <p className="text-sm text-muted-foreground">SHA256 Hash</p>
//                     <p className="font-mono text-xs truncate">{scanReport.sha256_hash}</p>
//                   </div>
//                   <div className="space-y-1">
//                     <p className="text-sm text-muted-foreground">File Size</p>
//                     <p className="font-medium">{formatFileSize(scanReport.file_size)}</p>
//                   </div>
//                   <div className="space-y-1">
//                     <p className="text-sm text-muted-foreground">Final Verdict</p>
//                     <p className="font-medium">
//                       {scanReport.final_verdict === "Low Risk" && scanReport.ai_label === "suspicious"
//                         ? "No major risk detected, but review advisory AI signal."
//                         : scanReport.final_verdict === "Low Risk"
//                         ? "No major risk detected"
//                         : scanReport.final_verdict === "Medium Risk"
//                         ? "Suspicious indicators found"
//                         : scanReport.final_verdict === "High Risk"
//                         ? "High risk detected"
//                         : scanReport.final_verdict === "Critical Risk"
//                         ? "Critical threat indicators detected"
//                         : scanReport.final_verdict}
//                     </p>
//                   </div>
//                 </div>

//                 {/* Evidence Breakdown Section */}
//                 <div className="mt-6 pt-6 border-t border-border">
//                   <h4 className="font-semibold mb-3">Evidence Breakdown</h4>
//                   <p className="text-sm text-muted-foreground mb-4">
//                     Final verdict is based on combined YARA, VirusTotal, and AI signals.
//                   </p>
//                   <div className="grid md:grid-cols-2 gap-4">
//                     <div className="space-y-1">
//                       <p className="text-sm text-muted-foreground">YARA Matches</p>
//                       <p className="font-medium">
//                         {Array.isArray(scanReport.yara_matches) && scanReport.yara_matches.length > 0 
//                           ? scanReport.yara_matches.map((m: any) => m.rule).join(", ")
//                           : "No matches"}
//                       </p>
//                     </div>
//                     <div className="space-y-1">
//                       <p className="text-sm text-muted-foreground">VirusTotal Status</p>
//                       <p className="font-medium">{scanReport.virustotal_status}</p>
//                     </div>
//                     <div className="space-y-1">
//                       <p className="text-sm text-muted-foreground">VirusTotal Malicious Count</p>
//                       <p className="font-medium">{scanReport.virustotal_malicious_count}</p>
//                     </div>
//                     <div className="space-y-1">
//                       <p className="text-sm text-muted-foreground">AI Scanner</p>
//                       <p className="font-medium capitalize">{scanReport.ai_label}</p>
//                     </div>
//                     {scanReport.ai_label !== "skipped" && scanReport.ai_label !== "unavailable" && scanReport.ai_label !== "unknown" && (
//                       <div className="space-y-1">
//                         <p className="text-sm text-muted-foreground">AI Confidence</p>
//                         <p className="font-medium">{(scanReport.ai_confidence * 100).toFixed(0)}%</p>
//                       </div>
//                     )}
//                     {scanReport.ai_note && (
//                       <div className="space-y-1 md:col-span-2">
//                         <p className="text-sm text-muted-foreground">AI Note</p>
//                         <p className="font-medium text-sm">{scanReport.ai_note}</p>
//                       </div>
//                     )}
//                     <div className="space-y-1">
//                       <p className="text-sm text-muted-foreground">Risk Score</p>
//                       <p className="font-medium">{scanReport.risk_score}</p>
//                     </div>
//                     <div className="space-y-1">
//                       <p className="text-sm text-muted-foreground">Final Verdict</p>
//                       <p className="font-medium">{scanReport.final_verdict}</p>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Explanation Section */}
//                 {explanation && (
//                   <div className="mt-6 pt-6 border-t border-border">
//                     <h4 className="font-semibold mb-3">Report Explanation</h4>
//                     <div className="space-y-3">
//                       <div>
//                         <p className="text-sm text-muted-foreground mb-1">Explanation</p>
//                         <p className="text-sm">{explanation.explanation}</p>
//                       </div>
//                       <div>
//                         <p className="text-sm text-muted-foreground mb-1">Recommended Action</p>
//                         <p className="text-sm">{explanation.recommended_action}</p>
//                       </div>
//                       <div>
//                         <p className="text-sm text-muted-foreground mb-1">Source</p>
//                         <p className="text-xs text-muted-foreground">{explanation.source}</p>
//                       </div>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             </motion.div>
//           )}
//         </motion.div>
//       </AnimatePresence>
//     </div>
//   );
// }
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, File, CheckCircle, AlertTriangle, Loader2, Shield, MessageSquare, FileText, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { scanFile, type FileScanReport, explainFileReport, formatFileSize } from "@/services/api";

type ScanStatus = "idle" | "uploading" | "scanning" | "complete";

export function FileUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<ScanStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [scanReport, setScanReport] = useState<FileScanReport | null>(null);
  const [explaining, setExplaining] = useState(false);
  const [explanation, setExplanation] = useState<{ source: string; explanation: string; recommended_action: string } | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const simulateScan = useCallback(async (uploadedFile: File) => {
    setStatus("uploading");
    setProgress(0);
    setScanReport(null);

    try {
      const uploadInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(uploadInterval);
            return 100;
          }
          return prev + 20;
        });
      }, 100);

      await new Promise((resolve) => setTimeout(resolve, 500));
      clearInterval(uploadInterval);
      setProgress(100);

      setStatus("scanning");
      setProgress(0);

      const scanInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 80) {
            clearInterval(scanInterval);
            return 80;
          }
          return prev + 10;
        });
      }, 200);

      const result = await scanFile(uploadedFile);

      clearInterval(scanInterval);
      setProgress(100);
      setScanReport(result);

      setStatus("complete");
    } catch (error) {
      console.error("Scan error:", error);
      toast({
        variant: "destructive",
        title: "Scan failed",
        description:
          error instanceof Error ? error.message : "Failed to analyze file. Please try again.",
      });
      setStatus("idle");
    }
  }, [toast]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const uploadedFile = acceptedFiles[0];
        setFile(uploadedFile);
        simulateScan(uploadedFile);
      }
    },
    [simulateScan]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      "application/x-msdownload": [".exe"],
      "application/x-dosexec": [".dll", ".com"],
      "application/octet-stream": [".bin"],
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
  });

  const resetUpload = () => {
    setFile(null);
    setStatus("idle");
    setProgress(0);
    setExplanation(null);
  };

  const handleExplainReport = async () => {
    if (!scanReport) return;
    setExplaining(true);
    try {
      const result = await explainFileReport(scanReport.id);
      setExplanation(result);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to get explanation",
        description: error instanceof Error ? error.message : "Could not generate report explanation.",
      });
    } finally {
      setExplaining(false);
    }
  };

  const statusConfig = {
    idle: {
      icon: Upload,
      text: "Drop your file here or click to browse",
      color: "text-muted-foreground",
      bg: "bg-muted/50",
    },
    uploading: {
      icon: Loader2,
      text: "Uploading file...",
      color: "text-primary",
      bg: "bg-primary/5",
    },
    scanning: {
      icon: Shield,
      text: "Analyzing file for threats...",
      color: "text-primary",
      bg: "bg-primary/5",
    },
    complete: {
      icon: CheckCircle,
      text: "Scan complete!",
      color: "text-primary",
      bg: "bg-primary/5",
    },
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <AnimatePresence mode="wait">
        <motion.div
          key={status}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
        >
          <div
            {...(status === "idle" ? getRootProps() : {})}
            className={`
              relative overflow-hidden rounded-xl border-2 border-dashed p-12
              transition-all duration-300 cursor-pointer
              ${isDragActive ? "border-primary bg-primary/5 scale-[1.02]" : "border-border"}
              ${config.bg}
            `}
          >
            {status === "idle" && <input {...getInputProps()} />}

            <div className="flex flex-col items-center gap-6">
              <motion.div
                animate={
                  status === "uploading" || status === "scanning"
                    ? { rotate: 360 }
                    : status === "idle"
                    ? { y: [0, -8, 0] }
                    : {}
                }
                transition={
                  status === "uploading" || status === "scanning"
                    ? { repeat: Infinity, duration: 1, ease: "linear" }
                    : { repeat: Infinity, duration: 2, ease: "easeInOut" }
                }
                className={`p-4 rounded-full ${
                  status === "complete"
                    ? scanReport?.final_verdict.includes("Low")
                      ? "bg-success/20"
                      : scanReport?.final_verdict.includes("Critical") || scanReport?.final_verdict.includes("High")
                      ? "bg-destructive/20"
                      : "bg-primary/10"
                    : "bg-primary/10"
                }`}
              >
                <StatusIcon
                  className={`h-12 w-12 ${config.color} ${
                    status === "uploading" || status === "scanning" ? "animate-spin" : ""
                  }`}
                />
              </motion.div>

              <div className="text-center">
                <p className={`text-lg font-medium ${config.color}`}>{config.text}</p>
                {file && (
                  <div className="flex items-center justify-center gap-2 mt-2 text-sm text-muted-foreground">
                    <File className="h-4 w-4" />
                    <span>{file.name}</span>
                    <span className="text-xs">
                      ({formatFileSize(file.size)})
                    </span>
                  </div>
                )}
              </div>

              {(status === "uploading" || status === "scanning") && (
                <div className="w-full max-w-xs">
                  <Progress value={progress} className="h-2" />
                  <p className="text-center text-sm text-muted-foreground mt-2">
                    {progress}%
                  </p>
                </div>
              )}

              {status === "complete" && (
                <div className="flex flex-wrap justify-center gap-3 w-full">
                  <Button onClick={handleExplainReport} variant="default" disabled={explaining}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    {explaining ? "Explaining..." : "Explain Report"}
                  </Button>
                  <Button onClick={() => navigate("/reports")} variant="outline">
                    <FileText className="h-4 w-4 mr-2" />
                    View Saved Report
                  </Button>
                  <Button onClick={resetUpload} variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Scan Another File
                  </Button>
                </div>
              )}
            </div>

            {(status === "uploading" || status === "scanning") && (
              <motion.div
                className="absolute inset-0 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent" />
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-1 bg-primary/30"
                  animate={{ scaleX: [0, 1, 0], x: ["-100%", "0%", "100%"] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                />
              </motion.div>
            )}
          </div>

          {scanReport && status === "complete" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-8 w-full max-w-2xl mx-auto"
            >
              <div className="border border-border rounded-xl p-6 bg-card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold">Scan Report</h3>
                  <p className="text-xs text-muted-foreground">
                    This report has been saved automatically to your scan history.
                  </p>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">File Name</p>
                    <p className="font-medium truncate">{scanReport.file_name}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">SHA256 Hash</p>
                    <p className="font-mono text-xs truncate">{scanReport.sha256_hash}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">File Size</p>
                    <p className="font-medium">{formatFileSize(scanReport.file_size)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Final Verdict</p>
                    <p className="font-medium">
                      {scanReport.final_verdict === "Low Risk" && scanReport.ai_label === "suspicious"
                        ? "No major risk detected, but review advisory AI signal."
                        : scanReport.final_verdict === "Low Risk"
                        ? "No major risk detected"
                        : scanReport.final_verdict === "Medium Risk"
                        ? "Suspicious indicators found"
                        : scanReport.final_verdict === "High Risk"
                        ? "High risk detected"
                        : scanReport.final_verdict === "Critical Risk"
                        ? "Critical threat indicators detected"
                        : scanReport.final_verdict}
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-border">
                  <h4 className="font-semibold mb-3">Evidence Breakdown</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Final verdict is based on combined YARA, VirusTotal, and AI signals.
                  </p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">YARA Matches</p>
                      <p className="font-medium">
                        {Array.isArray(scanReport.yara_matches) && scanReport.yara_matches.length > 0 
                          ? scanReport.yara_matches.map((m: any) => m.rule).join(", ")
                          : "No matches"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">VirusTotal Status</p>
                      <p className="font-medium">{scanReport.virustotal_status}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">VirusTotal Malicious Count</p>
                      <p className="font-medium">{scanReport.virustotal_malicious_count}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">AI Scanner</p>
                      <p className="font-medium capitalize">{scanReport.ai_label}</p>
                    </div>
                    {scanReport.ai_label !== "skipped" && scanReport.ai_label !== "unavailable" && scanReport.ai_label !== "unknown" && (
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">AI Confidence</p>
                        <p className="font-medium">{(scanReport.ai_confidence * 100).toFixed(0)}%</p>
                      </div>
                    )}
                    {scanReport.ai_note && (
                      <div className="space-y-1 md:col-span-2">
                        <p className="text-sm text-muted-foreground">AI Note</p>
                        <p className="font-medium text-sm">{scanReport.ai_note}</p>
                      </div>
                    )}
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Risk Score</p>
                      <p className="font-medium">{scanReport.risk_score}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Final Verdict</p>
                      <p className="font-medium">{scanReport.final_verdict}</p>
                    </div>
                  </div>
                </div>

                {explanation && (
                  <div className="mt-6 pt-6 border-t border-border">
                    <h4 className="font-semibold mb-3">Report Explanation</h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Explanation</p>
                        <p className="text-sm">{explanation.explanation}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Recommended Action</p>
                        <p className="text-sm">{explanation.recommended_action}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Source</p>
                        <p className="text-xs text-muted-foreground">{explanation.source}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}