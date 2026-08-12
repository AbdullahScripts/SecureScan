import { motion } from "framer-motion";
import {
  User,
  Mail,
  Shield,
  Lock,
  History,
  Bell,
  Edit,
  LogOut,
} from "lucide-react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";

const recentActivity = [
  {
    id: 1,
    action: "File scan completed",
    details: "test_sample.bin",
    time: "2 minutes ago",
    status: "success",
  },
  {
    id: 2,
    action: "URL scan completed",
    details: "example.com",
    time: "15 minutes ago",
    status: "success",
  },
  {
    id: 3,
    action: "Password changed",
    details: "Account security updated",
    time: "1 day ago",
    status: "info",
  },
  {
    id: 4,
    action: "Login from new device",
    details: "Chrome on Windows",
    time: "2 days ago",
    status: "warning",
  },
];

export default function Account() {
  const { user, logout } = useAuth();

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Account</h1>
            <p className="text-muted-foreground">
              Manage your profile and security settings
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Profile Card */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <User className="h-12 w-12 text-primary" />
                      </div>
                      <h2 className="text-xl font-bold mb-1">
                        {user?.full_name || "User"}
                      </h2>
                      <p className="text-muted-foreground mb-4">
                        {user?.email || "user@example.com"}
                      </p>
                      <Badge variant="outline" className="mb-4">
                        Free Plan
                      </Badge>
                      <Button className="w-full gap-2">
                        <Edit className="h-4 w-4" />
                        Edit Profile
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Account Details & Settings */}
            <div className="lg:col-span-2 space-y-6">
              {/* Account Details */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5 text-primary" />
                      Account Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Full Name</p>
                        <p className="font-medium">{user?.full_name || "User"}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {user?.email || "user@example.com"}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Member Since</p>
                        <p className="font-medium">May 2026</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Account Status</p>
                        <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                          Active
                        </Badge>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex justify-end">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Update Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Security Settings */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" />
                      Security Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-primary/10">
                          <Lock className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium">Password</h3>
                          <p className="text-sm text-muted-foreground">
                            Last changed 1 day ago
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Change
                      </Button>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-primary/10">
                          <Bell className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium">Security Notifications</h3>
                          <p className="text-sm text-muted-foreground">
                            Get alerts about suspicious activity
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Configure
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Recent Activity */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <History className="h-5 w-5 text-primary" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentActivity.map((activity, index) => (
                        <div
                          key={activity.id}
                          className="flex items-center justify-between p-3 hover:bg-muted/30 rounded-lg transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`mt-1 w-2 h-2 rounded-full ${
                                activity.status === "success"
                                  ? "bg-success"
                                  : activity.status === "warning"
                                  ? "bg-warning"
                                  : "bg-primary"
                              }`}
                            />
                            <div>
                              <p className="font-medium">{activity.action}</p>
                              <p className="text-sm text-muted-foreground">
                                {activity.details}
                              </p>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {activity.time}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Danger Zone */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Card className="border-destructive/50">
                  <CardHeader>
                    <CardTitle className="text-destructive flex items-center gap-2">
                      <LogOut className="h-5 w-5" />
                      Account Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between p-4 bg-destructive/10 rounded-lg">
                      <div>
                        <h3 className="font-medium">Sign Out</h3>
                        <p className="text-sm text-muted-foreground">
                          Sign out of your current session
                        </p>
                      </div>
                      <Button variant="destructive" onClick={logout}>
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
