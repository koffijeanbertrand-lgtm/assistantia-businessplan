import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, Shield, ShieldOff, Eye, Mail, Calendar, Trash2, Ban, CheckCircle } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
  avatar_url: string | null;
  isAdmin: boolean;
  projectCount: number;
  isBanned: boolean;
}

interface UserProject {
  id: string;
  project_name: string;
  sector: string;
  created_at: string;
}

export default function AdminUsers() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [userProjects, setUserProjects] = useState<UserProject[]>([]);
  const [roleAction, setRoleAction] = useState<{ userId: string; action: "grant" | "revoke" } | null>(null);
  const [statusAction, setStatusAction] = useState<{ user: UserProfile; action: "ban" | "unban" } | null>(null);
  const [deleteUser, setDeleteUser] = useState<UserProfile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [showProjectsDialog, setShowProjectsDialog] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAdminAndLoadUsers();
  }, []);

  const checkAdminAndLoadUsers = async () => {
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

      await loadUsers();
    } catch (error: any) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      // Get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Get all user roles
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .eq("role", "admin");

      // Get project counts for each user
      const { data: projectCounts } = await supabase
        .from("business_plans")
        .select("user_id");

      // For now, we'll set all users as not banned
      // The ban functionality will be handled directly through the toggle-user-status function
      const usersWithData: UserProfile[] = (profiles || []).map((profile) => {
        const isAdmin = roles?.some((r) => r.user_id === profile.id) || false;
        const projectCount = projectCounts?.filter((p) => p.user_id === profile.id).length || 0;

        return {
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
          created_at: profile.created_at,
          avatar_url: profile.avatar_url,
          isAdmin,
          projectCount,
          isBanned: false, // Will be checked when action is needed
        };
      });

      setUsers(usersWithData);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les utilisateurs",
        variant: "destructive",
      });
    }
  };

  const loadUserProjects = async (userId: string) => {
    const { data, error } = await supabase
      .from("business_plans")
      .select("id, project_name, sector, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les projets",
        variant: "destructive",
      });
      return;
    }

    setUserProjects(data || []);
  };

  const handleViewProjects = async (user: UserProfile) => {
    setSelectedUser(user);
    await loadUserProjects(user.id);
    setShowProjectsDialog(true);
  };

  const handleRoleChange = async () => {
    if (!roleAction) return;

    try {
      const { userId, action } = roleAction;

      if (action === "grant") {
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role: "admin" });

        if (error) throw error;

        toast({
          title: "Succès",
          description: "Rôle admin attribué avec succès",
        });
      } else {
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", userId)
          .eq("role", "admin");

        if (error) throw error;

        toast({
          title: "Succès",
          description: "Rôle admin retiré avec succès",
        });
      }

      setRoleAction(null);
      loadUsers();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de modifier le rôle",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteUser) return;

    setIsDeleting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("Session non trouvée");
      }

      const response = await fetch(
        `https://eayorbhlwmpsfeyzmkuj.supabase.co/functions/v1/delete-user`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ userId: deleteUser.id }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erreur lors de la suppression");
      }

      toast({
        title: "Succès",
        description: "Utilisateur supprimé avec succès",
      });

      setDeleteUser(null);
      loadUsers();
    } catch (error: any) {
      console.error("Delete user error:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer l'utilisateur",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!statusAction) return;

    setIsTogglingStatus(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("Session non trouvée");
      }

      const response = await fetch(
        `https://eayorbhlwmpsfeyzmkuj.supabase.co/functions/v1/toggle-user-status`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ 
            userId: statusAction.user.id,
            action: statusAction.action
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erreur lors du changement de statut");
      }

      toast({
        title: "Succès",
        description: statusAction.action === "ban" 
          ? "Compte désactivé avec succès"
          : "Compte réactivé avec succès",
      });

      setStatusAction(null);
      loadUsers();
    } catch (error: any) {
      console.error("Toggle status error:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de changer le statut",
        variant: "destructive",
      });
    } finally {
      setIsTogglingStatus(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const filteredUsers = users.filter((user) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.email?.toLowerCase().includes(searchLower) ||
      user.full_name?.toLowerCase().includes(searchLower)
    );
  });

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
      <div className="p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Utilisateurs</h1>
          <p className="text-muted-foreground mt-2">
            Gérez les utilisateurs et leurs permissions
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Liste des utilisateurs ({filteredUsers.length})</span>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Projets</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Inscription</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Aucun utilisateur trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.full_name || "Sans nom"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          {user.email || "N/A"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{user.projectCount}</Badge>
                      </TableCell>
                      <TableCell>
                        {user.isBanned ? (
                          <Badge variant="destructive">
                            <Ban className="h-3 w-3 mr-1" />
                            Désactivé
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-green-600 border-green-500">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Actif
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.isAdmin ? (
                          <Badge className="bg-primary text-primary-foreground">
                            <Shield className="h-3 w-3 mr-1" />
                            Admin
                          </Badge>
                        ) : (
                          <Badge variant="outline">Utilisateur</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {formatDate(user.created_at)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        {user.projectCount > 0 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewProjects(user)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        {user.isAdmin ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setRoleAction({ userId: user.id, action: "revoke" })}
                            className="text-destructive hover:text-destructive"
                          >
                            <ShieldOff className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setRoleAction({ userId: user.id, action: "grant" })}
                          >
                            <Shield className="h-4 w-4" />
                          </Button>
                        )}
                        {user.isBanned ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setStatusAction({ user, action: "unban" })}
                            className="text-green-600 hover:text-green-600"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setStatusAction({ user, action: "ban" })}
                            className="text-orange-600 hover:text-orange-600"
                          >
                            <Ban className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeleteUser(user)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Role Change Confirmation Dialog */}
      <AlertDialog open={!!roleAction} onOpenChange={() => setRoleAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {roleAction?.action === "grant" ? "Attribuer le rôle admin" : "Retirer le rôle admin"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {roleAction?.action === "grant"
                ? "Êtes-vous sûr de vouloir attribuer le rôle administrateur à cet utilisateur ?"
                : "Êtes-vous sûr de vouloir retirer le rôle administrateur à cet utilisateur ?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleRoleChange}>
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Toggle Status Confirmation Dialog */}
      <AlertDialog open={!!statusAction} onOpenChange={() => !isTogglingStatus && setStatusAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {statusAction?.action === "ban" ? "Désactiver le compte" : "Réactiver le compte"}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                {statusAction?.action === "ban" 
                  ? `Êtes-vous sûr de vouloir désactiver le compte de ${statusAction.user.full_name || statusAction.user.email} ?`
                  : `Êtes-vous sûr de vouloir réactiver le compte de ${statusAction.user.full_name || statusAction.user.email} ?`
                }
              </p>
              <p className="text-sm text-muted-foreground">
                {statusAction?.action === "ban" 
                  ? "L'utilisateur ne pourra plus se connecter jusqu'à la réactivation de son compte. Ses données ne seront pas supprimées."
                  : "L'utilisateur pourra à nouveau se connecter et accéder à son compte."
                }
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isTogglingStatus}>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleToggleStatus}
              disabled={isTogglingStatus}
              className={statusAction?.action === "ban" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
            >
              {isTogglingStatus ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {statusAction?.action === "ban" ? "Désactivation..." : "Réactivation..."}
                </>
              ) : (
                statusAction?.action === "ban" ? "Désactiver" : "Réactiver"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete User Confirmation Dialog */}
      <AlertDialog open={!!deleteUser} onOpenChange={() => !isDeleting && setDeleteUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'utilisateur</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Êtes-vous sûr de vouloir supprimer <strong>{deleteUser?.full_name || deleteUser?.email}</strong> ?
              </p>
              <p className="text-destructive font-medium">
                Cette action est irréversible et supprimera :
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Le compte utilisateur</li>
                <li>Tous ses projets ({deleteUser?.projectCount} projet{deleteUser?.projectCount !== 1 ? 's' : ''})</li>
                <li>Toutes ses données personnelles</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteUser}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Suppression...
                </>
              ) : (
                "Supprimer définitivement"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* User Projects Dialog */}
      <Dialog open={showProjectsDialog} onOpenChange={setShowProjectsDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              Projets de {selectedUser?.full_name || selectedUser?.email}
            </DialogTitle>
            <DialogDescription>
              {userProjects.length} projet(s) créé(s)
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
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
                {userProjects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Aucun projet
                    </TableCell>
                  </TableRow>
                ) : (
                  userProjects.map((project) => (
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
                          onClick={() => {
                            setShowProjectsDialog(false);
                            navigate(`/admin/projects/${project.id}`);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
