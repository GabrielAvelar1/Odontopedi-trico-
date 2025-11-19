// --- ATENÇÃO: PASSO CRÍTICO ---
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxh54jhhERORrBq5JebgYa-D6dIUyT-QOk2bLROKBaa6dHdn7WYagBXhd8ZWNv5ihHPXA/exec';
// ------------------------------

// --- CONFIGURAÇÕES DOS DENTES ---
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

document.addEventListener('DOMContentLoaded', () => {
    popularSecaoPossui();
    document.getElementById('data-nascimento').addEventListener('change', calcularIdade);
    document.getElementById('prontuario-form').addEventListener('submit', handleFormSubmit);

    // Listeners Botões Marcar/Desmarcar - GRUPO 1 (Originais)
    document.getElementById('fill-deciduos').addEventListener('click', handleFillDeciduos);
    document.getElementById('fill-permanentes').addEventListener('click', handleFillPermanentes);
    document.getElementById('fill-higidos').addEventListener('click', handleFillHigidos);
    document.getElementById('clear-deciduos').addEventListener('click', handleClearDeciduos);
    document.getElementById('clear-permanentes').addEventListener('click', handleClearPermanentes);
    document.getElementById('clear-higidos').addEventListener('click', handleClearHigidos);

    // Listeners Botões Marcar/Desmarcar - GRUPO 2 (Novos)
    configurarBotoesGrupo('obturados', 'secao-obturados');
    configurarBotoesGrupo('perdidos', 'secao-perdidos');
    configurarBotoesGrupo('extracao', 'secao-extracao');
});

// Helper para configurar botões novos rapidamente
function configurarBotoesGrupo(nome, secaoId) {
    document.getElementById(`fill-${nome}`).addEventListener('click', () => {
        document.querySelectorAll(`#${secaoId} input[type="checkbox"]`).forEach(cb => !cb.disabled && (cb.checked = true));
    });
    document.getElementById(`clear-${nome}`).addEventListener('click', () => {
        document.querySelectorAll(`#${secaoId} input[type="checkbox"]`).forEach(cb => cb.checked = false);
    });
}

