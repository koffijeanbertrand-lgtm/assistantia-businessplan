import { useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface CreditNotificationOptions {
  credits: number;
  userId?: string;
}

export const useCreditNotifications = ({ credits, userId }: CreditNotificationOptions) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const lastNotifiedLevel = useRef<number | null>(null);

  useEffect(() => {
    if (!userId) return;

    // Clé pour localStorage basée sur l'utilisateur
    const storageKey = `credit_notification_${userId}`;
    const lastNotification = localStorage.getItem(storageKey);
    const lastNotificationData = lastNotification ? JSON.parse(lastNotification) : null;

    // Ne notifier qu'une fois par niveau de crédit
    const shouldNotify = (level: number) => {
      if (lastNotifiedLevel.current === level) return false;
      
      // Vérifier si on a déjà notifié ce niveau dans les dernières 24h
      if (lastNotificationData) {
        const { level: lastLevel, timestamp } = lastNotificationData;
        const now = Date.now();
        const twentyFourHours = 24 * 60 * 60 * 1000;
        
        if (lastLevel === level && (now - timestamp) < twentyFourHours) {
          return false;
        }
      }
      
      return true;
    };

    const saveNotification = (level: number) => {
      lastNotifiedLevel.current = level;
      localStorage.setItem(
        storageKey,
        JSON.stringify({ level, timestamp: Date.now() })
      );
    };

    // Notification quand il n'y a plus de crédits
    if (credits === 0 && shouldNotify(0)) {
      toast({
        title: "⚠️ Crédits épuisés",
        description: "Vous n'avez plus de crédits. Rechargez maintenant pour continuer à générer des business plans.",
        variant: "destructive",
        action: (
          <button
            onClick={() => navigate("/pricing")}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-smooth"
          >
            Acheter
          </button>
        ),
        duration: 10000,
      });
      saveNotification(0);
    }
    // Notification quand il reste 1 crédit
    else if (credits === 1 && shouldNotify(1)) {
      toast({
        title: "🔔 Dernier crédit",
        description: "Il ne vous reste qu'un seul crédit. Pensez à recharger pour ne pas être bloqué.",
        action: (
          <button
            onClick={() => navigate("/pricing")}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-smooth"
          >
            Acheter
          </button>
        ),
        duration: 8000,
      });
      saveNotification(1);
    }
    // Notification quand il reste 2-3 crédits
    else if (credits >= 2 && credits <= 3 && shouldNotify(2)) {
      toast({
        title: "💡 Crédits bientôt épuisés",
        description: `Il ne vous reste que ${credits} crédits. Pensez à recharger bientôt.`,
        action: (
          <button
            onClick={() => navigate("/pricing")}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-smooth"
          >
            Acheter
          </button>
        ),
        duration: 7000,
      });
      saveNotification(2);
    }
  }, [credits, userId, toast, navigate]);

  return null;
};
