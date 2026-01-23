import { EnvioDinero } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Send, 
  User, 
  MapPin, 
  DollarSign, 
  Truck,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';

interface EnvioListProps {
  envios: EnvioDinero[];
  onCancel?: (id: number) => void;
  onMarkDelivered?: (id: number) => void;
}

const estadoConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof Clock }> = {
  PENDIENTE: { label: 'Pendiente', variant: 'secondary', icon: Clock },
  EN_TRANSITO: { label: 'En Tránsito', variant: 'default', icon: Truck },
  ENTREGADO: { label: 'Entregado', variant: 'outline', icon: CheckCircle },
  CANCELADO: { label: 'Cancelado', variant: 'destructive', icon: XCircle },
};

export function EnvioList({ envios, onCancel, onMarkDelivered }: EnvioListProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (envios.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Send className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No hay envíos registrados</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {envios.map((envio) => {
        const config = estadoConfig[envio.estado];
        const IconComponent = config.icon;

        return (
          <Card key={envio.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  {/* Header */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Send className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-lg">{envio.numeroEnvio}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(envio.fechaCreacion)}</p>
                    </div>
                    <Badge variant={config.variant} className="ml-auto gap-1">
                      <IconComponent className="w-3 h-3" />
                      {config.label}
                    </Badge>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-start gap-2">
                      <User className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-muted-foreground text-xs">Remitente</p>
                        <p className="font-medium">{envio.remitente.nombreCompleto}</p>
                        <p className="text-xs text-muted-foreground">{envio.remitente.numeroDocumento}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-muted-foreground text-xs">Destino</p>
                        <p className="font-medium">{envio.destinatario.nombreCompleto}</p>
                        <p className="text-xs text-muted-foreground">{envio.municipioDestino.nombre}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Truck className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-muted-foreground text-xs">Conductor</p>
                        <p className="font-medium">{envio.conductor.nombreCompleto}</p>
                        <p className="text-xs text-muted-foreground">{envio.conductor.licenciaNumero}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <DollarSign className="w-4 h-4 text-secondary mt-0.5" />
                      <div>
                        <p className="text-muted-foreground text-xs">Monto Total</p>
                        <p className="font-bold text-secondary">{formatCurrency(envio.montoTotal)}</p>
                        <p className="text-xs text-muted-foreground">
                          ({formatCurrency(envio.monto)} + {formatCurrency(envio.comision)})
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {envio.estado === 'PENDIENTE' && (
                    <div className="flex gap-2 pt-2">
                      {onMarkDelivered && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => onMarkDelivered(envio.id)}
                          className="gap-1"
                        >
                          <CheckCircle className="w-3 h-3" />
                          Marcar Entregado
                        </Button>
                      )}
                      {onCancel && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => onCancel(envio.id)}
                          className="gap-1"
                        >
                          <XCircle className="w-3 h-3" />
                          Cancelar
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}