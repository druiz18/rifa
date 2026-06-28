import { useState } from 'react';
import { useAuth } from '../context/useAuth';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';

export default function Dashboard() {
  const { profile, signOut } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [testInput, setTestInput] = useState('');

  return (
    <div className="p-10 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Panel del Creador</h1>
      <p className="mb-4">Bienvenido, {profile?.nombre}! Tu rol es: <span className="font-bold text-indigo-600">{profile?.role}</span></p>
      
      <button onClick={signOut} className="mb-8 text-red-500 underline">Cerrar Sesión</button>

      {/* --- PRUEBA DE COMPONENTES --- */}
      <div className="border p-6 rounded-lg space-y-4 bg-gray-50">
        <h2 className="text-xl font-semibold">Test UI Components</h2>
        
        <Input 
          id="test" 
          label="Nombre del comprador" 
          value={testInput}
          onChange={(e) => setTestInput(e.target.value)}
          placeholder="Ej: Juan Pérez"
          error={testInput.length > 0 && testInput.length < 3 ? "Mínimo 3 caracteres" : null}
        />

        <Select 
          id="pago" 
          label="Método de pago" 
          options={[
            { value: 'efectivo', label: 'Efectivo' },
            { value: 'transferencia', label: 'Transferencia' }
          ]} 
        />

        <div className="flex gap-4">
          <Button onClick={() => setIsModalOpen(true)}>
            Abrir Modal de Compra
          </Button>
          <Button variant="danger" loading={false}>
            Botón Peligro
          </Button>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Reservar Puesto #15">
        <p className="text-gray-600 mb-4">Completa tus datos para reservar este puesto. El creador verificará tu pago.</p>
        <div className="space-y-4">
          <Input id="modal-nombre" label="Tu Nombre" placeholder="Pedro" />
          <Input id="modal-tel" label="Tu Teléfono" placeholder="555-1234" />
          <Select 
            id="modal-pago" 
            label="¿Cómo vas a pagar?" 
            options={[
              { value: 'efectivo', label: 'Efectivo' },
              { value: 'transferencia', label: 'Transferencia' }
            ]} 
          />
          <Button>Confirmar Reserva</Button>
        </div>
      </Modal>
    </div>
  );
}