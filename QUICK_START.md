# 🚀 SAGEO 2026 - Guia Rápido de Início (5 Minutos)

Bem-vindo à plataforma digital oficial da **Semana Académica de Engenharia e Organização (SAGEO) 2026**.
Esta aplicação foi construída com um simulador local integrado de alta fidelidade para testares o fluxo completo de ponta a ponta sem precisares de configurar credenciais de produção de imediato!

---

## 💻 Testar no Ambiente de Desenvolvimento Local

O projeto já está 100% pronto para correr, com todos os dados persistidos de forma segura no teu navegador (`localStorage`).

### Passo 1: Instalar Dependências
```bash
npm install
```

### Passo 2: Iniciar Servidor de Desenvolvimento
```bash
npm run dev
```

A plataforma estará acessível imediatamente em: `http://localhost:3000` (ou a porta atribuída pelo ambiente).

---

## 🎯 Teste o Fluxo Completo de Ponta-a-Ponta (Simulação)

Siga este guião para entender como a SAGEO monitoriza as presenças físicas dos alunos e emite os certificados em tempo real:

1. **Inscrição Académica**:
   - Vai ao separador **Cronograma**.
   - Escolhe um evento com vagas disponíveis (ex: *Mini-Curso: Gestão de Projetos Ágeis*) e clica em **Garantir Vaga**.
   - Preenche o formulário respondendo de forma consciente à **Pergunta Secreta** (ex. *"Nome do teu primeiro animal?"* -> *"Rex"*).
   - Submete e vê a notificação de sucesso.

2. **Abre a Caixa de Correio Académica**:
   - Vê o painel flutuante verde no canto inferior direito chamado **Simulador de Correio Académico**. Ele simula o envio real por e-mail da confirmação.
   - Abre o simulador e clica em **Confirmar Inscrição** no e-mail correspondente.

3. **Geração do Bilhete & QR Code**:
   - Ao clicares no link de confirmação do correio, o sistema valida o token e o teu **Bilhete de Entrada SAGEO** é aberto na Homepage com um **QR Code único**.

4. **Entrada e Portaria do Evento (Painel Admin)**:
   - Vai ao menu **Painel Admin** no cabeçalho e insere o código administrativo definido no teu ficheiro de ambiente (`ADMIN_PASSCODES` no `.env`).
   - Clica no separador **Leitor QR (Check-In)**.
   - Vê o simulador integrado de câmara móvel. Clica no QR Code gerado anteriormente para simular o scan da portaria física.
   - O ecrã pedirá a resposta oral da pergunta do participante. Insere a resposta exata (*"Rex"*) e clica em **Validar Resposta**.
   - O sistema realiza a validação criptográfica via hash no mesmo instante!

5. **Emissão de Certificado**:
   - Após o Check-in ser dado como validado pelo Staff técnico, o participante recebe uma certidão académica visível na homepage que pode transferir em **PDF** para o seu currículo.

---

## 🗄️ Integração com Produção (Supabase & Resend API)

Caso queiras conectar esta interface ao teu próprio servidor de produção centralizado:

1. Cria um projeto no **Supabase** (PostgreSQL).
2. Abre o **SQL Editor** no dashboard da Supabase e executa o conteúdo do ficheiro `/DATABASE_SCHEMA.sql` anexado na raiz deste projeto.
3. Cria a tua conta na **Resend** (resend.com) para triggers reais de emails institucionais.
4. Preenche as variáveis correspondentes no teu ficheiro de ambiente `.env` seguindo o template `.env.example`.

A SAGEO 2026 está totalmente operacional e polida para o sucesso das atividades científicas! 🎓🚀
