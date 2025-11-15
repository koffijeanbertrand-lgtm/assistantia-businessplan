import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { DashboardStats } from "@/components/admin/DashboardStats";
import { RecentProjects } from "@/components/admin/RecentProjects";
import { ProjectsChart, UsersChart, CombinedChart } from "@/components/admin/StatsCharts";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [totalProjects, setTotalProjects] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [recentProjects, setRecentProjects] = useState(0);
  const [latestProjects, setLatestProjects] = useState<any[]>([]);
  const [chartData, setChartData] = useState<Array<{ date: string; projets: number; utilisateurs: number }>>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAdminAndLoadData();
  }, []);

  const checkAdminAndLoadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!roleData) {
        toast({
          title: "Accès refusé",
          description: "Vous n'avez pas les permissions administrateur.",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      await loadDashboardData();
    } catch (error: any) {
      console.error("Error:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardData = async () => {
    // Total projects
    const { count: projectCount } = await supabase
      .from("business_plans")
      .select("*", { count: "exact", head: true });
    
    setTotalProjects(projectCount || 0);

    // Total users
    const { count: userCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });
    
    setTotalUsers(userCount || 0);

    // Recent projects (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { count: recentCount } = await supabase
      .from("business_plans")
      .select("*", { count: "exact", head: true })
      .gte("created_at", sevenDaysAgo.toISOString());
    
    setRecentProjects(recentCount || 0);

    // Latest 5 projects
    const { data: projects } = await supabase
      .from("business_plans")
      .select("id, project_name, sector, created_at")
      .order("created_at", { ascending: false })
      .limit(5);
    
    setLatestProjects(projects || []);

    // Chart data - last 30 days
    await loadChartData();
  };

  const loadChartData = async () => {
    const days = 30;
    const chartDataArray: Array<{ date: string; projets: number; utilisateurs: number }> = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      // Count projects created on this day
      const { count: projectsCount } = await supabase
        .from("business_plans")
        .select("*", { count: "exact", head: true })
        .gte("created_at", date.toISOString())
        .lt("created_at", nextDate.toISOString());

      // Count users created on this day
      const { count: usersCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", date.toISOString())
        .lt("created_at", nextDate.toISOString());

      chartDataArray.push({
        date: date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
        projets: projectsCount || 0,
        utilisateurs: usersCount || 0,
      });
    }

    setChartData(chartDataArray);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Vue d'ensemble de votre plateforme AI Business Planner
          </p>
        </div>

        <DashboardStats
          totalProjects={totalProjects}
          totalUsers={totalUsers}
          recentProjects={recentProjects}
        />

        <CombinedChart data={chartData} />

        <div className="grid gap-4 md:grid-cols-2">
          <ProjectsChart data={chartData} />
          <UsersChart data={chartData} />
        </div>

        <RecentProjects projects={latestProjects} />
      </div>
    </AdminLayout>
  );
}
