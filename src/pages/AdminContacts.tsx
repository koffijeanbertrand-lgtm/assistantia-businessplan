import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, User, Calendar, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  created_at: string;
  read: boolean;
  anonymized_at: string | null;
}

export default function AdminContacts() {
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAdminAndLoadMessages();
  }, []);

  const checkAdminAndLoadMessages = async () => {
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

      await loadMessages();
    } catch (error: any) {
      console.error("Error:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de charger les données",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    try {
      // Call the RPC function using fetch since it's not in the generated types yet
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(
        `https://eayorbhlwmpsfeyzmkuj.supabase.co/rest/v1/rpc/get_contact_messages_safe`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVheW9yYmhsd21wc2ZleXpta3VqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwMDE4MTQsImV4cCI6MjA3NTU3NzgxNH0.6Wm0p61qaZJXi1S2R-OWNXDoXvUUbJrQ4ruLAM3uMYA',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ _limit: 50, _offset: 0 })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors du chargement des messages');
      }

      const data = await response.json();
      setMessages(data || []);
    } catch (error: any) {
      console.error("Error loading messages:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de charger les messages",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Messages de Contact</h1>
          <p className="text-muted-foreground mt-2">
            Gestion des messages de contact déchiffrés de manière sécurisée
          </p>
        </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Liste des Messages</CardTitle>
            <CardDescription>
              {messages.length} message(s) au total
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {messages.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        Aucun message de contact
                      </TableCell>
                    </TableRow>
                  ) : (
                    messages.map((msg) => (
                      <TableRow
                        key={msg.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setSelectedMessage(msg)}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            {msg.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            {msg.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {formatDate(msg.created_at)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {msg.anonymized_at ? (
                            <Badge variant="secondary">Anonymisé</Badge>
                          ) : msg.read ? (
                            <Badge variant="outline">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Lu
                            </Badge>
                          ) : (
                            <Badge variant="default">
                              <XCircle className="h-3 w-3 mr-1" />
                              Non lu
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Détails du Message</CardTitle>
            <CardDescription>
              {selectedMessage ? "Message sélectionné" : "Sélectionnez un message pour voir les détails"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedMessage ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Nom</label>
                  <p className="text-lg font-medium">{selectedMessage.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-lg">{selectedMessage.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Date</label>
                  <p className="text-sm">{formatDate(selectedMessage.created_at)}</p>
                </div>
                {selectedMessage.anonymized_at && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Anonymisé le</label>
                    <p className="text-sm">{formatDate(selectedMessage.anonymized_at)}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Message</label>
                  <div className="mt-2 p-4 rounded-md bg-muted">
                    <p className="text-sm whitespace-pre-wrap">{selectedMessage.message}</p>
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button variant="outline" onClick={() => setSelectedMessage(null)}>
                    Fermer
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                <p>Cliquez sur un message pour voir les détails</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Informations de Sécurité</CardTitle>
          <CardDescription>
            Les données sont chiffrées et déchiffrées de manière sécurisée
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>✅ Les emails et noms sont stockés chiffrés (bytea) dans la base de données</p>
            <p>✅ L'accès est limité aux administrateurs uniquement</p>
            <p>✅ Les requêtes sont limitées par rate limiting (3 par minute, 20 par heure)</p>
            <p>✅ Validation IP et audit des accès actifs</p>
            <p>✅ Anonymisation automatique après 90 jours pour les messages lus</p>
          </div>
        </CardContent>
      </Card>
      </div>
    </AdminLayout>
  );
}
