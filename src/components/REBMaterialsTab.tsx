import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Download, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Material {
  Level: string;
  Subject: string;
  "Download Link": string;
}

const REBMaterialsTab = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [filteredMaterials, setFilteredMaterials] = useState<Material[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [downloadCounts, setDownloadCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    loadMaterials();
    fetchDownloadCounts();
  }, []);

  const loadMaterials = async () => {
    try {
      const response = await fetch("/src/data/reb-materials.csv");
      const text = await response.text();
      const lines = text.split("\n").filter(line => line.trim());
      const headers = lines[0].split(",");
      
      const data = lines.slice(1).map(line => {
        const values = line.split(",");
        return {
          Level: values[0]?.trim() || "",
          Subject: values[1]?.trim() || "",
          "Download Link": values[2]?.trim() || ""
        };
      });
      
      setMaterials(data);
      setFilteredMaterials(data);
    } catch (error) {
      console.error("Error loading materials:", error);
    }
  };

  const fetchDownloadCounts = async () => {
    const { data } = await supabase
      .from("material_downloads")
      .select("material_name");
    
    if (data) {
      const counts: Record<string, number> = {};
      data.forEach(item => {
        counts[item.material_name] = (counts[item.material_name] || 0) + 1;
      });
      setDownloadCounts(counts);
    }
  };

  useEffect(() => {
    let filtered = materials;

    if (searchQuery) {
      filtered = filtered.filter(m =>
        m.Subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.Level.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (levelFilter !== "all") {
      filtered = filtered.filter(m => m.Level === levelFilter);
    }

    if (subjectFilter !== "all") {
      filtered = filtered.filter(m => m.Subject === subjectFilter);
    }

    if (sortBy === "most-downloaded") {
      filtered = [...filtered].sort((a, b) => {
        const aCount = downloadCounts[`${a.Level} - ${a.Subject}`] || 0;
        const bCount = downloadCounts[`${b.Level} - ${b.Subject}`] || 0;
        return bCount - aCount;
      });
    }

    setFilteredMaterials(filtered);
  }, [searchQuery, levelFilter, subjectFilter, sortBy, materials, downloadCounts]);

  const levels = [...new Set(materials.map(m => m.Level))];
  const subjects = [...new Set(materials.map(m => m.Subject))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">REB Study Materials</h3>
          <p className="text-muted-foreground">Access all educational resources</p>
        </div>
        <Button onClick={() => window.open("https://www.reb.rw/primary-secondary-education/resources", "_blank")}>
          <ExternalLink className="mr-2 h-4 w-4" />
          Explore More on REB
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search materials..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            {levels.map(level => (
              <SelectItem key={level} value={level}>{level}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={subjectFilter} onValueChange={setSubjectFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by Subject" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            {subjects.map(subject => (
              <SelectItem key={subject} value={subject}>{subject}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger>
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="most-downloaded">Most Downloaded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredMaterials.map((material, index) => {
          const materialKey = `${material.Level} - ${material.Subject}`;
          const downloads = downloadCounts[materialKey] || 0;
          
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">{material.Subject}</CardTitle>
                <CardDescription>{material.Level}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{downloads} downloads</span>
                </div>
                <Button
                  className="w-full"
                  onClick={() => window.open(material["Download Link"], "_blank")}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredMaterials.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No materials found matching your filters.
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default REBMaterialsTab;
