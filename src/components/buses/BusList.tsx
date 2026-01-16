import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bus as BusIcon, User, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { mockBuses } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { EstadoBus } from '@/types';

const estadoColors: Record<EstadoBus, string> = {
  DISPONIBLE: 'bg-muted text-muted-foreground',
  DESPACHADO: 'bg-success/10 text-success border-success/20',
  EN_RUTA: 'bg-primary/10 text-primary border-primary/20',
  MANTENIMIENTO: 'bg-warning/10 text-warning border-warning/20',
  INACTIVO: 'bg-destructive/10 text-destructive border-destructive/20',
};

export function BusList() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BusIcon className="w-5 h-5 text-primary" />
          Flota de Buses
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockBuses.map(bus => (
            <div
              key={bus.id}
              className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-bold">{bus.placa}</h3>
                  <p className="text-sm text-muted-foreground">
                    {bus.marca} {bus.modelo}
                  </p>
                </div>
                <Badge 
                  variant="outline" 
                  className={cn(estadoColors[bus.estado])}
                >
                  {bus.estado}
                </Badge>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Capacidad</span>
                  <span className="font-medium">{bus.capacidad} pasajeros</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Conductor</span>
                  {bus.conductorAsignado ? (
                    <div className="flex items-center gap-1 text-success">
                      <CheckCircle2 className="w-3 h-3" />
                      <span className="font-medium truncate max-w-[120px]">
                        {bus.conductorAsignado.nombreCompleto.split(' ')[0]}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-warning">
                      <AlertTriangle className="w-3 h-3" />
                      <span>Sin asignar</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
