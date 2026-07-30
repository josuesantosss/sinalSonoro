// ============================================
// SISTEMA DE SINAL SONORO - Lógica Principal
// ============================================

// Configuração dos horários
const HORARIOS = {
    // Horários originais
    '700': { hora: '07:00', label: '07:00', tipo: 'normal' },
    '750': { hora: '07:50', label: '07:50', tipo: 'normal' },
    '840': { hora: '08:40', label: '08:40', tipo: 'normal' },
    '930': { hora: '09:30', label: '09:30', tipo: 'normal' },
    '1020': { hora: '10:20', label: '10:20', tipo: 'intervalo' },
    '1040': { hora: '10:40', label: '10:40', tipo: 'intervalo' },
    '1130': { hora: '11:30', label: '11:30', tipo: 'normal' },

    // ⏰ AVISOS 5 MINUTOS ANTES
    '745': { hora: '07:45', label: '07:45', tipo: 'normal' },
    '835': { hora: '08:35', label: '08:35', tipo: 'aviso' },
    '925': { hora: '09:25', label: '09:25', tipo: 'aviso' },
    '1015': { hora: '10:15', label: '10:15', tipo: 'aviso' },
    '1035': { hora: '10:35', label: '10:35', tipo: 'aviso' },
    '1125': { hora: '11:25', label: '11:25', tipo: 'aviso' }
};

// Estado do sistema
let sistemaAtivo = false;
let intervalId = null;
let audioContext = null;
let ultimoToque = null;
let audioAtual = null;
let totalToques = 0;
let horariosTocados = [];

// ============================================
// FUNÇÕES DE INTERFACE
// ============================================

