// ============================================
// SISTEMA DE SINAL SONORO - Lógica Principal
// ============================================

// Configuração dos horários
const HORARIOS = {
    // Horários normais (AMARELO)
    '700': { hora: '07:00', label: '07:00', tipo: 'normal' },
    '750': { hora: '07:50', label: '07:50', tipo: 'normal' },
    '840': { hora: '08:40', label: '08:40', tipo: 'normal' },
    '930': { hora: '09:30', label: '09:30', tipo: 'normal' },
    '1130': { hora: '11:30', label: '11:30', tipo: 'normal' },
    
    // Intervalos (VERDE)
    '1020': { hora: '10:20', label: '10:20', tipo: 'intervalo' },
    '1040': { hora: '10:40', label: '10:40', tipo: 'intervalo' },
    
    // Avisos 5 minutos antes (AZUL)
    '655': { hora: '06:55', label: '06:55', tipo: 'aviso' },    // 5 min antes das 07:00
    '745': { hora: '07:45', label: '07:45', tipo: 'aviso' },    // 5 min antes das 07:50
    '835': { hora: '08:35', label: '08:35', tipo: 'aviso' },    // 5 min antes das 08:40
    '925': { hora: '09:25', label: '09:25', tipo: 'aviso' },    // 5 min antes das 09:30
    '1015': { hora: '10:15', label: '10:15', tipo: 'aviso' },   // 5 min antes das 10:20
    '1035': { hora: '10:35', label: '10:35', tipo: 'aviso' },   // 5 min antes das 10:40
    '1125': { hora: '11:25', label: '11:25', tipo: 'aviso' }    // 5 min antes das 11:30
};

// Estado do sistema
let sistemaAtivo = false;
let intervalId = null;
let audioContext = null;
let ultimoToque = null;
let audioAtual = null;

// ============================================
// FUNÇÃO PARA RENDERIZAR OS HORÁRIOS
// ============================================

function renderizarHorarios() {
    const grid = document.getElementById('horarioGrid');
    if (!grid) {
        console.error('Grid de horários não encontrado!');
        return;
    }
    
    // Limpa a grid
    grid.innerHTML = '';
    
    // Ordena os horários pela hora
    const horariosArray = Object.values(HORARIOS).sort((a, b) => a.hora.localeCompare(b.hora));
    
    // Adiciona cada horário à grid
    horariosArray.forEach(horario => {
        const div = document.createElement('div');
        div.className = `horario-item ${horario.tipo}`;
        div.textContent = horario.label;
        grid.appendChild(div);
    });
    
    console.log(`✅ ${horariosArray.length} horários renderizados`);
}

// ============================================
// FUNÇÕES PRINCIPAIS
// ============================================

function iniciarSistema() {
    if (sistemaAtivo) {
        adicionarLog('Sistema já está em execução');
        return;
    }

    // Verificar se o navegador suporta Web Audio API
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
        adicionarLog('❌ Erro: Navegador não suporta áudio');
        alert('Seu navegador não suporta reprodução de áudio. Use Chrome, Firefox ou Edge.');
        return;
    }

    sistemaAtivo = true;
    document.getElementById('statusSistema').className = 'status-indicator status-ativo';
    document.getElementById('statusSistema').textContent = '🟢 Sistema Ativo';
    
    adicionarLog('✅ Sistema iniciado com sucesso');
    adicionarLog('📅 Aguardando primeiro toque programado...');

    // Verificar horários a cada segundo
    intervalId = setInterval(verificarHorarios, 1000);
    
    // Verificar imediatamente
    verificarHorarios();
    
    // Atualizar hora atual
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
    
    // Parar áudio atual se estiver tocando
    if (audioAtual) {
        audioAtual.pause();
        audioAtual = null;
    }
    
    if (audioContext && audioContext.state === 'running') {
        audioContext.close();
    }
    
    document.getElementById('statusSistema').className = 'status-indicator status-inativo';
    document.getElementById('statusSistema').textContent = '🔴 Sistema Desligado';
    
    adicionarLog('⏹ Sistema parado manualmente');
}

