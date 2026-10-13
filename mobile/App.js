import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  SafeAreaView,
  StatusBar,
  Image
} from 'react-native';

// ⚠️ SEU IP LOCAL
const API_URL = "http://192.168.1.41:5000";

const ESPACOS = [
  "Laboratório 1", "Laboratório 2", "Laboratório 3", "Laboratório 4",
  "Ginásio", "Auditório", "Sala de Adm", "Sala de Edificações", "Laboratorio Quimica"
];

const TURNOS = {
  matutino: ["07:10 - 08:00", "08:00 - 08:50", "08:50 - 09:40", "09:55 - 10:45", "10:45 - 11:35", "11:35 - 12:25"],
  vespertino: ["13:10 - 14:00", "14:00 - 14:50", "14:50 - 15:40", "15:55 - 16:45", "16:45 - 17:35", "17:35 - 18:25"],
  noturno: ["18:40 - 19:30", "19:30 - 20:20", "20:30 - 21:20", "21:20 - 22:10", "22:10 - 23:00"]
};

export default function App() {
  const [aba, setAba] = useState('inicio'); // inicio, reservas, minhas, prof, login
  const [usuario, setUsuario] = useState(null);
  const [reservas, setReservas] = useState([]);
  const [professores, setProfessores] = useState([]);

  // Login / Cadastro
  const [modoAuth, setModoAuth] = useState('in');
  const [cpf, setCpf] = useState('');
  const [senha, setSenha] = useState('');
  const [nome, setNome] = useState('');

  // Reservas
  const [dataSel, setDataSel] = useState(new Date().toISOString().split('T')[0]);
  const [espacoSel, setEspacoSel] = useState(ESPACOS[0]);
  const [turnoSel, setTurnoSel] = useState('matutino');
  const [modalVisivel, setModalVisivel] = useState(false);
  const [horarioPendente, setHorarioPendente] = useState('');
  const [turma, setTurma] = useState('');

  // Admin
  const [cpfNovoProf, setCpfNovoProf] = useState('');
  const [nomeNovoProf, setNomeNovoProf] = useState('');

  const soDigitos = v => String(v).replace(/\D/g, "").slice(0, 11);

  const carregarDados = async () => {
    try {
      const [resR, resP] = await Promise.all([
        fetch(`${API_URL}/reservas`),
        fetch(`${API_URL}/professores`)
      ]);
      if (resR.ok) setReservas(await resR.json());
      if (resP.ok) setProfessores(await resP.json());
    } catch (e) {
      // tratamento silencioso
    }
  };

  useEffect(() => { carregarDados(); }, []);

  const handleAuth = async () => {
    const cpfLimpo = soDigitos(cpf);
    if (!cpfLimpo || !senha) return Alert.alert("Atenção", "Preencha CPF e senha.");

    try {
      if (modoAuth === 'up') {
        if (!nome) return Alert.alert("Atenção", "Informe seu nome completo.");
        const res = await fetch(`${API_URL}/usuarios`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cpf: cpfLimpo, nome, senha })
        });
        const dados = await res.json();
        if (!res.ok) return Alert.alert("Erro", dados.erro || "Erro ao criar conta.");
        setUsuario({ nome, cpf: cpfLimpo, papel: dados.papel });
      } else {
        const res = await fetch(`${API_URL}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cpf: cpfLimpo, senha })
        });
        const dados = await res.json();
        if (!res.ok) return Alert.alert("Erro", dados.erro || "CPF/Senha incorretos.");
        setUsuario(dados.usuario);
      }
      setCpf(''); setSenha(''); setNome('');
      setAba('reservas');
    } catch (e) {
      Alert.alert("Erro", "Falha na conexão com o servidor.");
    }
  };

  const confirmarReserva = async () => {
    if (!turma.trim()) return Alert.alert("Atenção", "Informe a turma ou disciplina.");
    const nova = {
      id: `${Date.now()}`,
      data: dataSel,
      espaco: espacoSel,
      horario: horarioPendente,
      cpf: usuario.cpf,
      nome: usuario.nome,
      turma: turma.trim()
    };

    try {
      const res = await fetch(`${API_URL}/reservas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nova)
      });
      if (res.ok) {
        Alert.alert("Sucesso", "Reserva confirmada!");
        setModalVisivel(false);
        setTurma('');
        carregarDados();
      } else {
        const d = await res.json();
        Alert.alert("Erro", d.erro || "Não foi possível agendar.");
      }
    } catch (e) {
      Alert.alert("Erro", "Erro ao conectar.");
    }
  };

  const cancelarReserva = async (id) => {
    Alert.alert("Cancelar", "Deseja cancelar esta reserva?", [
      { text: "Voltar" },
      { text: "Confirmar", onPress: async () => {
        try {
          const res = await fetch(`${API_URL}/reservas/${id}`, { method: "DELETE" });
          if (res.ok) {
            carregarDados();
          }
        } catch (e) {}
      }}
    ]);
  };

  const adicionarProfessor = async () => {
    const c = soDigitos(cpfNovoProf);
    if (!c || !nomeNovoProf) return Alert.alert("Atenção", "Preencha CPF e Nome.");
    try {
      const res = await fetch(`${API_URL}/professores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cpf: c, nome: nomeNovoProf })
      });
      if (res.ok) {
        Alert.alert("Sucesso", "Professor autorizado!");
        setCpfNovoProf(''); setNomeNovoProf('');
        carregarDados();
      }
    } catch (e) {}
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#002b5b" />

      {/* Topo Institucional (Mesmo Azul do Web) */}
      <View style={styles.topBar}>
        <Text style={styles.topBarText}>Centro Estadual de Educação Profissional</Text>
      </View>

      {/* Header com Logo */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <Image 
            source={require('./assets/logo.png')} 
            style={styles.logoImage}
            resizeMode="contain"
          />
          <View>
            <Text style={styles.headerTitle}>Conecta-CEEP</Text>
            <Text style={styles.headerSub}>Reserva de espaços escolares</Text>
          </View>
        </View>

        {usuario ? (
          <TouchableOpacity style={styles.userBadge} onPress={() => { setUsuario(null); setAba('inicio'); }}>
            <Text style={styles.userName}>{usuario.nome.split(' ')[0]}</Text>
            <Text style={styles.logoutText}>Sair</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.btnEntrarHeader} onPress={() => setAba('login')}>
            <Text style={styles.btnEntrarHeaderTxt}>Entrar</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Navegação Principal */}
      <View style={styles.navBar}>
        <TouchableOpacity style={[styles.navTab, aba==='inicio'&&styles.navTabActive]} onPress={() => setAba('inicio')}>
          <Text style={[styles.navText, aba==='inicio'&&styles.navTextActive]}>Início</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.navTab, aba==='reservas'&&styles.navTabActive]} onPress={() => setAba('reservas')}>
          <Text style={[styles.navText, aba==='reservas'&&styles.navTextActive]}>Reservas</Text>
        </TouchableOpacity>
        {usuario && (
          <TouchableOpacity style={[styles.navTab, aba==='minhas'&&styles.navTabActive]} onPress={() => setAba('minhas')}>
            <Text style={[styles.navText, aba==='minhas'&&styles.navTextActive]}>Minhas</Text>
          </TouchableOpacity>
        )}
        {usuario?.papel === 'coordenacao' && (
          <TouchableOpacity style={[styles.navTab, aba==='prof'&&styles.navTabActive]} onPress={() => setAba('prof')}>
            <Text style={[styles.navText, aba==='prof'&&styles.navTextActive]}>Equipe</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Conteúdo */}
      <ScrollView style={styles.content}>
        {aba === 'inicio' && (
          <View style={styles.page}>
            <View style={styles.heroBanner}>
              <Text style={styles.heroTitle}>Reserva de espaços escolares</Text>
              <Text style={styles.heroSub}>Consulte a disponibilidade e agende os ambientes em um único sistema.</Text>
              <TouchableOpacity style={styles.btnCta} onPress={() => setAba('reservas')}>
                <Text style={styles.btnCtaText}>Acessar o calendário</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Agenda de hoje</Text>
              {reservas.filter(r => r.data === new Date().toISOString().split('T')[0]).length === 0 ? (
                <Text style={styles.emptyText}>Nenhum espaço reservado para hoje.</Text>
              ) : (
                reservas.filter(r => r.data === new Date().toISOString().split('T')[0]).map(r => (
                  <View key={r.id} style={styles.agendaItem}>
                    <Text style={styles.agendaHora}>{r.horario}</Text>
                    <Text style={styles.agendaDesc}><Text style={{fontWeight: 'bold'}}>{r.espaco}</Text> · {r.turma} ({r.nome})</Text>
                  </View>
                ))
              )}
            </View>
          </View>
        )}

        {aba === 'login' && (
          <View style={styles.page}>
            <View style={styles.cardAuth}>
              <Image source={require('./assets/logo.png')} style={styles.logoAuth} resizeMode="contain" />
              <Text style={styles.authTitle}>{modoAuth === 'in' ? 'Acesso ao Conecta-CEEP' : 'Criar Conta de Professor'}</Text>

              {modoAuth === 'up' && (
                <TextInput style={styles.input} placeholder="Nome Completo" value={nome} onChangeText={setNome} />
              )}
              <TextInput style={styles.input} placeholder="CPF" keyboardType="numeric" value={cpf} onChangeText={setCpf} />
              <TextInput style={styles.input} placeholder="Senha" secureTextEntry value={senha} onChangeText={setSenha} />

              <TouchableOpacity style={styles.btnPrimary} onPress={handleAuth}>
                <Text style={styles.btnText}>{modoAuth === 'in' ? 'Entrar' : 'Cadastrar'}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={{marginTop: 15}} onPress={() => setModoAuth(modoAuth === 'in' ? 'up' : 'in')}>
                <Text style={styles.linkText}>{modoAuth === 'in' ? 'Novo por aqui? Criar conta' : 'Já possui cadastro? Fazer Login'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {aba === 'reservas' && (
          <View style={styles.page}>
            <Text style={styles.pageTitle}>Quadro de Disponibilidade</Text>

            {/* Carrossel de Espaços */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 12}}>
              {ESPACOS.map(e => (
                <TouchableOpacity key={e} style={[styles.chip, espacoSel===e&&styles.chipActive]} onPress={() => setEspacoSel(e)}>
                  <Text style={[styles.chipText, espacoSel===e&&styles.chipTextActive]}>{e}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Seletor de Turnos */}
            <View style={styles.rowTurnos}>
              {['matutino', 'vespertino', 'noturno'].map(t => (
                <TouchableOpacity key={t} style={[styles.btnTurno, turnoSel===t&&styles.btnTurnoActive]} onPress={() => setTurnoSel(t)}>
                  <Text style={[styles.textTurno, turnoSel===t&&styles.textTurnoActive]}>{t.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Slots de Horários */}
            {TURNOS[turnoSel].map(h => {
              const res = reservas.find(r => r.data === dataSel && r.espaco.toLowerCase() === espacoSel.toLowerCase() && r.horario === h);
              const ehMeu = res && usuario && soDigitos(res.cpf) === soDigitos(usuario.cpf);

              return (
                <View key={h} style={[styles.slot, !res ? styles.slotLivre : ehMeu ? styles.slotMeu : styles.slotOcupado]}>
                  <View style={{flex: 1}}>
                    <Text style={styles.slotHora}>{h}</Text>
                    <Text style={styles.slotDesc}>
                      {!res ? 'Disponível' : ehMeu ? `Sua reserva (${res.turma})` : `${res.nome} (${res.turma})`}
                    </Text>
                  </View>

                  {!res ? (
                    <TouchableOpacity style={styles.btnReservarSlot} onPress={() => {
                      if (!usuario) return Alert.alert("Acesso", "Entre na sua conta para agendar.");
                      setHorarioPendente(h);
                      setModalVisivel(true);
                    }}>
                      <Text style={styles.btnReservarSlotTxt}>Reservar</Text>
                    </TouchableOpacity>
                  ) : ehMeu ? (
                    <TouchableOpacity style={styles.btnCancelarSlot} onPress={() => cancelarReserva(res.id)}>
                      <Text style={styles.btnCancelarSlotTxt}>Cancelar</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              );
            })}
          </View>
        )}

        {aba === 'minhas' && (
          <View style={styles.page}>
            <Text style={styles.pageTitle}>Minhas Reservas</Text>
            {reservas.filter(r => usuario && soDigitos(r.cpf) === soDigitos(usuario.cpf)).length === 0 ? (
              <Text style={styles.emptyText}>Você não possui reservas agendadas.</Text>
            ) : (
              reservas.filter(r => usuario && soDigitos(r.cpf) === soDigitos(usuario.cpf)).map(r => (
                <View key={r.id} style={styles.cardReservaItem}>
                  <Text style={styles.cardTitle}>{r.espaco}</Text>
                  <Text style={{color: '#555'}}>{r.data} — {r.horario}</Text>
                  <Text style={{color: '#555'}}>Turma: {r.turma}</Text>
                  <TouchableOpacity style={styles.btnDanger} onPress={() => cancelarReserva(r.id)}>
                    <Text style={styles.btnText}>Cancelar Reserva</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}

        {aba === 'prof' && usuario?.papel === 'coordenacao' && (
          <View style={styles.page}>
            <Text style={styles.pageTitle}>Autorização de Professores</Text>
            <View style={styles.card}>
              <TextInput style={styles.input} placeholder="CPF do Professor" keyboardType="numeric" value={cpfNovoProf} onChangeText={setCpfNovoProf} />
              <TextInput style={styles.input} placeholder="Nome Completo" value={nomeNovoProf} onChangeText={setNomeNovoProf} />
              <TouchableOpacity style={styles.btnPrimary} onPress={adicionarProfessor}>
                <Text style={styles.btnText}>Autorizar Novo Professor</Text>
              </TouchableOpacity>
            </View>
            <Text style={{fontWeight: 'bold', marginVertical: 10}}>Professores Autorizados:</Text>
            {professores.map(p => (
              <View key={p.cpf} style={styles.profRow}>
                <Text style={{fontWeight: 'bold'}}>{p.nome}</Text>
                <Text style={{color: '#777'}}>{p.cpf}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Modal Confirmação */}
      <Modal visible={modalVisivel} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={styles.cardTitle}>Confirmar Agendamento</Text>
            <Text style={{color: '#004085', fontWeight: 'bold', marginBottom: 10}}>{espacoSel} · {horarioPendente}</Text>
            <TextInput style={styles.input} placeholder="Informe a Turma ou Atividade" value={turma} onChangeText={setTurma} />
            <View style={{flexDirection: 'row', marginTop: 10}}>
              <TouchableOpacity style={[styles.btnPrimary, {flex: 1, backgroundColor: '#6c757d'}]} onPress={() => setModalVisivel(false)}>
                <Text style={styles.btnText}>Voltar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btnPrimary, {flex: 1, marginLeft: 10}]} onPress={confirmarReserva}>
                <Text style={styles.btnText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f9' },
  topBar: { backgroundColor: '#002b5b', paddingVertical: 4, paddingHorizontal: 15 },
  topBarText: { color: '#e0a800', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  header: { backgroundColor: '#004085', padding: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logoRow: { flexDirection: 'row', alignItems: 'center' },
  logoImage: { width: 38, height: 38, marginRight: 10 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  headerSub: { color: '#b8daff', fontSize: 11 },
  userBadge: { backgroundColor: '#002b5b', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, alignItems: 'center' },
  userName: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  logoutText: { color: '#ffc107', fontSize: 10 },
  btnEntrarHeader: { backgroundColor: '#0056b3', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
  btnEntrarHeaderTxt: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  navBar: { flexDirection: 'row', backgroundColor: '#fff', elevation: 3, borderBottomWidth: 1, borderBottomColor: '#dee2e6' },
  navTab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  navTabActive: { borderBottomWidth: 3, borderBottomColor: '#004085' },
  navText: { color: '#495057', fontSize: 13, fontWeight: '500' },
  navTextActive: { color: '#004085', fontWeight: 'bold' },
  content: { flex: 1, padding: 15 },
  page: { paddingBottom: 30 },
  pageTitle: { fontSize: 18, fontWeight: 'bold', color: '#004085', marginBottom: 12 },
  heroBanner: { backgroundColor: '#0056b3', padding: 18, borderRadius: 10, marginBottom: 15 },
  heroTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 6 },
  heroSub: { color: '#e7f1ff', fontSize: 13, marginBottom: 12 },
  btnCta: { backgroundColor: '#ffc107', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 6, alignSelf: 'flex-start' },
  btnCtaText: { color: '#212529', fontWeight: 'bold', fontSize: 13 },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 15, elevation: 2, borderWidth: 1, borderColor: '#e9ecef' },
  cardAuth: { backgroundColor: '#fff', padding: 20, borderRadius: 10, elevation: 3, alignItems: 'center' },
  logoAuth: { width: 60, height: 60, marginBottom: 10 },
  authTitle: { fontSize: 16, fontWeight: 'bold', color: '#004085', marginBottom: 15 },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#004085', marginBottom: 10 },
  emptyText: { color: '#6c757d', fontSize: 13, fontStyle: 'italic' },
  agendaItem: { paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f1f3f5' },
  agendaHora: { fontSize: 11, color: '#0056b3', fontWeight: 'bold' },
  agendaDesc: { fontSize: 13, color: '#333' },
  input: { borderWidth: 1, borderColor: '#ced4da', borderRadius: 6, padding: 10, marginBottom: 10, width: '100%', backgroundColor: '#fff' },
  btnPrimary: { backgroundColor: '#0056b3', padding: 12, borderRadius: 6, alignItems: 'center', width: '100%' },
  btnDanger: { backgroundColor: '#dc3545', padding: 10, borderRadius: 6, alignItems: 'center', marginTop: 10 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  linkText: { color: '#0056b3', fontSize: 13, textDecorationLine: 'underline' },
  chip: { backgroundColor: '#e9ecef', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8 },
  chipActive: { backgroundColor: '#004085' },
  chipText: { color: '#495057', fontSize: 13 },
  chipTextActive: { color: '#fff', fontWeight: 'bold' },
  rowTurnos: { flexDirection: 'row', marginBottom: 12 },
  btnTurno: { flex: 1, paddingVertical: 8, alignItems: 'center', backgroundColor: '#e9ecef', marginHorizontal: 2, borderRadius: 4 },
  btnTurnoActive: { backgroundColor: '#0056b3' },
  textTurno: { fontSize: 11, color: '#495057', fontWeight: 'bold' },
  textTurnoActive: { color: '#fff' },
  slot: { padding: 12, borderRadius: 6, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1 },
  slotLivre: { backgroundColor: '#e7f1ff', borderColor: '#b8daff' },
  slotMeu: { backgroundColor: '#fff3cd', borderColor: '#ffeeba' },
  slotOcupado: { backgroundColor: '#f8d7da', borderColor: '#f5c6cb' },
  slotHora: { fontWeight: 'bold', fontSize: 12, color: '#004085' },
  slotDesc: { fontSize: 12, color: '#495057', marginTop: 2 },
  btnReservarSlot: { backgroundColor: '#28a745', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4 },
  btnReservarSlotTxt: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  btnCancelarSlot: { backgroundColor: '#dc3545', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4 },
  btnCancelarSlotTxt: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  cardReservaItem: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 10, elevation: 2, borderWidth: 1, borderColor: '#dee2e6' },
  profRow: { backgroundColor: '#fff', padding: 10, borderRadius: 4, marginBottom: 5, borderWidth: 1, borderColor: '#e9ecef' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#fff', padding: 20, borderRadius: 8 }
});