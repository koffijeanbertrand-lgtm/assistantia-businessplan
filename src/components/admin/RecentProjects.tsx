import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Project {
  id: string;
  project_name: string;
  created_at: string;
  sector: string;
}

interface RecentProjectsProps {
  projects: Project[];
}

export const RecentProjects = ({ projects }: RecentProjectsProps) => {
  const navigate = useNavigate();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Derniers Projets</CardTitle>
      </CardHeader>
      <CardContent>
        {projects.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Aucun projet pour le moment
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom du projet</TableHead>
                <TableHead>Secteur</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell className="font-medium">
                    {project.project_name}
                  </TableCell>
                  <TableCell>{project.sector}</TableCell>
                  <TableCell>{formatDate(project.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => navigate(`/admin/projects/${project.id}`)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
