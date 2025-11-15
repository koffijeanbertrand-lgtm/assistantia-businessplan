import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FolderKanban, Users, TrendingUp } from "lucide-react";

interface StatsProps {
  totalProjects: number;
  totalUsers: number;
  recentProjects: number;
}

export const DashboardStats = ({ totalProjects, totalUsers, recentProjects }: StatsProps) => {
  const stats = [
    {
      title: "Total Projets",
      value: totalProjects,
      icon: FolderKanban,
      description: "Business plans générés",
    },
    {
      title: "Utilisateurs",
      value: totalUsers,
      icon: Users,
      description: "Comptes créés",
    },
    {
      title: "Cette semaine",
      value: recentProjects,
      icon: TrendingUp,
      description: "Nouveaux projets",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
