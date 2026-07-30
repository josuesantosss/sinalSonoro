// ============================================
// SISTEMA DE SINAL SONORO - APENAS MP3
// ============================================

const HORARIOS = {
    '700': { hora: '07:00', label: '07:00', tipo: 'normal' },
    '745': { hora: '07:45', label: '07:45', tipo: 'normal' },
    '750': { hora: '07:50', label: '07:50', tipo: 'normal' },
    '840': { hora: '08:40', label: '08:40', tipo: 'normal' },
    '930': { hora: '09:30', label: '09:30', tipo: 'normal' },
    '1020': { hora: '10:20', label: '10:20', tipo: 'intervalo' },
    '1040': { hora: '10:40', label: '10:40', tipo: 'intervalo' },
    '1130': { hora: '11:30', label: '11:30', tipo: 'normal' }
};

let sistemaAtivo = false;
let intervalId = null;
let ultimoToque = null;
let audioAtual = null;

function iniciarSistema() {
    if (sistemaAtivo) {
        adicionarLog('Sistema já está em execução');
        return;
    }

    sistemaAtivo = true;
    document.getElementById('statusSistema').className = 'status-indicator status-ativo';
    document.getElementById('statusSistema').textContent = '🟢 Sistema Ativo';
    
    adicionarLog('✅ Sistema iniciado com sucesso');
    adicionarLog('📅 Aguardando primeiro toque programado...');

    intervalId = setInterval(verificarHorarios, 1000);
    verificarHorarios();
    atualizarHora();
}

function pararSistema() {
    if (!sistemaAtivo) {
        adicionarLog('Sistema já está parado');
        return;
    }

    sistemaAtivo = false;
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
    }
    
    if (audioAtual) {
        audioAtual.pause();
        audioAtual = null;
    }
    
    document.getElementById('statusSistema').className = 'status-indicator status-inativo';
    document.getElementById('statusSistema').textContent = '🔴 Sistema Desligado';
    adicionarLog('⏹ Sistema parado manualmente');
}

function testarSom() {
    const audio = new Audio('./745.mp3');
    audio.volume = 0.7;
    audio.play()
        .then(() => adicionarLog('✅ Teste: 700.mp3 reproduzido com sucesso'))
        .catch(e => adicionarLog('❌ Teste falhou: ' + e.message));
}

function tocarSom(horario) {
    if (!sistemaAtivo) return;

    if (audioAtual) {
        audioAtual.pause();
        audioAtual = null;
    }

    const nomeArquivo = horario.hora.replace(':', '');
    const audio = new Audio(`./${nomeArquivo}.mp3`);
    audioAtual = audio;
    audio.volume = 0.7;
    
    audio.play()
        .then(() => {
            const mensagem = horario.tipo === 'intervalo' 
                ? `🔔 INTERVALO - ${horario.label}`
                : `🔔 TROCA DE AULA - ${horario.label}`;
            adicionarLog(mensagem + ' ✅');
            ultimoToque = horario.hora;
        })
        .catch(e => {
            adicionarLog(`❌ ERRO: ${nomeArquivo}.mp3 não pode ser reproduzido`);
            adicionarLog(`   Verifique se o arquivo existe na pasta`);
        });
}

function verificarHorarios() {
    const agora = new Date();
    const horaStr = `${agora.getHours().toString().padStart(2, '0')}:${agora.getMinutes().toString().padStart(2, '0')}`;
    const segundos = agora.getSeconds();
    
    if (segundos === 0) {
        for (const [key, horario] of Object.entries(HORARIOS)) {
            if (horario.hora === horaStr && ultimoToque !== horaStr) {
                tocarSom(horario);
                break;
            }
        }
    }
    
    atualizarProximoToque(horaStr);
}

function atualizarProximoToque(horaAtual) {
    const horariosArray = Object.values(HORARIOS).sort((a, b) => a.hora.localeCompare(b.hora));
    let proximo = horariosArray.find(h => h.hora > horaAtual) || horariosArray[0];
    if (proximo) {
        document.getElementById('proximoToque').textContent = proximo.label;
    }
}

function atualizarHora() {
    const agora = new Date();
    document.getElementById('horaAtual').textContent = 
        `${agora.getHours().toString().padStart(2, '0')}:${agora.getMinutes().toString().padStart(2, '0')}:${agora.getSeconds().toString().padStart(2, '0')}`;
    setTimeout(atualizarHora, 1000);
}

function adicionarLog(mensagem) {
    const logArea = document.getElementById('logArea');
    const hora = new Date().toLocaleTimeString('pt-BR');
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.innerHTML = `<span class="time">[${hora}]</span>${mensagem}`;
    logArea.appendChild(entry);
    logArea.scrollTop = logArea.scrollHeight;
    while (logArea.children.length > 100) {
        logArea.removeChild(logArea.firstChild);
    }
}

// Inicialização
atualizarHora();
const agora = new Date();
atualizarProximoToque(`${agora.getHours().toString().padStart(2, '0')}:${agora.getMinutes().toString().padStart(2, '0')}`);
adicionarLog('🚀 Sistema carregado. Clique em "Iniciar" para ativar.');
adicionarLog('📁 Os arquivos MP3 devem estar na mesma pasta do sistema.');