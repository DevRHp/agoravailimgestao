import { useState, useEffect } from 'react';
import { ShoppingCart, CheckCircle, Clock, AlertTriangle, Search } from 'lucide-react';
import { api } from '@/lib/api';

import { Header } from '@/components/Header';
import { CartCard } from '@/components/CartCard';
import { StatsCard } from '@/components/StatsCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Carrinho, UsoCarrinho, Funcionario } from '@/lib/types';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export default function Dashboard() {
  const [carrinhos, setCarrinhos] = useState<Carrinho[]>([]);
  const [usosAtivos, setUsosAtivos] = useState<UsoCarrinho[]>([]);
  const [funcionario, setFuncionario] = useState<Funcionario | null>(null);
  const [nif, setNif] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Reserve State
  const [isReserveOpen, setIsReserveOpen] = useState(false);
  const [reserveCart, setReserveCart] = useState<Carrinho | null>(null);
  const [reserveStart, setReserveStart] = useState('');
  const [reserveEnd, setReserveEnd] = useState('');

  useEffect(() => {
    fetchData();

    // Polling interval for "Realtime" updates (5s)
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [cartsData, usosData] = await Promise.all([
        api.getCarrinhos(),
        api.getUsosAtivos()
      ]);
      setCarrinhos(cartsData);
      setUsosAtivos(usosData);
    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
    }
  };

  const validateNif = async () => {
    if (!nif.trim()) {
      toast.error('Digite seu NIF');
      return;
    }

    setIsValidating(true);
    try {
      const func = await api.validateNif(nif.trim());

      // Check if user already has an active cart
      const usoAtivo = usosAtivos.find(u => u.funcionario_id === func.id);
      if (usoAtivo) {
        toast.warning('Você já possui um carrinho em uso');
      }

      setFuncionario(func);
      toast.success(`Bem-vindo(a), ${func.nome}!`);

    } catch (error) {
      toast.error('NIF não encontrado ou inativo');
      setFuncionario(null);
    } finally {
      setIsValidating(false);
    }
  };

  const handleCheckout = async (carrinho: Carrinho) => {
    if (!funcionario) {
      toast.error('Valide seu NIF primeiro');
      return;
    }

    // Check if user already has a cart
    const usoExistente = usosAtivos.find(u => u.funcionario_id === funcionario.id);
    if (usoExistente) {
      toast.error('Você já possui um carrinho em uso. Devolva primeiro.');
      return;
    }

    setIsLoading(true);

    try {
      await api.checkout(carrinho.id, funcionario.id);

      // TODO: Send command to ESP32
      // await fetch(`http://${carrinho.ip_esp32}/abrir`);

      toast.success(`Carrinho ${carrinho.nome} liberado!`);
      fetchData(); // Immediate update
    } catch {
      toast.error('Erro ao liberar carrinho');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReturn = async (carrinho: Carrinho) => {
    if (!funcionario) return;

    setIsLoading(true);

    try {
      await api.returnCart(carrinho.id, funcionario.id);

      // TODO: Send command to ESP32
      // await fetch(`http://${carrinho.ip_esp32}/fechar`);

      toast.success(`Carrinho ${carrinho.nome} devolvido!`);
      fetchData(); // Immediate update
    } catch {
      toast.error('Erro ao devolver carrinho');
    } finally {
      setIsLoading(false);
    }
  };

  const openReserve = (carrinho: Carrinho) => {
    if (!funcionario) {
      toast.error('Valide seu NIF primeiro');
      return;
    }
    setReserveCart(carrinho);
    setIsReserveOpen(true);
  };

  const confirmReserve = async () => {
    if (!reserveCart || !funcionario || !reserveStart || !reserveEnd) {
      toast.error('Preencha todos os campos');
      return;
    }

    if (new Date(reserveStart) >= new Date(reserveEnd)) {
      toast.error('Data de fim deve ser maior que início');
      return;
    }

    setIsLoading(true);
    try {
      await api.reserve(reserveCart.id, funcionario.id, new Date(reserveStart).toISOString(), new Date(reserveEnd).toISOString());
      toast.success(`Agendamento realizado para ${reserveCart.nome}!`);
      setIsReserveOpen(false);
      setReserveCart(null);
      setReserveStart('');
      setReserveEnd('');
      fetchData();
    } catch {
      toast.error('Erro ao realizar agendamento');
    } finally {
      setIsLoading(false);
    }
  };

  const stats = {
    total: carrinhos.length,
    available: carrinhos.filter(c => c.status === 'DISPONIVEL').length,
    inUse: carrinhos.filter(c => c.status === 'EM_USO').length,
    maintenance: carrinhos.filter(c => c.status === 'MANUTENCAO').length,
  };

  const filteredCarrinhos = carrinhos.filter(c =>
    c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.identificador_fisico.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const myActiveCart = funcionario
    ? usosAtivos.find(u => u.funcionario_id === funcionario.id)
    : null;

  return (
    <div className="min-h-screen bg-background tech-grid">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />

      <Header />

      <main className="container mx-auto px-4 py-8 relative">
        {/* NIF Validation */}
        <div className="glass-card p-6 mb-8 animate-slide-up">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Identificação do Funcionário
          </h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Digite seu NIF"
                value={nif}
                onChange={(e) => setNif(e.target.value)}
                className="bg-secondary/50 border-border focus:border-primary font-mono"
                onKeyDown={(e) => e.key === 'Enter' && validateNif()}
              />
            </div>
            <Button
              onClick={validateNif}
              disabled={isValidating}
              variant="glow"
            >
              {isValidating ? 'Validando...' : 'Validar NIF'}
            </Button>
          </div>
          {funcionario && (
            <div className="mt-4 p-4 rounded-lg bg-success/10 border border-success/20 animate-fade-in">
              <p className="text-success font-medium">
                ✓ {funcionario.nome} - {funcionario.unidade || 'Sem unidade'}
              </p>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard title="Total" value={stats.total} icon={ShoppingCart} />
          <StatsCard title="Disponíveis" value={stats.available} icon={CheckCircle} variant="success" />
          <StatsCard title="Em Uso" value={stats.inUse} icon={Clock} variant="warning" />
          <StatsCard title="Manutenção" value={stats.maintenance} icon={AlertTriangle} variant="destructive" />
        </div>

        {/* My Active Cart */}
        {myActiveCart && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4 text-foreground">Seu Carrinho Ativo</h2>
            <div className="max-w-md">
              <CartCard
                carrinho={carrinhos.find(c => c.id === myActiveCart.carrinho_id)!}
                usoAtivo={myActiveCart}
                isUserCart={true}
                onReturn={() => handleReturn(carrinhos.find(c => c.id === myActiveCart.carrinho_id)!)}
                isLoading={isLoading}
              />
            </div>
          </div>
        )}

        {/* Cart List */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Carrinhos Disponíveis</h2>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar carrinho..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-secondary/50 border-border"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCarrinhos.map((carrinho) => {
              const usoAtivo = usosAtivos.find(u => u.carrinho_id === carrinho.id);
              const isUserCart = funcionario && usoAtivo?.funcionario_id === funcionario.id;

              return (
                <CartCard
                  key={carrinho.id}
                  carrinho={carrinho}
                  usoAtivo={usoAtivo}
                  isUserCart={isUserCart}
                  onCheckout={() => handleCheckout(carrinho)}
                  onReturn={() => handleReturn(carrinho)}
                  onReserve={() => openReserve(carrinho)}
                  isLoading={isLoading}
                />
              );
            })}
          </div>

          {filteredCarrinhos.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum carrinho encontrado</p>
            </div>
          )}
        </div>
      </main>

      <Dialog open={isReserveOpen} onOpenChange={setIsReserveOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Agendar {reserveCart?.nome}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Início do Uso</Label>
              <Input
                type="datetime-local"
                value={reserveStart}
                onChange={(e) => setReserveStart(e.target.value)}
                className="bg-secondary/50"
              />
            </div>
            <div className="space-y-2">
              <Label>Devolução Prevista</Label>
              <Input
                type="datetime-local"
                value={reserveEnd}
                onChange={(e) => setReserveEnd(e.target.value)}
                className="bg-secondary/50"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReserveOpen(false)}>Cancelar</Button>
            <Button variant="glow" onClick={confirmReserve} disabled={isLoading}>
              {isLoading ? 'Agendando...' : 'Confirmar Agendamento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}