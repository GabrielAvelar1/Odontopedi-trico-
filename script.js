
// --- ATENÇÃO: PASSO CRÍTICO ---
// Cole aqui a URL gerada no Passo 2 (Instrução 7)
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzcotwx-RWU5hde_Kx6fcrgWzhNHgR40AWsv_-xmCcsW8MkvLeKsWNY12vUa03pTkaaoA/exec';
// ------------------------------

// Definição dos dentes em 4 fileiras (Quadrantes)
// Decíduos
const DECIDUOS_R1 = [55, 54, 53, 52, 51]; // Q1
const DECIDUOS_R2 = [61, 62, 63, 64, 65]; // Q2
const DECIDUOS_R3 = [85, 84, 83, 82, 81]; // Q4
const DECIDUOS_R4 = [71, 72, 73, 74, 75]; // Q3
// Permanentes
const PERMANENTES_R1 = [18, 17, 16, 15, 14, 13, 12, 11]; // Q1
const PERMANENTES_R2 = [21, 22, 23, 24, 25, 26, 27, 28]; // Q2
const PERMANENTES_R3 = [48, 47, 46, 45, 44, 43, 42, 41]; // Q4
const PERMANENTES_R4 = [31, 32, 33, 34, 35, 36, 37, 38]; // Q3

// Mapeamento de dentes decíduos para permanentes
const DENTE_PAIRS = [
    ['51', '11'], ['61', '21'],
    ['52', '12'], ['62', '22'],
    ['53', '13'], ['63', '23'],
    ['54', '14'], ['64', '24'],
    ['55', '15'], ['65', '25'],
    ['81', '41'], ['71', '31'],
    ['82', '42'], ['72', '32'],
    ['83', '43'], ['73', '33'],
    ['84', '44'], ['74', '34'],
    ['85', '45'], ['75', '35']
];


// --- Ponto de Início: Espera a página carregar ---
document.addEventListener('DOMContentLoaded', () => {
    
    popularSecaoPossui(); // Inicializa os dentes

    // --- Conexões de Eventos ---

    // 1. Dados do Paciente (usando a função de data REVERTIDA)
    document.getElementById('data-nascimento').addEventListener('change', calcularIdade);
    
    // 2. Formulário Principal (para salvar e previnir recarregar)
    document.getElementById('prontuario-form').addEventListener('submit', handleFormSubmit);

    // 3. Botões "Marcar Todos"
    document.getElementById('fill-deciduos').addEventListener('click', handleFillDeciduos);
    document.getElementById('fill-permanentes').addEventListener('click', handleFillPermanentes);
    document.getElementById('fill-higidos').addEventListener('click', handleFillHigidos);
    
    // 4. Botões "Desmarcar Todos"
    document.getElementById('clear-deciduos').addEventListener('click', handleClearDeciduos);
    document.getElementById('clear-permanentes').addEventListener('click', handleClearPermanentes);
    document.getElementById('clear-higidos').addEventListener('click', handleClearHigidos);
});


/**
 * Popula a seção "Quais dentes o paciente possui?" com todos os dentes
 * divididos nas 8 fileiras.
 */
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

    // Adiciona UM listener central para TODAS as mudanças na seção "possui"
    document.querySelectorAll('#secao-possui input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', handleDentePossuiChange);
    });
}

/**
 * Função helper para criar um elemento de checkbox de dente.
 */
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

/**
 * REVERTIDO: Calcula a idade do paciente com base no input type="date".
 */
function calcularIdade() {
    const dataNascimento = document.getElementById('data-nascimento').value;
    if (!dataNascimento) {
        document.getElementById('idade-calculada').textContent = 'Preencha a data de nascimento';
        return;
    }

    const hoje = new Date();
    // O input type="date" fornece a data no formato AAAA-MM-DD
    // O construtor Date() entende esse formato se adicionarmos o fuso horário (T00:00:00)
    // para evitar problemas de um dia a menos.
    const nasc = new Date(dataNascimento + "T00:00:00"); 
    
    let idade = hoje.getFullYear() - nasc.getFullYear();
    const mes = hoje.getMonth() - nasc.getMonth();

    if (mes < 0 || (mes === 0 && hoje.getDate() < nasc.getDate())) {
        idade--;
    }
    
    document.getElementById('idade-calculada').textContent = `${idade} anos`;
}

// --- LÓGICA DE ATUALIZAÇÃO REVISADA ---

/**
 * Função central chamada por qualquer mudança nos dentes "Presentes".
 * Ela atualiza a exclusividade E as seções dependentes (hígidos/cariados).
 */
function handleDentePossuiChange() {
    updateAllExclusivity();
    atualizarSecoesDependentes();
}

/**
 * Verifica todos os pares de dentes e desabilita o sucessor/antecessor
 * se um deles estiver marcado.
 */