function renderizarHorarios() {
    const grid = document.getElementById('horarioGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    const horariosArray = Object.values(HORARIOS).sort((a, b) => a.hora.localeCompare(b.hora));
    
    horariosArray.forEach(horario => {
        const div = document.createElement('div');
        div.className = 'horario-item';
        div.id = `horario-${horario.hora.replace(':', '')}`;
        
        if (horario.tipo === 'intervalo') {
            div.classList.add('intervalo');
            div.textContent = `${horario.label} (Intervalo)`;
        } else if (horario.tipo === 'aviso') {
            div.classList.add('aviso');
            div.textContent = `${horario.label} ⏰`;
        } else {
            div.textContent = horario.label;
        }
        
        grid.appendChild(div);
    });
}

function destacarHorario(horario) {
    const id = `horario-${horario.hora.replace(':', '')}`;
    const elemento = document.getElementById(id);
    if (elemento) {
        elemento.classList.add('tocando');
        setTimeout(() => {
            elemento.classList.remove('tocando');
        }, 3000);
    }
}

function atualizarHora() {
    const agora = new Date();
    const horas = agora.getHours().toString().padStart(2, '0');
    const minutos = agora.getMinutes().toString().padStart(2, '0');
    const segundos = agora.getSeconds().toString().padStart(2, '0');
    
    document.getElementById('horaAtual').textContent = `${horas}:${minutos}:${segundos}`;
    
    setTimeout(atualizarHora, 1000);
}

function atualizarProximoToque(horaAtual) {
    const horariosArray = Object.values(HORARIOS).sort((a, b) => a.hora.localeCompare(b.hora));
    let proximo = horariosArray.find(h => h.hora > horaAtual);
    if (!proximo) {
        proximo = horariosArray[0];
    }
    if (proximo) {
        document.getElementById('proximoToque').textContent = `${proximo.label}${proximo.tipo === 'aviso' ? ' ⏰' : ''}`;
    }
}

function atualizarStats() {
    document.getElementById('totalToques').textContent = totalToques;
    document.getElementById('ultimoToqueLabel').textContent = ultimoToque || '--:--';
}

// ============================================
// FUNÇÕES DE ÁUDIO
// ============================================

function tocarSom(horario) {
    if (!sistemaAtivo) {
        adicionarLog('⚠️ Sistema desligado, não é possível tocar', 'erro');
        return;
    }

    // Parar áudio anterior se existir
    if (audioAtual) {
        audioAtual.pause();
        audioAtual = null;
    }

    const nomeArquivo = horario.hora.replace(':', '');
    const url = `./${nomeArquivo}.mp3`;
    
    // Destacar na interface
    destacarHorario(horario);
    
    // Criar elemento de áudio
    const audio = new Audio();
    audio.src = url;
    audioAtual = audio;
    audio.volume = 0.8;
    
    // Tentar reproduzir
    audio.play()
        .then(() => {
            let emoji = '🔔';
            let tipoMsg = '';
            let classe = 'normal';
            
            if (horario.tipo === 'intervalo') {
                emoji = '🎉';
                tipoMsg = 'INTERVALO';
                classe = 'intervalo';
            } else if (horario.tipo === 'aviso') {
                emoji = '⏰';
                tipoMsg = 'AVISO';
                classe = 'aviso';
            } else {
                tipoMsg = 'TROCA DE AULA';
                classe = 'normal';
            }
            
            adicionarLog(`${emoji} ${tipoMsg} - ${horario.label} (${nomeArquivo}.mp3) ✅`, classe);
            ultimoToque = horario.label;
            totalToques++;
            atualizarStats();
        })
        .catch(e => {
            adicionarLog(`❌ ERRO: ${nomeArquivo}.mp3 não pode ser reproduzido - ${e.message}`, 'erro');
            adicionarLog(`   Verifique se o arquivo existe na pasta`, 'erro');
            // Tentar som gerado como fallback
            tocarSomFallback(horario);
        });
}

function tocarSomFallback(horario) {
    try {
        if (!audioContext || audioContext.state === 'closed') {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }

        const now = audioContext.currentTime;
        const frequencias = [523.25, 659.25, 783.99, 1046.50];
        const duracao = 0.15;
        const pausa = 0.1;
        
        // Ajustar número de repetições conforme tipo
        let repeticoes = 3;
        if (horario.tipo === 'intervalo') repeticoes = 6;
        if (horario.tipo === 'aviso') repeticoes = 2;
        
        for (let i = 0; i < repeticoes; i++) {
            const freqIndex = i % frequencias.length;
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            
            osc.connect(gain);
            gain.connect(audioContext.destination);
            
            osc.type = 'sine';
            osc.frequency.value = frequencias[freqIndex];
            
            gain.gain.setValueAtTime(0, now + (i * (duracao + pausa)));
            gain.gain.linearRampToValueAtTime(0.3, now + (i * (duracao + pausa)) + 0.01);
            gain.gain.linearRampToValueAtTime(0, now + (i * (duracao + pausa)) + duracao);
            
            osc.start(now + (i * (duracao + pausa)));
            osc.stop(now + (i * (duracao + pausa)) + duracao);
        }
        
        let emoji = '🔔';
        let tipoMsg = '';
        if (horario.tipo === 'intervalo') {
            emoji = '🎉';
            tipoMsg = 'INTERVALO';
        } else if (horario.tipo === 'aviso') {
            emoji = '⏰';
            tipoMsg = 'AVISO';
        } else {
            tipoMsg = 'TROCA DE AULA';
        }
        
        adicionarLog(`${emoji} ${tipoMsg} - ${horario.label} (som gerado) ⚠️`, 'aviso');
        ultimoToque = horario.label;
        totalToques++;
        atualizarStats();
        
    } catch (e) {
        adicionarLog(`❌ Erro ao gerar som: ${e.message}`, 'erro');
    }
}

function testarSom() {
    const url = './745.mp3';
    const audio = new Audio();
    audio.src = url;
    audio.volume = 0.8;
    
    adicionarLog('🔊 Testando som...', 'normal');
    
    audio.play()
        .then(() => {
            adicionarLog('✅ Teste: 700.mp3 reproduzido com sucesso', 'normal');
        })
        .catch(e => {
            adicionarLog('❌ Teste falhou: 700.mp3 não encontrado', 'erro');
            adicionarLog('   Usando som gerado como fallback', 'aviso');
            // Gerar som de teste
            tocarSomFallback({ tipo: 'normal', label: 'Teste', hora: 'teste' });
        });
}

// ============================================
// FUNÇÕES DE CONTROLE DO SISTEMA
// ============================================

function iniciarSistema() {
    if (sistemaAtivo) {
        adicionarLog('⚠️ Sistema já está em execução', 'aviso');
        return;
    }

    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
        adicionarLog('❌ Navegador não suporta áudio', 'erro');
        alert('Seu navegador não suporta reprodução de áudio. Use Chrome, Firefox ou Edge.');
        return;
    }

    sistemaAtivo = true;
    document.getElementById('statusSistema').className = 'status-indicator status-ativo';
    document.getElementById('statusSistema').textContent = '🟢 Sistema Ativo';
    
    adicionarLog('✅ Sistema iniciado com sucesso', 'normal');
    adicionarLog('📅 Aguardando primeiro toque programado...', 'normal');

    intervalId = setInterval(verificarHorarios, 1000);
    verificarHorarios();
}