function testarSom() {
    // Testar o arquivo 700.mp3
    const url = './700.mp3';
    const audio = new Audio();
    audio.src = url;
    
    audio.oncanplaythrough = function() {
        audio.volume = 0.7;
        audio.play()
            .then(() => {
                adicionarLog('✅ Teste: 700.mp3 reproduzido com sucesso');
            })
            .catch(e => {
                adicionarLog('❌ Erro ao testar 700.mp3: ' + e.message);
                tocarSomFallback(null, 'Teste');
            });
    };
    
    audio.onerror = function() {
        adicionarLog('⚠️ Arquivo 700.mp3 não encontrado para teste');
        tocarSomFallback(null, 'Teste');
    };
    
    audio.load();
}

// ============================================
// FUNÇÕES DE ÁUDIO
// ============================================

function tocarSom(horario) {
    if (!sistemaAtivo) {
        adicionarLog('⚠️ Sistema desligado, não é possível tocar');
        return;
    }

    // Parar áudio anterior se existir
    if (audioAtual) {
        audioAtual.pause();
        audioAtual = null;
    }

    const nomeArquivo = horario.hora.replace(':', '');
    const url = `./${nomeArquivo}.mp3`;
    
    // Tentar carregar e reproduzir o MP3
    const audio = new Audio();
    audio.src = url;
    audioAtual = audio;
    
    audio.oncanplaythrough = function() {
        audio.volume = 0.7;
        audio.play()
            .then(() => {
                registrarToque(horario, true);
            })
            .catch(e => {
                adicionarLog(`⚠️ Erro ao reproduzir ${nomeArquivo}.mp3: ${e.message}`);
                tocarSomFallback(horario);
            });
    };
    
    audio.onerror = function() {
        adicionarLog(`⚠️ Arquivo ${nomeArquivo}.mp3 não encontrado, usando som gerado`);
        tocarSomFallback(horario);
    };
    
    // Iniciar carregamento
    audio.load();
}

function tocarSomFallback(horario = null, tipo = null) {
    // Som gerado pelo Web Audio API como fallback
    try {
        if (!audioContext || audioContext.state === 'closed') {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }

        const now = audioContext.currentTime;
        
        // Frequências para criar um sino agradável
        const frequencias = [523.25, 659.25, 783.99, 1046.50];
        const duracao = 0.15;
        const pausa = 0.1;
        
        // Para intervalos, tocar mais vezes
        let repeticoes = 3;
        if (horario && horario.tipo === 'intervalo') {
            repeticoes = 6;
        } else if (tipo === 'Teste') {
            repeticoes = 2;
        }
        
        for (let i = 0; i < repeticoes; i++) {
            const freqIndex = i % frequencias.length;
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            
            osc.connect(gain);
            gain.connect(audioContext.destination);
            
            osc.type = 'sine';
            osc.frequency.value = frequencias[freqIndex];
            
            // Envelope de volume
            gain.gain.setValueAtTime(0, now + (i * (duracao + pausa)));
            gain.gain.linearRampToValueAtTime(0.3, now + (i * (duracao + pausa)) + 0.01);
            gain.gain.linearRampToValueAtTime(0, now + (i * (duracao + pausa)) + duracao);
            
            osc.start(now + (i * (duracao + pausa)));
            osc.stop(now + (i * (duracao + pausa)) + duracao);
        }
        
        if (horario) {
            registrarToque(horario, false);
        } else if (tipo === 'Teste') {
            adicionarLog('🔊 Som de teste gerado (fallback)');
        }
        
    } catch (e) {
        adicionarLog(`❌ Erro ao gerar som: ${e.message}`);
        console.error('Erro de áudio:', e);
    }
}

