// --- ATENÇÃO: COLE SUA URL DO SCRIPT AQUI ---
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzio7uyxC0DB9F1pA7IhQOY6prBiVq09dOSBpJ3I1k9PlV6n7gV3HyOkLX78rK2Ucn2Kg/exec';

// --- 1. CONFIGURAÇÕES DOS DENTES (LISTAS) ---
const DECIDUOS_R1 = [55, 54, 53, 52, 51];
const DECIDUOS_R2 = [61, 62, 63, 64, 65];
const DECIDUOS_R3 = [85, 84, 83, 82, 81];
const DECIDUOS_R4 = [71, 72, 73, 74, 75];
const PERMANENTES_R1 = [18, 17, 16, 15, 14, 13, 12, 11];
const PERMANENTES_R2 = [21, 22, 23, 24, 25, 26, 27, 28];
const PERMANENTES_R3 = [48, 47, 46, 45, 44, 43, 42, 41];
const PERMANENTES_R4 = [31, 32, 33, 34, 35, 36, 37, 38];

const DENTE_PAIRS = [
    ['51', '11'], ['61', '21'], ['52', '12'], ['62', '22'],
    ['53', '13'], ['63', '23'], ['54', '14'], ['64', '24'],
    ['55', '15'], ['65', '25'], ['81', '41'], ['71', '31'],
    ['82', '42'], ['72', '32'], ['83', '43'], ['73', '33'],
    ['84', '44'], ['74', '34'], ['85', '45'], ['75', '35']
];

// Variável global do usuário logado
let usuarioAtual = null;

document.addEventListener('DOMContentLoaded', () => {
    // Inicializa Odontograma
    popularSecaoPossui();
    
    // Listeners do Odontograma
    document.getElementById('data-nascimento').addEventListener('change', calcularIdade);
    
    // Botões Marcar/Desmarcar
    configurarBotoesGrupo('deciduos', '.deciduo-grid');
    configurarBotoesGrupo('permanentes', '.permanente-grid');
    configurarBotoesGrupo('higidos', '#secao-higidos');
    configurarBotoesGrupo('obturados', '#secao-obturados');
    configurarBotoesGrupo('perdidos', '#secao-perdidos');
    configurarBotoesGrupo('extracao', '#secao-extracao');

    // Verifica Login
    verificarLoginSalvo();

    // Envio do Formulário
    document.getElementById('prontuario-form').addEventListener('submit', handleFormSubmit);
});

// --- 2. SISTEMA DE LOGIN E PERFIL ---

function verificarLoginSalvo() {
    const dadosSalvos = localStorage.getItem('odonto_user');
    if (dadosSalvos) {
        usuarioAtual = JSON.parse(dadosSalvos);
        atualizarInterfaceLogada();
    } else {
        atualizarInterfaceDeslogada();
    }
}

function atualizarInterfaceLogada() {
    document.getElementById('user-login-btn').style.display = 'none';
    document.getElementById('user-info-display').style.display = 'block';
    document.getElementById('display-nome-anotador').textContent = usuarioAtual.nome;
    document.getElementById('anotador').value = usuarioAtual.nome;
    
    const examinadorPadrao = localStorage.getItem('odonto_examinador_padrao');
    if (examinadorPadrao) {
        document.getElementById('examinador').value = examinadorPadrao;
    }

    document.getElementById('submit-button').style.display = 'block';
    document.getElementById('bloqueio-envio').style.display = 'none';
}

function atualizarInterfaceDeslogada() {
    document.getElementById('user-login-btn').style.display = 'block';
    document.getElementById('user-info-display').style.display = 'none';
    document.getElementById('anotador').value = '';
    document.getElementById('submit-button').style.display = 'none';
    document.getElementById('bloqueio-envio').style.display = 'block';
}

function abrirModalLogin() {
    document.getElementById('modal-login').style.display = 'flex';
    document.getElementById('msg-erro-login').style.display = 'none';
    document.getElementById('input-matricula').value = '';
    document.getElementById('input-matricula').focus();
}

