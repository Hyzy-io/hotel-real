
// ===========================================
// DADOS FICTÍCIOS PARA TESTES - REMOVER DEPOIS
// ===========================================
const userData = {
  history: [
    { type: 'credit', description: 'Reserva confirmada - suíte luxo', date: '01/04/2025', points: 500 },
    { type: 'debit', description: 'Resgate - Upgrade de quarto', date: '02/04/2025', points: 1000 },
    { type: 'credit', description: 'Hospedagem - Fim de semana', date: '05/04/2025', points: 700 },
    { type: 'debit', description: 'Resgate - Jantar especial', date: '07/04/2025', points: 1500 }
  ]
};
// ===========================================
// FIM DOS DADOS DE TESTE
// ===========================================

function renderStatementTimeline() {
  const timelineContainer = document.getElementById('statement-timeline');
  timelineContainer.innerHTML = '';

  if (!userData.history || userData.history.length === 0) {
    timelineContainer.innerHTML = '<div class="empty-timeline">Nenhuma transação encontrada</div>';
    return;
  }

  userData.history.forEach(item => {
    const timelineItem = document.createElement('div');
    timelineItem.className = 'timeline-item';

    const iconClass = item.type === 'credit' ? 'fa-plus' : 'fa-minus';
    const pointsClass = item.type === 'credit' ? 'points-positive' : 'points-negative';
    const pointsPrefix = item.type === 'credit' ? '+' : '-';

    timelineItem.innerHTML = `
      <div class="timeline-icon">
        <i class="fas ${iconClass}"></i>
      </div>
      <div class="timeline-content">
        <div class="timeline-date">${item.date}</div>
        <div class="timeline-message">${item.description}</div>
        <div class="timeline-points ${pointsClass}">
          ${pointsPrefix}${item.points} pontos
        </div>
      </div>
    `;

    timelineContainer.appendChild(timelineItem);
  });
}

document.addEventListener('DOMContentLoaded', renderStatementTimeline);
