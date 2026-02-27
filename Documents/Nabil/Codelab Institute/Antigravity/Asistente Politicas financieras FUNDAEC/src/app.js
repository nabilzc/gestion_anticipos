
// Logic for the Financial Assistant

// DOM Elements
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const messageList = document.getElementById('messagelist');

// State
let isProcessing = false;

// Event Listeners
chatForm.addEventListener('submit', handleUserMessage);

function handleUserMessage(e) {
    e.preventDefault();
    const text = userInput.value.trim();
    if (!text || isProcessing) return;

    addMessage(text, 'user');
    userInput.value = '';
    isProcessing = true;
    showTypingIndicator();

    // Simulate delay for "thinking"
    setTimeout(() => {
        const response = generateResponse(text);
        removeTypingIndicator();
        addMessage(response, 'bot');
        isProcessing = false;
    }, 600);
}

function addMessage(text, sender) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${sender}-message`;

    // Add avatar for bot
    if (sender === 'bot') {
        const avatar = document.createElement('div');
        avatar.className = 'avatar';
        avatar.innerText = 'F';
        msgDiv.appendChild(avatar);
    }

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.innerHTML = text; // Allow HTML for bot responses

    msgDiv.appendChild(contentDiv);
    messageList.appendChild(msgDiv);

    // Smooth scroll to bottom
    setTimeout(() => {
        messageList.scrollTop = messageList.scrollHeight;
    }, 50);
}

function showTypingIndicator() {
    const id = 'typing-indicator';
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message bot-message';
    msgDiv.id = id;

    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.innerText = 'F';
    msgDiv.appendChild(avatar);

    msgDiv.innerHTML += `<div class="message-content" style="color: #64748b;"><em>Escribiendo...</em></div>`;
    messageList.appendChild(msgDiv);

    setTimeout(() => {
        messageList.scrollTop = messageList.scrollHeight;
    }, 50);
}

function removeTypingIndicator() {
    const el = document.getElementById('typing-indicator');
    if (el) el.remove();
}

// --- LOGIC ENGINE ---

function generateResponse(input) {
    const lowerInput = input.toLowerCase();

    // 1. Check for Expenses/Approval (Section 11.3 Logic)
    // Keywords: gasto, pago, compra, aprobación, aprobar
    if (lowerInput.includes('gasto') || lowerInput.includes('pago') || lowerInput.includes('compra') || lowerInput.includes('aprobar')) {
        return handleExpenseQuery(lowerInput);
    }

    // 2. Check for Procedures
    // Keywords: procedimiento, pasos, como se hace, tramite
    if (lowerInput.includes('procedimiento') || lowerInput.includes('pasos') || lowerInput.includes('hacer') || lowerInput.includes('realizar')) {
        return formatProcedureResponse();
    }

    // 3. Fallback / Default
    return `
        <p>No encontré una regla específica para esa consulta en el <strong>Manual de Políticas y Procedimientos</strong>.</p>
        <p>Por favor intenta preguntar sobre:</p>
        <ul>
            <li>Límites de aprobación de gastos.</li>
            <li>Procedimientos de pago.</li>
            <li>Gastos presupuestados vs no presupuestados.</li>
        </ul>
        <div class="disclaimer"><em>Nota: Solo respondo sobre el contenido explícito del manual.</em></div>
    `;
}

function handleExpenseQuery(text) {
    const amount = extractAmount(text);
    const isBudgeted = text.includes('presupuestado') && !text.includes('no presupuestado');
    const isNotBudgeted = text.includes('no presupuestado');
    const isLoan = text.includes('préstamo') || text.includes('prestamo');

    // Case: Amount detected
    if (amount > 0) {
        if (isLoan) {
            return checkLimits(amount, 'prestamos');
        }
        if (isNotBudgeted) {
            return checkLimits(amount, 'noPresupuestado');
        }
        if (isBudgeted) {
            return checkLimits(amount, 'presupuestado');
        }

        // Ambiguous Case: Ask for clarification
        return `
            <p>Entiendo que consultas por un monto de <strong>$${amount.toLocaleString()} COP</strong>.</p>
            <p>Para indicarte quién debe aprobarlo, por favor aclara:</p>
            <ul>
                <li>¿Es un gasto <strong>presupuestado</strong>?</li>
                <li>¿O es <strong>no presupuestado</strong>?</li>
            </ul>
        `;
    }

    // Case: No amount detected
    return `
        <p>Para indicarte los niveles de aprobación, necesito saber el <strong>monto</strong> del egreso y si es <strong>presupuestado</strong> o <strong>no presupuestado</strong>.</p>
        <p>Ejemplo: <em>"¿Quién aprueba un gasto presupuestado de 40 millones?"</em></p>
    `;
}

function checkLimits(amount, type) {
    const limits = MANUAL_DATA.limits[type];
    const typeLabel = type === 'presupuestado' ? 'Presupuestado' : (type === 'noPresupuestado' ? 'No Presupuestado' : 'Préstamo');

    // Find the matching range
    const match = limits.find(l => amount <= l.max);

    if (!match) return "Monto fuera de rango o error en la consulta.";

    return `
        <div class="structured-response">
            <h3>1️⃣ Resultado</h3>
            <p>Para un egreso <strong>${typeLabel}</strong> de <strong>$${amount.toLocaleString()}</strong>:</p>
            <div class="highlight-box">
                <strong>Requiere autorización de:</strong><br/>
                ${match.roles.join(" + ")}
            </div>

            <h3>2️⃣ Fundamento en el Manual</h3>
            <p>Sección 11.3 – <em>Límites de Aprobación para Egresos</em>.</p>

            <h3>3️⃣ Explicación Operativa</h3>
            <p>El monto se encuentra en el rango ${formatRange(match, limits)}. Deben firmar/aprobar todas las personas listadas.</p>
        </div>
    `;
}

function formatProcedureResponse() {
    const steps = MANUAL_DATA.procedures.pago.map(s => `<li>${s}</li>`).join('');
    return `
        <div class="structured-response">
             <h3>1️⃣ Procedimiento para Pagos</h3>
             <ol>${steps}</ol>
             <h3>2️⃣ Fundamento</h3>
             <p>Sección 15 – <em>Procedimiento de Pagos</em>.</p>
        </div>
    `;
}

function extractAmount(text) {
    // Regex for "20 millones", "20.000.000", "20000"
    // Heuristic: remove dots, look for numbers.
    // Handle "millones" multiplication.

    let multiplier = 1;
    if (text.includes('millon')) multiplier = 1000000;

    // Extract first number sequence
    const cleanText = text.replace(/\./g, '').replace(/,/g, '.'); // Remove thousands separators
    const match = cleanText.match(/(\d+(\.\d+)?)/);

    if (match) {
        return parseFloat(match[0]) * multiplier;
    }
    return 0;
}

function formatRange(match, allLimits) {
    // Logic to describe the range "Menor a X" or "Entre X y Y"
    // This is simplified for the demo
    if (match.max === Infinity) return "Superior al límite anterior";
    return `inferior a $${match.max.toLocaleString()}`;
}