async function validarLogin() {
    const matricula = document.getElementById('input-matricula').value;
    const btnEntrar = document.querySelector('#modal-login .btn-primario');
    const msgErro = document.getElementById('msg-erro-login');

    if (!matricula) return;

    btnEntrar.disabled = true;
    btnEntrar.textContent = 'Verificando...';
    msgErro.style.display = 'none';

    try {
        // Login via GET
        const urlLogin = `${GOOGLE_SCRIPT_URL}?action=login&matricula=${encodeURIComponent(matricula)}`;
        
        const req = await fetch(urlLogin);
        const resp = await req.json();
        
        if (resp.result === 'success') {
            usuarioAtual = { matricula: matricula, nome: resp.nome };
            localStorage.setItem('odonto_user', JSON.stringify(usuarioAtual));
            atualizarInterfaceLogada();
            fecharModal('modal-login');
        } else {
            msgErro.textContent = 'Matrícula não encontrada.';
            msgErro.style.display = 'block';
        }

    } catch (e) {
        console.error(e);
        msgErro.textContent = 'Erro de conexão.';
        msgErro.style.display = 'block';
    } finally {
        btnEntrar.disabled = false;
        btnEntrar.textContent = 'Entrar';
    }
}

function fazerLogout() {
    localStorage.removeItem('odonto_user');
    usuarioAtual = null;
    atualizarInterfaceDeslogada();
    location.reload();
}

function abrirPerfil() {
    if (!usuarioAtual) return;
    document.getElementById('modal-perfil').style.display = 'flex';
    document.getElementById('perfil-nome').value = usuarioAtual.nome;
    document.getElementById('perfil-examinador').value = localStorage.getItem('odonto_examinador_padrao') || '';
}

function salvarPerfil() {
    const examinador = document.getElementById('perfil-examinador').value;
    localStorage.setItem('odonto_examinador_padrao', examinador);
    document.getElementById('examinador').value = examinador;
    fecharModal('modal-perfil');
}

function fecharModal(id) {
    document.getElementById(id).style.display = 'none';
}

// --- 3. LÓGICA DO ODONTOGRAMA ---

function popularSecaoPossui() {
    const grids = {
        'deciduos-r1': DECIDUOS_R1, 'deciduos-r2': DECIDUOS_R2,
        'deciduos-r3': DECIDUOS_R3, 'deciduos-r4': DECIDUOS_R4,
        'permanentes-r1': PERMANENTES_R1, 'permanentes-r2': PERMANENTES_R2,
        'permanentes-r3': PERMANENTES_R3, 'permanentes-r4': PERMANENTES_R4,
    };
    for (const [gridId, dentes] of Object.entries(grids)) {
        const grid = document.getElementById(gridId);
        if(grid) {
            dentes.forEach(d => grid.appendChild(criarCheckboxDente(d, 'possui')));
        }
    }
    document.querySelectorAll('#secao-possui input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', handleDentePossuiChange);
    });
}

function criarCheckboxDente(numeroDente, grupo) {
    const div = document.createElement('div');
    div.className = 'dente-item';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.id = `dente-${grupo}-${numeroDente}`;
    input.name = `${grupo}`;
    input.value = numeroDente;
    const label = document.createElement('label');
    label.htmlFor = input.id;
    label.textContent = numeroDente;
    div.appendChild(input);
    div.appendChild(label);
    return div;
}

function calcularIdade() {
    const dataNascimento = document.getElementById('data-nascimento').value;
    if (!dataNascimento) {
        document.getElementById('idade-calculada').textContent = 'Preencha a data de nascimento';
        return;
    }
    const hoje = new Date();
    const nasc = new Date(dataNascimento + "T00:00:00"); 
    let idade = hoje.getFullYear() - nasc.getFullYear();
    const mes = hoje.getMonth() - nasc.getMonth();
    if (mes < 0 || (mes === 0 && hoje.getDate() < nasc.getDate())) {
        idade--;
    }
    document.getElementById('idade-calculada').textContent = `${idade} anos`;
}

function handleDentePossuiChange() {
    updateAllExclusivity();
    atualizarSecoesDependentes();
}

function updateAllExclusivity() {
    for (const [deciduoVal, permVal] of DENTE_PAIRS) {
        const deciduoBox = document.getElementById(`dente-possui-${deciduoVal}`);
        const permBox = document.getElementById(`dente-possui-${permVal}`);
        if (deciduoBox && permBox) {
            if (deciduoBox.checked) {
                permBox.disabled = true;
                permBox.checked = false; 
            } else if (permBox.checked) {
                deciduoBox.disabled = true;
                deciduoBox.checked = false; 
            } else {
                permBox.disabled = false;
                deciduoBox.disabled = false;
            }
        }
    }
}

