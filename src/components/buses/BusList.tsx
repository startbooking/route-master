import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bus as BusIcon, User, AlertTriangle, CheckCircle2, MapPin, Users } from 'lucide-react';
import { mockBuses } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { Bus, EstadoBus, CreateDespachoDTO } from '@/types';
import { DespachoModal } from './DespachoModal';
import { toast } from 'sonner';

const estadoColors: Record<EstadoBus, string> = {
  DISPONIBLE: 'bg-muted text-muted-foreground',
  DESPACHADO: 'bg-success/10 text-success border-success/20',
  EN_RUTA: 'bg-primary/10 text-primary border-primary/20',
  MANTENIMIENTO: 'bg-warning/10 text-warning border-warning/20',
  INACTIVO: 'bg-destructive/10 text-destructive border-destructive/20',
};

export function BusList() {
  const [buses, setBuses] = useState<Bus[]>(mockBuses);
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
  const [showDespachoModal, setShowDespachoModal] = useState(false);

  const handleOpenDespacho = (bus: Bus) => {
    if (bus.estado !== 'DISPONIBLE') {
      toast.error('Solo se pueden despachar buses disponibles');
      return;
    }
    setSelectedBus(bus);
    setShowDespachoModal(true);
  };

  const handleDespachar = (despacho: CreateDespachoDTO) => {
    setBuses(prev => 
      prev.map(bus => 
        bus.id === despacho.busId 
          ? { ...bus, estado: 'DESPACHADO' as EstadoBus }
          : bus
      )
    );
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BusIcon className="w-5 h-5 text-primary" />
            Flota de Buses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {buses.map(bus => (
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

                  {/* Mostrar cantidad de conductores asociados */}
                  {bus.conductoresAsociados && bus.conductoresAsociados.length > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Conductores</span>
                      <div className="flex items-center gap-1 text-primary">
                        <Users className="w-3 h-3" />
                        <span className="font-medium">{bus.conductoresAsociados.length} asignados</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Botón de despacho */}
                {bus.estado === 'DISPONIBLE' && (
                  <Button
                    size="sm"
                    className="w-full mt-3 gap-2"
                    onClick={() => handleOpenDespacho(bus)}
                  >
                    <MapPin className="w-4 h-4" />
                    Despachar
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Modal de Despacho */}
      <DespachoModal
        open={showDespachoModal}
        onOpenChange={setShowDespachoModal}
        bus={selectedBus}
        onDespachar={handleDespachar}
      />
    </>
  );
}
