import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Mail, User, Clock, Shield, ChevronLeft, ChevronRight } from "lucide-react";
import type { Session } from "@supabase/supabase-js";

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  created_at: string;
  read: boolean;
  anonymized_at: string | null;
}

const Admin = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalMessages, setTotalMessages] = useState(0);
  const messagesPerPage = 10;
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      } else {
        setTimeout(() => {
          checkAdminRole(session.user.id);
        }, 0);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (!session) {
          navigate("/auth");
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkAdminRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setIsAdmin(true);
        fetchMessages(currentPage);
      } else {
        toast({
          title: "Accès refusé",
          description: "Vous n'avez pas les permissions administrateur.",
          variant: "destructive",
        });
        navigate("/");
      }
    } catch (error: any) {
      console.error("Error checking admin role:", error);
      toast({
        title: "Erreur",
        description: "Impossible de vérifier les permissions.",
        variant: "destructive",
      });
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  // Fetch messages when page changes
  useEffect(() => {
    if (isAdmin) {
      fetchMessages(currentPage);
    }
  }, [currentPage, isAdmin]);

  const fetchMessages = async (page: number = 1) => {
    try {
      const offset = (page - 1) * messagesPerPage;
      
      // Call the RPC function directly since it's not in the generated types yet
      const { data, error } = await supabase.rpc("get_contact_messages_safe" as any, {
        _limit: messagesPerPage,
        _offset: offset,
      }) as { data: ContactMessage[] | null; error: any };

      if (error) throw error;

      setMessages(data || []);
      
      // Get total count for pagination
      const { count } = await supabase
        .from("contact_messages")
        .select("*", { count: "exact", head: true });
      
      setTotalMessages(count || 0);
    } catch (error: any) {
      console.error("Error fetching messages:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de charger les messages.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen gradient-hero">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("/")}
              className="shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                <Shield className="h-8 w-8 text-primary" />
                Administration
              </h1>
              <p className="text-muted-foreground mt-1">
                Gestion sécurisée des messages de contact
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="gap-1">
            <Mail className="h-3 w-3" />
            {totalMessages} message{totalMessages !== 1 ? "s" : ""}
          </Badge>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Messages de contact
              <span className="text-sm font-normal text-muted-foreground ml-auto">
                Page {currentPage} sur {Math.ceil(totalMessages / messagesPerPage) || 1}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Aucun message de contact pour le moment
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {messages.map((message) => (
                      <TableRow key={message.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            {message.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            {message.email}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-md">
                          <p className="text-sm truncate" title={message.message}>
                            {message.message}
                          </p>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            {formatDate(message.created_at)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {message.anonymized_at ? (
                            <Badge variant="secondary">Anonymisé</Badge>
                          ) : message.read ? (
                            <Badge variant="outline">Lu</Badge>
                          ) : (
                            <Badge variant="default">Nouveau</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
          
          {/* Pagination Controls */}
          {totalMessages > messagesPerPage && (
            <div className="px-6 pb-6">
              <div className="flex items-center justify-between border-t border-border pt-4">
                <div className="text-sm text-muted-foreground">
                  Affichage de {((currentPage - 1) * messagesPerPage) + 1} à{" "}
                  {Math.min(currentPage * messagesPerPage, totalMessages)} sur {totalMessages} messages
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Précédent
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.ceil(totalMessages / messagesPerPage) }, (_, i) => i + 1)
                      .filter(page => {
                        // Show first page, last page, current page, and pages around current
                        return page === 1 || 
                               page === Math.ceil(totalMessages / messagesPerPage) ||
                               Math.abs(page - currentPage) <= 1;
                      })
                      .map((page, idx, arr) => (
                        <div key={page} className="flex items-center">
                          {idx > 0 && arr[idx - 1] !== page - 1 && (
                            <span className="px-2 text-muted-foreground">...</span>
                          )}
                          <Button
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className="min-w-[2.5rem]"
                          >
                            {page}
                          </Button>
                        </div>
                      ))
                    }
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(Math.ceil(totalMessages / messagesPerPage), prev + 1))}
                    disabled={currentPage === Math.ceil(totalMessages / messagesPerPage)}
                  >
                    Suivant
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-foreground mb-1">
                Sécurité et confidentialité
              </p>
              <p className="text-muted-foreground">
                Les emails et noms sont chiffrés dans la base de données. L'accès est limité
                par des politiques RLS strictes et un rate limiting. Les messages sont
                automatiquement anonymisés après 90 jours.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
