function sanitizeData(data) {
    return data.replace(/\+/g, '').trim();
}

function createGameArray(data) {
    const sanitizedData = sanitizeData(data);
    const regex = /"([^"]+)"/g;
    const games = [];
    let match;

    while ((match = regex.exec(sanitizedData)) !== null) {
        games.push(match[1].trim());
    }

    return games;
}

function organizeGamesInColumns(games, columns) {
    const rows = Math.ceil(games.length / columns);
    const gameArray = Array.from({ length: rows }, () => Array(columns).fill(''));

    games.forEach((game, index) => {
        const row = Math.floor(index / columns);
        const col = index % columns;
        gameArray[row][col] = game;
    });

    return gameArray;
}

function invertGameArray(gameArray) {
    return gameArray.map(row => row).reverse();
}

function calculateMaximasAmbosMarcam(gameArray) {
    const teamStats = {};

    gameArray.forEach(row => {
        row.forEach(game => {
            if (game) {
                const [teams, score] = game.split(' ').join(' ').split(/\s(?=\d)/);
                const [team1, team2] = teams.split(' x ');
                const [score1, score2] = score.split('-').map(Number);

                if (!teamStats[team1]) {
                    teamStats[team1] = { currentNoBothTeamsScore: 0, maxNoBothTeamsScore: 0, totalNoBothTeamsScore: 0, totalBothTeamsScore: 0, maxBothTeamsScore: 0, currentBothTeamsScore: 0 };
                }
                if (!teamStats[team2]) {
                    teamStats[team2] = { currentNoBothTeamsScore: 0, maxNoBothTeamsScore: 0, totalNoBothTeamsScore: 0, totalBothTeamsScore: 0, maxBothTeamsScore: 0, currentBothTeamsScore: 0 };
                }

                if (score1 === 0 || score2 === 0) {
                    teamStats[team1].currentNoBothTeamsScore++;
                    teamStats[team2].currentNoBothTeamsScore++;
                    teamStats[team1].totalNoBothTeamsScore++;
                    teamStats[team2].totalNoBothTeamsScore++;
                    teamStats[team1].maxNoBothTeamsScore = Math.max(teamStats[team1].maxNoBothTeamsScore, teamStats[team1].currentNoBothTeamsScore);
                    teamStats[team2].maxNoBothTeamsScore = Math.max(teamStats[team2].maxNoBothTeamsScore, teamStats[team2].currentNoBothTeamsScore);

                    teamStats[team1].currentBothTeamsScore = 0;
                    teamStats[team2].currentBothTeamsScore = 0;
                } else {
                    teamStats[team1].currentBothTeamsScore++;
                    teamStats[team2].currentBothTeamsScore++;
                    teamStats[team1].totalBothTeamsScore++;
                    teamStats[team2].totalBothTeamsScore++;
                    teamStats[team1].maxBothTeamsScore = Math.max(teamStats[team1].maxBothTeamsScore, teamStats[team1].currentBothTeamsScore);
                    teamStats[team2].maxBothTeamsScore = Math.max(teamStats[team2].maxBothTeamsScore, teamStats[team2].currentBothTeamsScore);

                    teamStats[team1].currentNoBothTeamsScore = 0;
                    teamStats[team2].currentNoBothTeamsScore = 0;
                }
            }
        });
    });

    // Calcular a probabilidade de pagamento
    for (const team in teamStats) {
        const stats = teamStats[team];
        stats.paymentProbability = (
            (stats.totalBothTeamsScore / (stats.totalNoBothTeamsScore + stats.totalBothTeamsScore)) * 0.5 +
            (stats.currentNoBothTeamsScore / (stats.totalNoBothTeamsScore + stats.totalBothTeamsScore)) * 0.3 +
            (stats.maxNoBothTeamsScore / (stats.totalNoBothTeamsScore + stats.totalBothTeamsScore)) * 0.2
        ).toFixed(2);
    }

    return teamStats;
}

function displayMaximas(teamStats) {
    const maximasTableBody = document.getElementById('maximasTable').querySelector('tbody');

    maximasTableBody.innerHTML = ''; // Limpar o corpo da tabela de máximas

    // Ordenar por currentNoBothTeamsScore de forma decrescente inicialmente
    const sortedTeamStats = Object.entries(teamStats).sort(([, a], [, b]) => b.currentNoBothTeamsScore - a.currentNoBothTeamsScore);

    sortedTeamStats.forEach(([team, stats]) => {
        // Adicionar à tabela de máximas
        const maximasRow = document.createElement('tr');
        maximasRow.innerHTML = `
            <td>${team}</td>
            <td>${stats.currentNoBothTeamsScore}</td>
            <td>${stats.maxNoBothTeamsScore}</td>
            <td>${stats.totalBothTeamsScore}</td>
            <td>${(stats.paymentProbability * 100).toFixed(2)}%</td>
        `;
        maximasTableBody.appendChild(maximasRow);
    });

    document.getElementById('maximasTable').style.display = 'block';

    // Ordenação padrão pela coluna de máxima atual (coluna 1, que é a segunda coluna)
    sortTable('maximasTable', 1, 'desc');
}

function sortTable(tableId, column, order) {
    const table = document.getElementById(tableId);
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));

    let sortedRows;
    if (column === 0) {
        sortedRows = rows.sort((a, b) => a.children[0].textContent.localeCompare(b.children[0].textContent));
    } else {
        sortedRows = rows.sort((a, b) => {
            const aValue = parseInt(a.children[column].textContent);
            const bValue = parseInt(b.children[column].textContent);
            return aValue - bValue;
        });
    }

    if (order === 'desc') {
        sortedRows.reverse();
    }

    tbody.innerHTML = '';
    sortedRows.forEach(row => tbody.appendChild(row));
}

function toggleSort(tableId, column) {
    const table = document.getElementById(tableId);
    const button = table.querySelector(`th button[data-order]`);

    if (!button) return; // Verifica se o botão existe antes de tentar acessar o atributo

    const currentOrder = button.getAttribute('data-order') || 'asc';
    const newOrder = currentOrder === 'asc' ? 'desc' : 'asc';

    table.querySelectorAll('th button').forEach(btn => btn.setAttribute('data-order', 'asc'));
    button.setAttribute('data-order', newOrder);

    sortTable(tableId, column, newOrder);
}

function generateMaximasDeTimes() {
    const data = document.getElementById('dataInput').value;
    const games = createGameArray(data);
    const gameArray = organizeGamesInColumns(games, 20);
    const invertedGameArray = invertGameArray(gameArray);
    const teamStats = calculateMaximasAmbosMarcam(invertedGameArray);
    displayMaximas(teamStats);
}