// --- AQUI ESTÁ A MUDANÇA PRINCIPAL ---
function atualizarSecoesDependentes() {
    const dentesPresentes = getCheckedValues('secao-possui');
    
    // 1. Atualiza Hígidos (Baseado nos Presentes)
    const dentesHigidosMarcados = getCheckedValues('secao-higidos');
    atualizarGridDinamico('secao-higidos', dentesPresentes, dentesHigidosMarcados, 'higidos');

    // 2. Calcula os Não-Hígidos
    const dentesHigidosAtuais = getCheckedValues('secao-higidos');
    const dentesNaoHigidos = dentesPresentes.filter(dente => !dentesHigidosAtuais.includes(dente));

    // 3. Atualiza Cariados (Baseado nos Não-Hígidos)
    const dentesCariadosMarcados = getCheckedValues('secao-cariados');
    atualizarGridDinamico('secao-cariados', dentesNaoHigidos, dentesCariadosMarcados, 'cariados');

    // 4. Atualiza Obturados, Perdidos e Extração 
    // AGORA TODOS ELES DEPENDEM DOS "NÃO HÍGIDOS"
    
    const dentesObturadosMarcados = getCheckedValues('secao-obturados');
    const dentesPerdidosMarcados = getCheckedValues('secao-perdidos');
    const dentesExtracaoMarcados = getCheckedValues('secao-extracao');

    atualizarGridDinamico('secao-obturados', dentesNaoHigidos, dentesObturadosMarcados, 'obturados');
    atualizarGridDinamico('secao-perdidos', dentesNaoHigidos, dentesPerdidosMarcados, 'perdidos'); // MUDOU AQUI
    atualizarGridDinamico('secao-extracao', dentesNaoHigidos, dentesExtracaoMarcados, 'extracao'); // MUDOU AQUI

    // Re-aplica listeners
    document.querySelectorAll('#secao-higidos input[type="checkbox"]').forEach(checkbox => {
        checkbox.removeEventListener('change', atualizarSecoesDependentes); 
        checkbox.addEventListener('change', atualizarSecoesDependentes);
    });

    // Faces Cáries
    document.querySelectorAll('#secao-cariados input[type="checkbox"]').forEach(checkbox => {
        checkbox.removeEventListener('change', atualizarFacesCarie);
        checkbox.addEventListener('change', atualizarFacesCarie);
    });
    
    atualizarFacesCarie();
}

function atualizarFacesCarie() {
    const container = document.getElementById('container-faces-carie');
    const lista = document.getElementById('lista-faces-dinamica');
    const dentesCariados = getCheckedValues('secao-cariados');

    if (dentesCariados.length === 0) {
        container.style.display = 'none';
        lista.innerHTML = '';
        return;
    }

    container.style.display = 'block';
    const cardsExistentes = Array.from(lista.children).map(div => div.dataset.dente);

    Array.from(lista.children).forEach(div => {
        if (!dentesCariados.includes(div.dataset.dente)) div.remove();
    });

    dentesCariados.sort((a,b) => a-b).forEach(dente => {
        if (!cardsExistentes.includes(dente)) {
            const card = document.createElement('div');
            card.className = 'face-card';
            card.dataset.dente = dente; 
            card.innerHTML = `
                <div class="face-card-title">Dente ${dente} - Faces:</div>
                <div class="faces-options">
                    <label class="face-option"><input type="checkbox" value="Oclusal" name="face-${dente}"> Oclusal</label>
                    <label class="face-option"><input type="checkbox" value="Distal" name="face-${dente}"> Distal</label>
                    <label class="face-option"><input type="checkbox" value="Mesial" name="face-${dente}"> Mesial</label>
                    <label class="face-option"><input type="checkbox" value="Palatina" name="face-${dente}"> Ling/Pal</label>
                    <label class="face-option"><input type="checkbox" value="Vestibular" name="face-${dente}"> Vestib</label>
                </div>`;
            lista.appendChild(card);
        }
    });
}

function atualizarGridDinamico(containerId, dentesParaMostrar, dentesJaMarcados, grupo) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    if (dentesParaMostrar.length === 0) {
        container.innerHTML = `<p style="text-align:center; color:#888;">Nenhum dente disponível.</p>`;
        return;
    }
    const grid = document.createElement('div');
    grid.className = 'dente-grid';
    dentesParaMostrar.sort((a, b) => a - b).forEach(dente => {
        const checkboxItem = criarCheckboxDente(dente, grupo);
        if (dentesJaMarcados.includes(dente)) {
            checkboxItem.querySelector('input').checked = true;
        }
        grid.appendChild(checkboxItem);
    });
    container.appendChild(grid);
}

