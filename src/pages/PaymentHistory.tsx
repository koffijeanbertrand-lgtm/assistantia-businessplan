import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Receipt } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Session } from "@supabase/supabase-js";

interface PaymentRecord {
  id: string;
  reference: string;
  pack_type: string;
  amount: number;
  currency: string;
  credits_added: number;
  status: string;
  created_at: string;
}

const PaymentHistory = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      } else {
        fetchPaymentHistory(session.user.id);
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

  const fetchPaymentHistory = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("payment_history")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error: any) {
      console.error("Error fetching payment history:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger l'historique des paiements",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: currency === "XOF" ? "XOF" : "USD",
    }).format(amount);
  };

  const getPackLabel = (packType: string) => {
    const labels: { [key: string]: string } = {
      mini: "Mini",
      starter: "Starter",
      pro: "Pro",
    };
    return labels[packType] || packType;
  };

  const getStatusBadge = (status: string) => {
    if (status === "success") {
      return <Badge className="bg-green-500/20 text-green-700 dark:text-green-400">Réussi</Badge>;
    }
    if (status === "pending") {
      return <Badge className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-400">En attente</Badge>;
    }
    return <Badge variant="destructive">Échoué</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-hero">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Receipt className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                Historique des paiements
              </h1>
            </div>
            <Button
              onClick={() => navigate("/")}
              variant="outline"
              className="transition-smooth"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
          </div>

          {payments.length === 0 ? (
            <Card className="p-12 text-center shadow-card">
              <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                <Receipt className="w-8 h-8 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Aucun paiement
              </h2>
              <p className="text-muted-foreground mb-6">
                Vous n'avez pas encore effectué de paiement
              </p>
              <Button
                onClick={() => navigate("/pricing")}
                className="gradient-primary"
              >
                Acheter des crédits
              </Button>
            </Card>
          ) : (
            <Card className="shadow-card overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Pack</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Crédits</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Référence</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">
                          {formatDate(payment.created_at)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {getPackLabel(payment.pack_type)}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatAmount(payment.amount, payment.currency)}
                        </TableCell>
                        <TableCell>
                          <span className="text-primary font-semibold">
                            +{payment.credits_added} crédit{payment.credits_added > 1 ? "s" : ""}
                          </span>
                        </TableCell>
                        <TableCell>{getStatusBadge(payment.status)}</TableCell>
                        <TableCell className="text-muted-foreground text-xs font-mono">
                          {payment.reference}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentHistory;
