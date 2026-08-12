import { motion } from "framer-motion";
import { FileCheck, Info } from "lucide-react";
import { Layout } from "@/components/Layout";
import { FileUpload } from "@/components/FileUpload";

export default function Scan() {
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
              <FileCheck className="h-4 w-4" />
              AI-Powered Scanner
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Scan Your File for Threats
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Upload executable style files for static malware analysis.
            </p>
          </div>

          {/* File Upload */}
          <FileUpload />

          {/* Info Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid md:grid-cols-3 gap-4 mt-12"
          >
            {[
                {
                  title: "Supported Files",
                  description: "EXE, DLL, BIN, COM executable style files. For BIN and COM files, AI analysis runs only when PE structure is detected.",
                },
                {
                  title: "Max File Size",
                  description: "Up to 50MB per file for free accounts",
                },
                {
                  title: "Privacy First",
                  description: "Files are never executed; static analysis only",
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