function pararSistema() {
    if (!sistemaAtivo) {
        adicionarLog('⚠️ Sistema já está parado', 'aviso');
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
    
    if (audioContext && audioContext.state === 'running') {
        audioContext.close();
    }
    
    document.getElementById('statusSistema').className = 'status-indicator status-inativo';
    document.getElementById('statusSistema').textContent = '🔴 Sistema Desligado';
    
    adicionarLog('⏹ Sistema parado manualmente', 'normal');
}

function limparLog() {
    const logArea = document.getElementById('logArea');
    logArea.innerHTML = '';
    adicionarLog('🗑 Log limpo', 'normal');
}

// ============================================
// FUNÇÃO PRINCIPAL DE VERIFICAÇÃO
// ============================================

function verificarHorarios() {
    if (!sistemaAtivo) return;
    
    const agora = new Date();
    const horaStr = `${agora.getHours().toString().padStart(2, '0')}:${agora.getMinutes().toString().padStart(2, '0')}`;
    const segundos = agora.getSeconds();
    const horaCompleta = `${horaStr}:${segundos.toString().padStart(2, '0')}`;
    
    // Verificar a cada segundo 0
    if (segundos === 0) {
        for (const [key, horario] of Object.entries(HORARIOS)) {
            if (horario.hora === horaStr) {
                // Verificar se já não tocou neste minuto
                if (!horariosTocados.includes(horaStr)) {
                    tocarSom(horario);
                    horariosTocados.push(horaStr);
                }
                break;
            }
        }
    }
    
    // Resetar lista de tocados a cada hora (para permitir novo toque no dia seguinte)
    if (horaStr === '00:00' && segundos === 0) {
        horariosTocados = [];
        totalToques = 0;
        atualizarStats();
    }
    
    atualizarProximoToque(horaStr);
}

// ============================================
// FUNÇÕES DE LOG
// ============================================

function adicionarLog(mensagem, tipo = 'normal') {
    const logArea = document.getElementById('logArea');
    const agora = new Date();
    const hora = agora.toLocaleTimeString('pt-BR');
    
    const entry = document.createElement('div');
    entry.className = `log-entry ${tipo}`;
    entry.innerHTML = `<span class="time">[${hora}]</span>${mensagem}`;
    
    logArea.appendChild(entry);
    logArea.scrollTop = logArea.scrollHeight;
    
    // Manter apenas as últimas 200 mensagens
    while (logArea.children.length > 200) {
        logArea.removeChild(logArea.firstChild);
    }
}

// ============================================
// INICIALIZAÇÃO
// ============================================

// Renderizar horários na interface
renderizarHorarios();

// Iniciar relógio
atualizarHora();

// Verificar próximo toque inicial
const agora = new Date();
const horaAtual = `${agora.getHours().toString().padStart(2, '0')}:${agora.getMinutes().toString().padStart(2, '0')}`;
atualizarProximoToque(horaAtual);

// Pré-inicializar áudio
document.addEventListener('click', () => {
    if (!audioContext) {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            // Silenciosamente ignora
        }
    }
});

// Adicionar logs iniciais
adicionarLog('🚀 Sistema carregado. Clique em "Iniciar" para ativar.', 'normal');
adicionarLog('📁 Certifique-se que os arquivos MP3 estão na mesma pasta.', 'normal');
adicionarLog('⏰ Avisos tocam 5 minutos antes de cada horário.', 'aviso');