function getCheckedValues(containerId) {
    const checkboxes = document.querySelectorAll(`#${containerId} input[type="checkbox"]:checked`);
    return Array.from(checkboxes).map(cb => cb.value);
}

// Helper para botões Marcar/Desmarcar
function configurarBotoesGrupo(nome, seletorOuId) {
    // Se for classe (começa com .) ou ID (começa com #)
    let seletor = seletorOuId;
    if(!seletor.startsWith('.') && !seletor.startsWith('#')) seletor = '#' + seletor;
    
    const btnFill = document.getElementById(`fill-${nome}`);
    const btnClear = document.getElementById(`clear-${nome}`);

    if(btnFill) {
        btnFill.addEventListener('click', () => {
            document.querySelectorAll(`${seletor} input[type="checkbox"]`).forEach(cb => !cb.disabled && (cb.checked = true));
            if(nome.includes('deciduos') || nome.includes('permanentes')) handleDentePossuiChange();
            else atualizarSecoesDependentes();
        });
    }
    if(btnClear) {
        btnClear.addEventListener('click', () => {
            document.querySelectorAll(`${seletor} input[type="checkbox"]`).forEach(cb => cb.checked = false);
            if(nome.includes('deciduos') || nome.includes('permanentes')) handleDentePossuiChange();
            else atualizarSecoesDependentes();
        });
    }
}


// --- 4. ENVIO DO FORMULÁRIO ---
async function handleFormSubmit(event) {
    event.preventDefault();

    if (!usuarioAtual || !usuarioAtual.matricula) {
        alert("Erro: Você precisa estar logado.");
        return;
    }

    const form = event.target;
    const submitButton = document.getElementById('submit-button');
    const loadingMsg = document.getElementById('loading-message');
    const successMsg = document.getElementById('success-message');
    const errorMsg = document.getElementById('error-message');

    submitButton.disabled = true;
    loadingMsg.style.display = 'block';
    successMsg.style.display = 'none';
    errorMsg.style.display = 'none';

    try {
        const formData = new FormData(form);
        const data = {};
        
        data.matricula = usuarioAtual.matricula;

        // Campos
        data.examinador = formData.get('examinador');
        data.anotador = formData.get('anotador');
        data.paciente = formData.get('paciente');
        data.sexo = formData.get('sexo');
        data.sala = formData.get('sala');
        data.responsavel = formData.get('responsavel');
        data.telefone = formData.get('telefone');
        data.fluorose = formData.get('fluorose');
        data.dataNascimento = formData.get('data-nascimento');
        data.idade = document.getElementById('idade-calculada').textContent;
        data.observacoes = formData.get('observacoes');
        data.encaminhamento = formData.get('encaminhamento');

        // Listas
        data.dentesPresentes = getCheckedValues('secao-possui').join(', ');
        data.dentesHigidos = getCheckedValues('secao-higidos').join(', ');
        data.dentesCariados = getCheckedValues('secao-cariados').join(', ');
        data.dentesObturados = getCheckedValues('secao-obturados').join(', ');
        data.dentesPerdidos = getCheckedValues('secao-perdidos').join(', ');
        data.dentesExtracao = getCheckedValues('secao-extracao').join(', ');

        // Faces
        const listaFaces = [];
        document.querySelectorAll('.face-card').forEach(card => {
            const dente = card.dataset.dente;
            const inputs = card.querySelectorAll('input:checked');
            const faces = Array.from(inputs).map(i => i.value);
            listaFaces.push(faces.length > 0 ? `${dente}(${faces.join(',')})` : `${dente}(Não esp.)`);
        });
        data.facesCariadas = listaFaces.join('; ');
        
        // Envia
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(data),
        });

        const respData = await response.json();
        
        if (respData.result === 'success') {
            successMsg.style.display = 'block';
            form.reset();
            // Restaura estado logado
            document.getElementById('anotador').value = usuarioAtual.nome;
            const examPadrao = localStorage.getItem('odonto_examinador_padrao');
            if (examPadrao) document.getElementById('examinador').value = examPadrao;
            
            // Limpa visual
            handleDentePossuiChange();
            document.getElementById('lista-faces-dinamica').innerHTML = '';
            document.getElementById('container-faces-carie').style.display = 'none';
        } else {
            throw new Error(respData.message);
        }

    } catch (error) {
        console.error('Erro ao enviar:', error);
        errorMsg.textContent = "Erro: " + error.message;
        errorMsg.style.display = 'block';
    } finally {
        submitButton.disabled = false;
        loadingMsg.style.display = 'none';
    }
}