function updateAllExclusivity() {
    for (const [deciduoVal, permVal] of DENTE_PAIRS) {
        const deciduoBox = document.getElementById(`dente-possui-${deciduoVal}`);
        const permBox = document.getElementById(`dente-possui-${permVal}`);
        
        if (deciduoBox && permBox) {
            if (deciduoBox.checked) {
                permBox.disabled = true;
                permBox.checked = false; // Garante que não fique marcado
            } else if (permBox.checked) {
                deciduoBox.disabled = true;
                deciduoBox.checked = false; // Garante que não fique marcado
            } else {
                permBox.disabled = false;
                deciduoBox.disabled = false;
            }
        }
    }
}

/**
 * Função principal que atualiza as listas "Hígidos" e "Cariados"
 * com base no que é selecionado em "Possui" e "Hígidos".
 */
function atualizarSecoesDependentes() {
    const dentesPresentes = getCheckedValues('secao-possui');
    
    const dentesHigidosMarcadosAnteriormente = getCheckedValues('secao-higidos');
    atualizarGridDinamico('secao-higidos', dentesPresentes, dentesHigidosMarcadosAnteriormente, 'higidos');

    const dentesHigidosAtuais = getCheckedValues('secao-higidos');
    const dentesParaCariados = dentesPresentes.filter(dente => !dentesHigidosAtuais.includes(dente));
    
    const dentesCariadosMarcadosAnteriormente = getCheckedValues('secao-cariados');
    atualizarGridDinamico('secao-cariados', dentesParaCariados, dentesCariadosMarcadosAnteriormente, 'cariados');

    // Adiciona listeners de "change" aos checkboxes de "hígidos"
    document.querySelectorAll('#secao-higidos input[type="checkbox"]').forEach(checkbox => {
        checkbox.removeEventListener('change', atualizarSecoesDependentes); // Evita duplicatas
        checkbox.addEventListener('change', atualizarSecoesDependentes);
    });
}

/**
 * Atualiza um grid dinâmico (Hígidos ou Cariados).
 */
function atualizarGridDinamico(containerId, dentesParaMostrar, dentesJaMarcados, grupo) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    if (dentesParaMostrar.length === 0) {
        container.innerHTML = `<p>Nenhum dente aplicável selecionado na etapa anterior.</p>`;
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

/**
 * Helper para pegar os valores (números dos dentes) dos checkboxes marcados.
 */
function getCheckedValues(containerId) {
    const checkboxes = document.querySelectorAll(`#${containerId} input[type="checkbox"]:checked`);
    return Array.from(checkboxes).map(cb => cb.value);
}

// --- FUNÇÕES DOS BOTÕES (MARCAR/DESMARCAR) ---

function handleFillDeciduos() {
    document.querySelectorAll('.deciduo-grid input[type="checkbox"]').forEach(checkbox => {
        if (!checkbox.disabled) checkbox.checked = true;
    });
    handleDentePossuiChange(); // Atualiza tudo
}

function handleFillPermanentes() {
    document.querySelectorAll('.permanente-grid input[type="checkbox"]').forEach(checkbox => {
        if (!checkbox.disabled) checkbox.checked = true;
    });
    handleDentePossuiChange(); // Atualiza tudo
}

function handleFillHigidos() {
    document.querySelectorAll('#secao-higidos input[type="checkbox"]').forEach(checkbox => {
        if (!checkbox.disabled) checkbox.checked = true;
    });
    atualizarSecoesDependentes(); // Só precisa atualizar cariados
}

function handleClearDeciduos() {
    document.querySelectorAll('.deciduo-grid input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
    });
    handleDentePossuiChange(); // Atualiza tudo
}

function handleClearPermanentes() {
    document.querySelectorAll('.permanente-grid input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
    });
    handleDentePossuiChange(); // Atualiza tudo
}

function handleClearHigidos() {
    document.querySelectorAll('#secao-higidos input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
    });
    atualizarSecoesDependentes(); // Só precisa atualizar cariados
}


/**
 * Manipula o envio do formulário. (VERSÃO SEM CONTAGEM)
 */
async function handleFormSubmit(event) {
    event.preventDefault(); // Impede o recarregamento da página
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
        
        data.examinador = formData.get('examinador');
        data.anotador = formData.get('anotador');
        data.paciente = formData.get('paciente');
        data.dataNascimento = formData.get('data-nascimento');
        data.idade = document.getElementById('idade-calculada').textContent;

        // Pega os dados dos dentes e converte direto para texto
        data.dentesPresentes = getCheckedValues('secao-possui').join(', ');
        data.dentesHigidos = getCheckedValues('secao-higidos').join(', ');
        data.dentesCariados = getCheckedValues('secao-cariados').join(', ');
        
        // Envia os dados para o Google Apps Script
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
        handleDentePossuiChange(); // Limpa e reseta os odontogramas

    } catch (error) {
        console.error('Erro ao enviar formulário:', error);
        errorMsg.style.display = 'block';
    } finally {
        submitButton.disabled = false;
        loadingMsg.style.display = 'none';
    }
}