function registrarToque(horario, mp3Carregado) {
    const tipoMsg = {
        'normal': 'TROCA DE AULA',
        'intervalo': 'INTERVALO 🎉',
        'aviso': 'AVISO ⏰'
    };
    
    const emoji = {
        'normal': '🔔',
        'intervalo': '🎉',
        'aviso': '⏰'
    };
    
    const status = mp3Carregado ? '✅' : '⚠️ (fallback)';
    const mensagem = `${emoji[horario.tipo]} ${tipoMsg[horario.tipo]} - ${horario.label} ${status}`;
    
    adicionarLog(mensagem, horario.tipo);
    ultimoToque = horario.hora;
}

// ============================================
// FUNÇÕES DE CONTROLE DE HORÁRIO
// ============================================

function verificarHorarios() {
    const agora = new Date();
    const horaAtual = agora.getHours().toString().padStart(2, '0');
    const minutoAtual = agora.getMinutes().toString().padStart(2, '0');
    const segundoAtual = agora.getSeconds();
    const horaStr = `${horaAtual}:${minutoAtual}`;
    
    // Verificar se é um horário programado (no segundo 0)
    if (segundoAtual === 0) {
        for (const [key, horario] of Object.entries(HORARIOS)) {
            if (horario.hora === horaStr) {
                // Verificar se já não tocou neste exato minuto
                if (ultimoToque !== horaStr) {
                    tocarSom(horario);
                }
                break;
            }
        }
    }
    
    // Atualizar próximo toque
    atualizarProximoToque(horaStr);
}

function atualizarProximoToque(horaAtual) {
    // Encontrar o próximo horário
    const horariosArray = Object.values(HORARIOS).sort((a, b) => {
        return a.hora.localeCompare(b.hora);
    });
    
    let proximo = null;
    for (const horario of horariosArray) {
        if (horario.hora > horaAtual) {
            proximo = horario;
            break;
        }
    }
    
    // Se não encontrou, pegar o primeiro do dia seguinte
    if (!proximo) {
        proximo = horariosArray[0];
    }
    
    if (proximo) {
        document.getElementById('proximoToque').textContent = proximo.label;
    }
}

function atualizarHora() {
    const agora = new Date();
    const horas = agora.getHours().toString().padStart(2, '0');
    const minutos = agora.getMinutes().toString().padStart(2, '0');
    const segundos = agora.getSeconds().toString().padStart(2, '0');
    
    document.getElementById('horaAtual').textContent = `${horas}:${minutos}:${segundos}`;
    
    // Atualizar a cada segundo
    setTimeout(atualizarHora, 1000);
}

// ============================================
// FUNÇÕES DE LOG
// ============================================

function adicionarLog(mensagem, tipo = null) {
    const logArea = document.getElementById('logArea');
    const agora = new Date();
    const hora = agora.toLocaleTimeString('pt-BR');
    
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.innerHTML = `<span class="time">[${hora}]</span>${mensagem}`;
    
    logArea.appendChild(entry);
    logArea.scrollTop = logArea.scrollHeight;
    
    // Manter apenas as últimas 100 mensagens
    while (logArea.children.length > 100) {
        logArea.removeChild(logArea.firstChild);
    }
}

// ============================================
// INICIALIZAÇÃO
// ============================================

// 1. RENDERIZAR OS HORÁRIOS NA INTERFACE (executado imediatamente)
renderizarHorarios();

// 2. Atualizar hora inicial
atualizarHora();

// 3. Verificar próximo toque imediatamente
const agora = new Date();
const horaAtual = `${agora.getHours().toString().padStart(2, '0')}:${agora.getMinutes().toString().padStart(2, '0')}`;
atualizarProximoToque(horaAtual);

// 4. Pré-inicializar áudio (quando o usuário clicar em qualquer lugar)
document.addEventListener('click', () => {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
});

// 5. Mensagens de boas-vindas
adicionarLog('🚀 Sistema carregado. Clique em "Iniciar" para ativar.');
adicionarLog('💡 O sistema prioriza arquivos MP3. Se não encontrar, usa som gerado.');
adicionarLog('📁 Certifique-se que os arquivos MP3 estão na mesma pasta.');
adicionarLog(`📋 ${Object.keys(HORARIOS).length} horários configurados.`);