import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Zap, BarChart3, Lock, ArrowRight, CheckCircle, FileCheck, Shield, AlertTriangle, MessageSquare, Upload, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

const stats = [
  { value: "99.7%", label: "Detection Rate" },
  { value: "Multi-Layer", label: "Protection" },
  { value: "<2s", label: "Avg. Scan Time" },
  { value: "24/7", label: "Security" },
];

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

export default function Landing() {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden py-24 md:py-36">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.1),transparent_50%)]" />
        
        <motion.div
          animate={{ 
            x: [0, -20, 0],
            y: [0, 10, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl opacity-30" 
        />
        
        <motion.div
          animate={{ 
            x: [0, 20, 0],
            y: [0, -10, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent/10 rounded-full blur-3xl opacity-30" 
        />

        <div className="container relative mx-auto px-4">
          <div className="max-w-5xl mx-auto text-center">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div variants={itemVariants}>
                <Badge variant="outline" className="mb-6 gap-2 px-4 py-2">
                  <FileCheck className="h-4 w-4 text-primary" />
                  <span className="text-primary font-medium">AI-Powered File Analysis</span>
                </Badge>
              </motion.div>

              <motion.h1
                variants={itemVariants}
                className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6"
              >
                Protect Your Files with
                <span className="text-primary block mt-2">
                  <motion.span
                    animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                    style={{
                      backgroundImage: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--secondary)), hsl(var(--primary)))",
                      backgroundSize: "200% 100%",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    Intelligent Security
                  </motion.span>
                </span>
              </motion.h1>

              <motion.p
                variants={itemVariants}
                className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto"
              >
                Upload any file and get instant threat analysis powered by advanced machine learning.
                Detect threats and suspicious patterns with industry-leading accuracy.
              </motion.p>

              <motion.div
                variants={itemVariants}
                className="flex flex-col sm:flex-row gap-4 justify-center items-center"
              >
                <Link to="/scan">
                  <Button size="lg" className="gap-2 px-10 h-14 text-base shadow-lg hover:shadow-xl transition-all duration-300">
                    Start Scanning
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/features">
                  <Button size="lg" variant="outline" className="gap-2 px-10 h-14 text-base">
                    Learn More
                  </Button>
                </Link>
              </motion.div>

              <motion.div
                variants={itemVariants}
                className="flex flex-wrap items-center justify-center gap-8 mt-16"
              >
                {["Fast Scanning", "Free to use", "Secure & private"].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-5 w-5 text-success" />
                    <span>{item}</span>
                  </div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/30 border-y border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1, type: "spring", stiffness: 200 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.1, y: -5 }}
                className="text-center"
              >
                <div className="text-3xl md:text-5xl font-bold text-primary mb-2">
                  {stat.value}
                </div>
                <div className="text-sm md:text-base text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 md:py-32">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Why Choose SafeScan?
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
              Our platform combines cutting-edge AI with user-friendly design to deliver
              the best file analysis experience.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.08, type: "spring", stiffness: 150 }}
                viewport={{ once: true }}
                whileHover={{ y: -10, scale: 1.03 }}
                className="group"
              >
                <Card className="h-full shadow-sm hover:shadow-xl transition-all duration-300 border-border">
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

      {/* CTA Section */}
      <section className="py-24 bg-primary text-primary-foreground relative overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-40 -right-40 w-96 h-96 bg-primary-foreground/10 rounded-full blur-3xl" 
        />
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary-foreground/10 rounded-full blur-3xl" 
        />
        
        <div className="container mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, type: "spring", stiffness: 200 }}
            className="max-w-4xl mx-auto text-center"
          >
            <AlertTriangle className="h-16 w-16 mx-auto mb-6 opacity-90" />
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Ready to Secure Your Files?
            </h2>
            <p className="text-lg md:text-xl opacity-90 mb-10 max-w-2xl mx-auto">
              Join thousands of users who trust SafeScan for their security needs.
              Start scanning your files today for free.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/scan">
                <Button size="lg" variant="secondary" className="gap-2 px-10 h-14 text-base shadow-lg hover:shadow-xl transition-all duration-300">
                  Start Scanning Now
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link to="/signup">
                <Button size="lg" variant="outline" className="gap-2 px-10 h-14 text-base bg-transparent border-primary-foreground/20 hover:bg-primary-foreground/10">
                  Create Free Account
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ rotate: 10, scale: 1.1 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                className="p-2 bg-primary/10 rounded-lg"
              >
                <Shield className="h-6 w-6 text-primary" />
              </motion.div>
              <span className="font-bold text-xl">SafeScan</span>
            </div>
            <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
              <Link to="/features" className="hover:text-foreground transition-colors">Features</Link>
              <Link to="/about" className="hover:text-foreground transition-colors">About</Link>
              <Link to="/login" className="hover:text-foreground transition-colors">Login</Link>
            </div>
            <p className="text-sm text-muted-foreground">
              ┬⌐ 2026 SafeScan. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </Layout>
  );
}
