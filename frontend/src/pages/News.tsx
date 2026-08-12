import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Search,
  Filter,
  Loader2,
  FileText,
  RefreshCw,
} from "lucide-react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getNews, type NewsItem } from "@/services/api";

const NEWS_CACHE_KEY = "safescan_news_cache";
const NEWS_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

interface NewsCache {
  data: NewsItem[];
  timestamp: number;
}

function getCachedNews(): NewsCache | null {
  const cached = localStorage.getItem(NEWS_CACHE_KEY);
  if (!cached) return null;
  try {
    const parsed: NewsCache = JSON.parse(cached);
    const now = Date.now();
    if (now - parsed.timestamp < NEWS_CACHE_TTL) {
      return parsed;
    }
  } catch {
    return null;
  }
  return null;
}

function setCachedNews(data: NewsItem[]) {
  const cache: NewsCache = {
    data,
    timestamp: Date.now(),
  };
  localStorage.setItem(NEWS_CACHE_KEY, JSON.stringify(cache));
}

export default function News() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");

  const fetchNews = async (skipCache = false) => {
    try {
      if (!skipCache) {
        const cached = getCachedNews();
        if (cached) {
          setNews(cached.data);
          setLoading(false);
          return;
        }
      }

      setLoading(!skipCache);
      setRefreshing(skipCache);
      setError(null);
      const newsData = await getNews();
      setNews(newsData);
      setCachedNews(newsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load news");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(news.map((item) => item.category)));
    return ["all", ...cats];
  }, [news]);

  const filteredNews = useMemo(() => {
    return news.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        categoryFilter === "all" || item.category === categoryFilter;
      const matchesSeverity =
        severityFilter === "all" || item.severity === severityFilter;
      return matchesSearch && matchesCategory && matchesSeverity;
    });
  }, [news, searchQuery, categoryFilter, severityFilter]);

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Loading news...</h2>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Failed to load news</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={() => fetchNews(true)}>Try Again</Button>
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
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Threat News</h1>
              <p className="text-muted-foreground">
                Stay updated with the latest cybersecurity news and threats
              </p>
            </div>
            <Button onClick={() => fetchNews(true)} disabled={refreshing} className="gap-2">
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {refreshing ? "Refreshing..." : "Refresh"}
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search news..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat === "all" ? "All Categories" : cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <AlertTriangle className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* News Grid */}
          {filteredNews.length === 0 ? (
            <div className="border border-border rounded-lg p-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No news found</h3>
              <p className="text-muted-foreground">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredNews.map((item, index) => (
                <motion.div
                  key={`${item.published_at}-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => window.open(item.url, "_blank", "noopener noreferrer")}>
                    {item.image && (
                      <div className="w-full h-48 bg-muted overflow-hidden">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <Badge
                            variant={
                              item.severity === "Low"
                                ? "outline"
                                : item.severity === "Medium"
                                ? "secondary"
                                : "destructive"
                            }
                            className="mb-2"
                          >
                            {item.severity === "Low" || item.severity === "Medium" ? (
                              <CheckCircle className="h-3 w-3 mr-1" />
                            ) : (
                              <AlertTriangle className="h-3 w-3 mr-1" />
                            )}
                            {item.severity}
                          </Badge>
                          <Badge variant="outline" className="mb-2 mr-2">
                            {item.category}
                          </Badge>
                        </div>
                      </div>
                      <CardTitle className="text-lg leading-tight">{item.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                        {item.description}
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{item.source}</span>
                        <span>{new Date(item.published_at).toLocaleDateString()}</span>
                      </div>
                      <div className="mt-4">
                        <Button variant="outline" size="sm" className="w-full gap-2">
                          Read Article
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </Layout>
  );
}
