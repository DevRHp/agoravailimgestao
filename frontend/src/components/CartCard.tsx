import { ShoppingCart, Lock, Unlock, Wrench, User, MapPin, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Carrinho, UsoCarrinho } from '@/lib/types';
import { cn } from '@/lib/utils';

interface CartCardProps {
  carrinho: Carrinho;
  usoAtivo?: UsoCarrinho | null;
  isUserCart?: boolean;
  onCheckout?: () => void;
  onReturn?: () => void;
  onReserve?: () => void;
  isLoading?: boolean;
}

export function CartCard({
  carrinho,
  usoAtivo,
  isUserCart,
  onCheckout,
  onReturn,
  onReserve,
  isLoading
}: CartCardProps) {
  const statusConfig = {
    DISPONIVEL: {
      label: 'Disponível',
      className: 'status-available',
      icon: Unlock,
    },
    EM_USO: {
      label: 'Em Uso',
      className: 'status-in-use',
      icon: Lock,
    },
    MANUTENCAO: {
      label: 'Manutenção',
      className: 'status-maintenance',
      icon: Wrench,
    },
    AGENDADO: {
      label: 'Agendado',
      className: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      icon: Clock, // We need to import Clock if not already, wait, Clock is not imported. I'll add it.
    }
  };

  const config = statusConfig[carrinho.status];
  const StatusIcon = config.icon;

  return (
    <div className={cn(
      "glass-card p-6 animate-slide-up transition-all duration-300 hover:border-primary/30",
      isUserCart && "border-primary/50 glow-effect"
    )}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-primary/10 text-primary">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-foreground">{carrinho.nome}</h3>
            <p className="text-sm text-muted-foreground font-mono">{carrinho.identificador_fisico}</p>
            {carrinho.localizacao && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                <MapPin className="w-3 h-3" />
                <span>{carrinho.localizacao}</span>
              </div>
            )}
          </div>
        </div>
        <div className={cn("px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5", config.className)}>
          <StatusIcon className="w-3.5 h-3.5" />
          {config.label}
        </div>
      </div>

      {usoAtivo && carrinho.status === 'EM_USO' && (
        <div className="mb-4 p-3 rounded-lg bg-secondary/50 border border-border/50">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="w-4 h-4" />
            <span>Em uso por: <span className="text-foreground font-medium">{usoAtivo.funcionario?.nome || 'Funcionário'}</span></span>
          </div>
          <p className="text-xs text-muted-foreground mt-1 font-mono">
            Desde: {new Date(usoAtivo.data_hora_inicio).toLocaleString('pt-BR')}
          </p>
        </div>
      )}

      {carrinho.ip_esp32 && (
        <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="font-mono">ESP32: {carrinho.ip_esp32}</span>
        </div>
      )}

      <div className="flex gap-2">
        {carrinho.status === 'DISPONIVEL' && onCheckout && (
          <Button
            variant="glow"
            className="w-full"
            onClick={onCheckout}
            disabled={isLoading}
          >
            <Unlock className="w-4 h-4" />
            {isLoading ? 'Liberando...' : 'Retirar Carrinho'}
          </Button>
        )}

        {carrinho.status === 'DISPONIVEL' && onReserve && (
          <Button
            variant="outline"
            className="w-full"
            onClick={onReserve}
            disabled={isLoading}
          >
            <Clock className="w-4 h-4" />
            Agendar
          </Button>
        )}

        {isUserCart && carrinho.status === 'EM_USO' && onReturn && (
          <Button
            variant="warning"
            className="w-full"
            onClick={onReturn}
            disabled={isLoading}
          >
            <Lock className="w-4 h-4" />
            {isLoading ? 'Devolvendo...' : 'Devolver Carrinho'}
          </Button>
        )}

        {!isUserCart && carrinho.status === 'EM_USO' && (
          <Button variant="outline" className="w-full" disabled>
            <Lock className="w-4 h-4" />
            Indisponível
          </Button>
        )}

        {carrinho.status === 'MANUTENCAO' && (
          <Button variant="outline" className="w-full" disabled>
            <Wrench className="w-4 h-4" />
            Em Manutenção
          </Button>
        )}
      </div>
    </div>
  );
}