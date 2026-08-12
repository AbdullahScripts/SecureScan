import { motion } from "framer-motion";
import { ShieldCheck, CheckCircle, FileCheck, Globe, Zap, Shield } from "lucide-react";
import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const whatWeOffer = [
  { icon: FileCheck, text: "AI-powered file analysis" },
  { icon: Globe, text: "URL scanning with VirusTotal intelligence" },
  { icon: Zap, text: "Fast scanning with real-time results" },
  { icon: Shield, text: "Risk scoring and clear verdicts" },
  { icon: CheckCircle, text: "Detailed scan reports" },
  { icon: CheckCircle, text: "AI security assistant" },
];

export default function About() {
  return (
    <Layout>
      <section className="py-24 md:py-36 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl opacity-30" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent/10 rounded-full blur-3xl opacity-30" />

        <div className="container relative mx-auto px-4">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-4xl mx-auto"
          >
            <motion.div variants={itemVariants} className="text-center mb-16">
              <Badge variant="outline" className="mb-6 gap-2 px-4 py-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span className="text-primary font-medium">Built for Security</span>
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">About SafeScan</h1>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="shadow-lg border-border overflow-hidden">
                <CardContent className="pt-10">
                  <p className="text-xl md:text-2xl mb-8 leading-relaxed">
                    SafeScan is a modern cybersecurity platform designed to make advanced malware detection
                    accessible to everyone—from individual users to small teams.
                  </p>

                  <h2 className="text-2xl md:text-3xl font-bold mb-6">Our Mission</h2>
                  <p className="text-muted-foreground text-lg mb-10 leading-relaxed">
                    We believe that everyone deserves access to powerful security tools without complicated
                    setups or expensive enterprise licenses. SafeScan combines cutting-edge machine learning
                    with a clean, user-friendly interface to help you protect your digital life.
                  </p>

                  <h2 className="text-2xl md:text-3xl font-bold mb-6">What We Offer</h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    {whatWeOffer.map((item, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.08 }}
                        viewport={{ once: true }}
                        className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg border border-border"
                      >
                        <item.icon className="h-5 w-5 text-primary shrink-0" />
                        <span className="text-base">{item.text}</span>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}
