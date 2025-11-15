import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Trash2, Calendar, User, Briefcase } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function AdminProjectDetail() {
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<any>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAdminAndLoadProject();
  }, [id]);

  const checkAdminAndLoadProject = async () => {
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
        navigate("/");
        return;
      }

      await loadProject();
    } catch (error: any) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadProject = async () => {
    const { data, error } = await supabase
      .from("business_plans")
      .select(`
        *,
        profiles(email, full_name)
      `)
      .eq("id", id)
      .maybeSingle();

    if (error || !data) {
      toast({
        title: "Erreur",
        description: "Projet introuvable",
        variant: "destructive",
      });
      navigate("/admin/projects");
      return;
    }

    setProject(data);
  };

  const handleDelete = async () => {
    const { error } = await supabase
      .from("business_plans")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le projet",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Succès",
      description: "Projet supprimé avec succès",
    });

    navigate("/admin/projects");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderSection = (title: string, content: string) => (
    <div className="space-y-2">
      <h3 className="font-semibold text-lg">{title}</h3>
      <p className="text-muted-foreground whitespace-pre-wrap">{content}</p>
    </div>
  );

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (!project) return null;

  return (
    <AdminLayout>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/admin/projects")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{project.project_name}</h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDate(project.created_at)}
                </span>
                {project.profiles?.email && (
                  <span className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {project.profiles.email}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Briefcase className="h-4 w-4" />
                  <Badge variant="secondary">{project.sector}</Badge>
                </span>
              </div>
            </div>
          </div>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Supprimer
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informations du projet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {renderSection("Problème identifié", project.problem)}
            {renderSection("Solution proposée", project.solution)}
            {renderSection("Public cible", project.target_audience)}
            {renderSection("Modèle économique", project.business_model)}
            {renderSection("Ressources nécessaires", project.resources)}
            {renderSection("Stratégie marketing", project.marketing_strategy)}
            {renderSection("Vision", project.vision)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Business Plan Généré</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <div className="whitespace-pre-wrap text-foreground">
                {project.generated_plan}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce projet ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
