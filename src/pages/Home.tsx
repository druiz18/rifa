import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import { useAuth } from '../context/useAuth';
import { version } from '../../package.json';

export default function Home() {
  const { user } = useAuth();
  return (
    <div className="bg-gray-50">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto py-20 px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
          <span className="block">Crea y gestiona tus</span>
          <span className="block text-indigo-600">sorteos de forma fácil</span>
        </h1>
        <p className="mt-6 text-xl text-gray-500">
          Publica tu rifa, comparte el enlace con tus clientes, gestiona los pagos y realiza el sorteo todo desde un solo lugar.
        </p>
        <div className="mt-10 flex justify-center gap-4">
          {user?<Link to={"/crear-sorteo"}>
            <Button className="w-auto! px-8! py-3! text-base">+ Crear sorteo</Button>
          </Link>:
          <Link to={"/login"}>
            <Button className="w-auto! px-8! py-3! text-base">Crear mi primer sorteo</Button>
          </Link>
          }
          
        </div>
      </div>

      {/* Cómo funciona */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">¿Cómo funciona?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

            <div className="text-center p-6">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold mb-4">1</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Crea tu sorteo</h3>
              <p className="text-gray-500">Sube la imagen del premio, define el precio por puesto y la cantidad de números disponibles.</p>
            </div>

            <div className="text-center p-6">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold mb-4">2</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Comparte el enlace</h3>
              <p className="text-gray-500">Obtén un enlace único y envíalo por WhatsApp. Tus clientes eligen su número y dejan sus datos.</p>
            </div>

            <div className="text-center p-6">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold mb-4">3</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Gestiona y Sortea</h3>
              <p className="text-gray-500">Recibe los pagos, marca los puestos como pagados y usa nuestro generador aleatorio para el sorteo.</p>
            </div>

          </div>
        </div>
      </div>

      {/* Políticas, Seguridad y Prevención */}
      <div className="max-w-4xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-sm border p-8 md:p-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
            Políticas de Privacidad y Seguridad
          </h2>

          <div className="prose prose-sm text-gray-600 space-y-4">
            <p>
              <strong>Alcance de la plataforma:</strong> SorteosApp es una herramienta de gestión y organización. No somos una casa de apuestas ni un casino. La responsabilidad del sorteo, la entrega de premios y la transparencia recae 100% sobre el creador del sorteo.
            </p>

            <p>
              <strong>Prevención de fraude:</strong> Recomendamos encarecidamente a los compradores verificar la identidad del creador antes de realizar cualquier pago. Exija comprobantes de sorteos anteriores si los hay.
            </p>

            <p>
              <strong>Protección de datos:</strong> Los números de teléfono y nombres proporcionados por los compradores se utilizan única y exclusivamente para la trazabilidad del sorteo en el que participan. No compartimos esta información con terceros ni se utiliza para spam.
            </p>

            <p>
              <strong>Recomendación de pago:</strong> Para el creador, sugerimos siempre utilizar transferencias bancarias que dejen rastro electrónico (número de referencia, captura) para facilitar la conciliación de pagos y evitar disputas.
            </p>
          </div>
        </div>
      </div>

      {/* Footer simple */}
      <footer className="bg-white border-t py-6 text-center text-sm text-gray-400">
        © {new Date().getFullYear()} Rifa-co. Todos los derechos reservados.
        <br />
        v{version}
      </footer>
    </div>
  );
}