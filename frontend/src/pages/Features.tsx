import { motion } from "framer-motion";
import { FileCheck, Link2, BarChart3, FileText, MessageSquare, Shield, Zap, Lock, Upload, Globe } from "lucide-react";
import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: FileCheck,
    title: "Advanced AI Detection",
    description: "Powered by MalConv and YARA rules for accurate file analysis.",
  },
  {
    icon: Globe,
    title: "URL Scanner",
    description: "Scan URLs for phishing, malware, and other security threats.",
  },
  {
    icon: Zap,
    title: "Fast Scanning",
    description: "Get results in under 2 seconds with our optimized scanning engine.",
  },
  {
    icon: BarChart3,
    title: "Detailed Reports",
    description: "Comprehensive analysis with explainable AI and confidence scores.",
  },
  {
    icon: Lock,
    title: "Secure & Private",
    description: "Your files stay private and are automatically deleted after scanning.",
  },
  {
    icon: Shield,
    title: "VirusTotal Integration",
    description: "Leverage VirusTotal threat intelligence for deeper analysis.",
  },
  {
    icon: MessageSquare,
    title: "Security Assistant",
    description: "Get AI-powered security advice and threat explanations.",
  },
  {
    icon: Upload,
    title: "Easy to Use",
    description: "Simple drag-and-drop interface for quick file scanning.",
  },
];

export default function Features() {
  return (
    <Layout>
      <section className="py-24 md:py-32">
        <div className="container relative mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">SafeScan Features</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful security tools designed for everyone—from individuals to small teams.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.08, type: "spring", stiffness: 150 }}
                viewport={{ once: true }}
                whileHover={{ y: -10, scale: 1.03 }}
                className="group"
              >
                <Card className="h-full shadow-sm hover:shadow-lg transition-all duration-300 border-border">
                  <CardContent className="pt-8">
                    <motion.div
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.5 }}
                      className="p-4 bg-primary/10 rounded-xl w-fit mb-6 group-hover:bg-primary/20 transition-colors"
                    >
                      <feature.icon className="h-7 w-7 text-primary" />
                    </motion.div>
                    <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
