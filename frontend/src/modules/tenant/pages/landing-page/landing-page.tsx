import { Link } from 'react-router';
import { Button } from '../../../../shared/components';
import { Calendar, Clock, Smartphone, Star, ShieldCheck, CheckCircle2 } from 'lucide-react';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      
      {/* Header/Nav Simples */}
      <header className="px-4 py-4 md:px-8 flex items-center justify-between bg-white shadow-sm sticky top-0 z-50">
        <div className="font-bold text-xl text-blue-600">Agenda Fácil</div>
        <div className="flex items-center space-x-4">
          <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 hidden sm:block">
            Já tenho conta
          </Link>
          <Link to="/register">
            <Button size="sm">Testar Grátis</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-4 py-16 md:py-24 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium mb-6">
          <span className="flex h-2 w-2 rounded-full bg-blue-600"></span>
          <span>Teste 30 dias sem compromisso</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
          Simplifique a gestão do seu negócio e foque nos seus clientes
        </h1>
        <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          A plataforma perfeita para Salões de Beleza, Barbearias, Esmalterias e Clínicas de Estética. Agendamentos 24h, controle de profissionais e serviços direto do seu celular.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4">
          <Link to="/register" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto text-lg px-8 py-6 h-auto">
              Testar Grátis por 30 Dias
            </Button>
          </Link>
        </div>
        <p className="mt-4 text-sm text-gray-500 flex items-center justify-center">
          <CheckCircle2 className="w-4 h-4 mr-1 text-green-500" />
          Não requer cartão de crédito para começar.
        </p>
      </section>

      {/* Benefícios */}
      <section className="bg-white py-16 md:py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Tudo que você precisa em um só lugar</h2>
            <p className="text-gray-600">Chega de confusão no WhatsApp e caderninhos de papel.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">Sua agenda 24/7</h3>
              <p className="text-gray-600">
                Seus clientes marcam horários pelo seu link exclusivo a qualquer momento, mesmo quando o salão está fechado.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">Gestão de Profissionais</h3>
              <p className="text-gray-600">
                Controle os serviços, a duração e os valores de forma individual para cada barbeiro, manicure ou cabeleireiro.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">100% na Nuvem</h3>
              <p className="text-gray-600">
                Acesse do celular, tablet ou computador. Sem precisar instalar nenhum aplicativo pesado.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 md:py-24 px-4 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">Quem usa, recomenda</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex text-yellow-400 mb-3">
              <Star className="fill-current w-5 h-5" /><Star className="fill-current w-5 h-5" /><Star className="fill-current w-5 h-5" /><Star className="fill-current w-5 h-5" /><Star className="fill-current w-5 h-5" />
            </div>
            <p className="text-gray-700 italic mb-4">
              "Desde que coloquei o sistema na minha barbearia, os clientes pararam de me mandar mensagem de madrugada perguntando se tinha horário. Agora eles mesmos agendam e eu só olho a tela de manhã."
            </p>
            <div className="font-semibold">— Marcos Silva, Barbearia do Marcão</div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex text-yellow-400 mb-3">
              <Star className="fill-current w-5 h-5" /><Star className="fill-current w-5 h-5" /><Star className="fill-current w-5 h-5" /><Star className="fill-current w-5 h-5" /><Star className="fill-current w-5 h-5" />
            </div>
            <p className="text-gray-700 italic mb-4">
              "A melhor parte é gerenciar a agenda das minhas 4 manicures. Cada uma tem seu tempo de serviço e o sistema organiza tudo sem choque de horários."
            </p>
            <div className="font-semibold">— Ana Costa, Studio Elegance (Esmalteria)</div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white py-16 md:py-24 px-4 border-t border-gray-100">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Perguntas Frequentes</h2>
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-bold flex items-center">
                <ShieldCheck className="w-5 h-5 mr-2 text-blue-600" />
                Preciso colocar o cartão de crédito para testar?
              </h4>
              <p className="text-gray-600 mt-2 ml-7">
                Não. Nós confiamos tanto que o sistema vai te ajudar que não pedimos cartão de crédito na inscrição. Você usa 30 dias grátis de verdade.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-bold flex items-center">
                <ShieldCheck className="w-5 h-5 mr-2 text-blue-600" />
                Meus clientes precisam baixar um aplicativo?
              </h4>
              <p className="text-gray-600 mt-2 ml-7">
                Não. Você receberá um link exclusivo do seu salão (ex: agenda.com/seusalao) e seus clientes acessam pelo navegador de qualquer celular. É rápido e prático.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-bold flex items-center">
                <ShieldCheck className="w-5 h-5 mr-2 text-blue-600" />
                Serve para qualquer tipo de negócio de beleza?
              </h4>
              <p className="text-gray-600 mt-2 ml-7">
                Sim! Salões de beleza, barbearias, esmalterias, spas, clínicas de estética e estúdios de maquiagem.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-blue-600 py-16 md:py-24 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Pronto para lotar a sua agenda?
          </h2>
          <p className="text-blue-100 text-lg mb-8">
            Crie sua conta em menos de 1 minuto e veja a diferença na prática.
          </p>
          <Link to="/register">
            <Button className="bg-white text-blue-600 hover:bg-gray-50 text-lg px-8 py-6 h-auto w-full sm:w-auto shadow-lg">
              Criar minha conta gratuita agora
            </Button>
          </Link>
        </div>
      </section>
      
      <footer className="bg-gray-900 py-8 px-4 text-center text-gray-400 text-sm">
        <p>&copy; {new Date().getFullYear()} Agenda Fácil. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