function popularSecaoPossui() {
    const grids = {
        'deciduos-r1': DECIDUOS_R1, 'deciduos-r2': DECIDUOS_R2,
        'deciduos-r3': DECIDUOS_R3, 'deciduos-r4': DECIDUOS_R4,
        'permanentes-r1': PERMANENTES_R1, 'permanentes-r2': PERMANENTES_R2,
        'permanentes-r3': PERMANENTES_R3, 'permanentes-r4': PERMANENTES_R4,
    };
    for (const [gridId, dentes] of Object.entries(grids)) {
        const grid = document.getElementById(gridId);
        dentes.forEach(d => grid.appendChild(criarCheckboxDente(d, 'possui')));
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

function atualizarSecoesDependentes() {
    const dentesPresentes = getCheckedValues('secao-possui');
    
    // 1. Atualiza Hígidos
    const dentesHigidosMarcados = getCheckedValues('secao-higidos');
    atualizarGridDinamico('secao-higidos', dentesPresentes, dentesHigidosMarcados, 'higidos');

    const dentesHigidosAtuais = getCheckedValues('secao-higidos');
    // Dentes que NÃO são hígidos podem ser cariados, obturados, perdidos, etc.
    const dentesNaoHigidos = dentesPresentes.filter(dente => !dentesHigidosAtuais.includes(dente));

    // 2. Atualiza Cariados
    const dentesCariadosMarcados = getCheckedValues('secao-cariados');
    atualizarGridDinamico('secao-cariados', dentesNaoHigidos, dentesCariadosMarcados, 'cariados');

    // 3. Atualiza Obturados, Perdidos e Extração (Baseado nos Presentes)
    // Nota: Dentes obturados geralmente não são hígidos, mas vamos permitir selecionar qualquer um presente por flexibilidade
    // ou restringir aos "não hígidos". Vamos restringir aos não hígidos para consistência.
    const dentesObturadosMarcados = getCheckedValues('secao-obturados');
    const dentesPerdidosMarcados = getCheckedValues('secao-perdidos');
    const dentesExtracaoMarcados = getCheckedValues('secao-extracao');

    atualizarGridDinamico('secao-obturados', dentesNaoHigidos, dentesObturadosMarcados, 'obturados');
    atualizarGridDinamico('secao-perdidos', dentesPresentes, dentesPerdidosMarcados, 'perdidos');
    atualizarGridDinamico('secao-extracao', dentesPresentes, dentesExtracaoMarcados, 'extracao');

    // Listeners para re-filtrar quando marcar "Hígido"
    document.querySelectorAll('#secao-higidos input[type="checkbox"]').forEach(checkbox => {
        checkbox.removeEventListener('change', atualizarSecoesDependentes); 
        checkbox.addEventListener('change', atualizarSecoesDependentes);
    });

    // Listeners ESPECIAIS para "Cariados" -> Mostrar Faces
    document.querySelectorAll('#secao-cariados input[type="checkbox"]').forEach(checkbox => {
        checkbox.removeEventListener('change', atualizarFacesCarie);
        checkbox.addEventListener('change', atualizarFacesCarie);
    });
    
    // Chama a atualização de faces imediatamente para desenhar se já houver marcados
    atualizarFacesCarie();
}

// --- NOVO: Lógica para Faces das Cáries ---
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

    // Verifica quais cards já existem para não apagar o que o usuário já marcou
    const cardsExistentes = Array.from(lista.children).map(div => div.dataset.dente);

    // 1. Remove cards de dentes que não estão mais cariados
    Array.from(lista.children).forEach(div => {
        if (!dentesCariados.includes(div.dataset.dente)) {
            div.remove();
        }
    });

    // 2. Cria cards para novos dentes cariados
    dentesCariados.sort((a,b) => a-b).forEach(dente => {
        if (!cardsExistentes.includes(dente)) {
            const card = document.createElement('div');
            card.className = 'face-card';
            card.dataset.dente = dente; // Identificador
            
            card.innerHTML = `
                <div class="face-card-title">Dente ${dente} - Faces:</div>
                <div class="faces-options">
                    <label class="face-option"><input type="checkbox" value="Oclusal" name="face-${dente}"> Oclusal</label>
                    <label class="face-option"><input type="checkbox" value="Distal" name="face-${dente}"> Distal</label>
                    <label class="face-option"><input type="checkbox" value="Mesial" name="face-${dente}"> Mesial</label>
                    <label class="face-option"><input type="checkbox" value="Palatina" name="face-${dente}"> Ling/Pal</label>
                    <label class="face-option"><input type="checkbox" value="Vestibular" name="face-${dente}"> Vestib</label>
                </div>
            `;
            lista.appendChild(card);
        }
    });
}

function atualizarGridDinamico(containerId, dentesParaMostrar, dentesJaMarcados, grupo) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    if (dentesParaMostrar.length === 0) {
        container.innerHTML = `<p>Nenhum dente disponível para seleção.</p>`;
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

// Funções de Botões (Originais)
function handleFillDeciduos() { document.querySelectorAll('.deciduo-grid input[type="checkbox"]').forEach(cb => !cb.disabled && (cb.checked = true)); handleDentePossuiChange(); }
function handleFillPermanentes() { document.querySelectorAll('.permanente-grid input[type="checkbox"]').forEach(cb => !cb.disabled && (cb.checked = true)); handleDentePossuiChange(); }
function handleFillHigidos() { document.querySelectorAll('#secao-higidos input[type="checkbox"]').forEach(cb => !cb.disabled && (cb.checked = true)); atualizarSecoesDependentes(); }
function handleClearDeciduos() { document.querySelectorAll('.deciduo-grid input[type="checkbox"]').forEach(cb => cb.checked = false); handleDentePossuiChange(); }
function handleClearPermanentes() { document.querySelectorAll('.permanente-grid input[type="checkbox"]').forEach(cb => cb.checked = false); handleDentePossuiChange(); }
function handleClearHigidos() { document.querySelectorAll('#secao-higidos input[type="checkbox"]').forEach(cb => cb.checked = false); atualizarSecoesDependentes(); }

// --- ENVIO DO FORMULÁRIO ---
async function handleFormSubmit(event) {
    event.preventDefault();
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
        
        // Campos Básicos
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

        // Listas de Dentes
        data.dentesPresentes = getCheckedValues('secao-possui').join(', ');
        data.dentesHigidos = getCheckedValues('secao-higidos').join(', ');
        data.dentesCariados = getCheckedValues('secao-cariados').join(', ');
        data.dentesObturados = getCheckedValues('secao-obturados').join(', ');
        data.dentesPerdidos = getCheckedValues('secao-perdidos').join(', ');
        data.dentesExtracao = getCheckedValues('secao-extracao').join(', ');

        // Processa as Faces das Cáries
        // Cria uma string tipo: "16(O,M); 21(V)"
        const listaFaces = [];
        const cardsFaces = document.querySelectorAll('.face-card');
        cardsFaces.forEach(card => {
            const dente = card.dataset.dente;
            const inputs = card.querySelectorAll('input:checked');
            const facesSelecionadas = Array.from(inputs).map(i => i.value);
            
            if (facesSelecionadas.length > 0) {
                listaFaces.push(`${dente}(${facesSelecionadas.join(',')})`);
            } else {
                listaFaces.push(`${dente}(Não esp.)`); // Se não especificar
            }
        });
        data.facesCariadas = listaFaces.join('; ');
        
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            cache: 'no-cache',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        successMsg.style.display = 'block';
        form.reset(); 
        document.getElementById('idade-calculada').textContent = 'Preencha a data de nascimento';
        document.getElementById('lista-faces-dinamica').innerHTML = ''; // Limpa faces
        document.getElementById('container-faces-carie').style.display = 'none';
        handleDentePossuiChange(); 

    } catch (error) {
        console.error('Erro ao enviar:', error);
        errorMsg.style.display = 'block';
    } finally {
        submitButton.disabled = false;
        loadingMsg.style.display = 'none';
    }
}