var state = false;
var results = [];
var sortOrder = 'default';

function generateRanking() {
    processData(false);
}

function generateRankingWithNegatives() {
    processData(true);
}

function processData(includeNegatives) {
    let data = document.getElementById('dataInput').value;
    let negativeData = document.getElementById('negativeInput').value;
    let filter = document.getElementById('filter').value;
    document.getElementById('btn-sort').style.display = 'block';

    switch (filter) {
        case 'highScoring':
            document.getElementById('filterExpose').innerText = 'OVER 3.5';
            break;
        case 'veryHighScoring':
            document.getElementById('filterExpose').innerText = '5+';
            break;
        case 'homeWins':
            document.getElementById('filterExpose').innerText = 'Casa Vence';
            break;
        case 'awayWins':
            document.getElementById('filterExpose').innerText = 'Visitante Vence';
            break;
        case 'draw':
            document.getElementById('filterExpose').innerText = 'Empate';
            break;
    }

    data = data.replace(/['"]+/g, '');
    negativeData = negativeData.replace(/['"]+/g, '');

    const games = data.trim().split(/\t|\n/);
    const negativeGames = negativeData.trim().split(/\t|\n/);

    const matches = [];
    for (let i = 0; i < games.length; i += 2) {
        const teams = games[i].trim();
        const score = games[i + 1].trim();
        matches.push({ teams, score });
    }

    const negativeMatches = [];
    if (negativeData !== '') {
        for (let i = 0; i < negativeGames.length; i += 2) {
            const teams = negativeGames[i].trim();
            const score = negativeGames[i + 1].trim();
            negativeMatches.push({ teams, score });
        }
    }

    const teamStats = {};
    matches.forEach(match => {
        const [team1, team2] = match.teams.split(' x ');
        const [score1, score2] = match.score.split('-').map(Number);
        const totalGoals = score1 + score2;

        if (!teamStats[team1]) {
            teamStats[team1] = { highScoringGames: 0, veryHighScoringGames: 0, homeWins: 0, awayWins: 0, draws: 0, totalGames: 0, points: 0, noWinsStreak: 0, currentStreak: 0, maxNoWinsStreak: 0 };
        }
        if (!teamStats[team2]) {
            teamStats[team2] = { highScoringGames: 0, veryHighScoringGames: 0, homeWins: 0, awayWins: 0, draws: 0, totalGames: 0, points: 0, noWinsStreak: 0, currentStreak: 0, maxNoWinsStreak: 0 };
        }

        teamStats[team1].totalGames++;
        teamStats[team2].totalGames++;

        if (totalGoals >= 3.5) {
            teamStats[team1].highScoringGames++;
            teamStats[team2].highScoringGames++;
        }
        if (totalGoals >= 5) {
            teamStats[team1].veryHighScoringGames++;
            teamStats[team2].veryHighScoringGames++;
        }
        if (score1 > score2) {
            teamStats[team1].homeWins++;
            teamStats[team1].points += 3;
            teamStats[team1].currentStreak = 0;
            teamStats[team2].currentStreak++;
            if (teamStats[team2].currentStreak > teamStats[team2].maxNoWinsStreak) {
                teamStats[team2].maxNoWinsStreak = teamStats[team2].currentStreak;
            }
        } else if (score2 > score1) {
            teamStats[team2].awayWins++;
            teamStats[team2].points += 3;
            teamStats[team2].currentStreak = 0;
            teamStats[team1].currentStreak++;
            if (teamStats[team1].currentStreak > teamStats[team1].maxNoWinsStreak) {
                teamStats[team1].maxNoWinsStreak = teamStats[team1].currentStreak;
            }
        } else {
            teamStats[team1].draws++;
            teamStats[team2].draws++;
            teamStats[team1].points += 1;
            teamStats[team2].points += 1;
            teamStats[team1].currentStreak++;
            teamStats[team2].currentStreak++;
            if (teamStats[team1].currentStreak > teamStats[team1].maxNoWinsStreak) {
                teamStats[team1].maxNoWinsStreak = teamStats[team1].currentStreak;
            }
            if (teamStats[team2].currentStreak > teamStats[team2].maxNoWinsStreak) {
                teamStats[team2].maxNoWinsStreak = teamStats[team2].currentStreak;
            }
        }
    });

    const filterOption = document.getElementById('filter').value;
    const filterWeight = parseInt(document.getElementById('filter').selectedOptions[0].getAttribute('data-weight'));
    const tbody = document.getElementById('resultsTable').querySelector('tbody');
    tbody.innerHTML = '';

    results = [];
    Object.keys(teamStats).forEach(team => {
        const games = getGamesByFilter(teamStats[team], filterOption);
        const totalGames = teamStats[team].totalGames;
        const points = teamStats[team].points;
        const participationPoints = games * filterWeight;

        results.push({ team, games, totalGames, points, participationPoints });
    });

    results.sort(customSort);
    displayResults(results);

    if (includeNegatives && negativeData !== '') {
        createNegativeMatchTable(negativeMatches.slice(0, 20), 'matchTable', results.slice(0, 5).map(result => result.team));
        validateTopTeams(results, negativeMatches);
    }
}

function getGamesByFilter(stats, filterOption) {
    switch (filterOption) {
        case 'highScoring':
            return stats.highScoringGames;
        case 'veryHighScoring':
            return stats.veryHighScoringGames;
        case 'homeWins':
            return stats.homeWins;
        case 'awayWins':
            return stats.awayWins;
        case 'draw':
            return stats.draws;
        default:
            return 0;
    }
}

function clearData() {
    document.getElementById('dataInput').value = "";
    document.getElementById('negativeInput').value = "";
    document.getElementById('resultsTable').style.display = 'none';
    document.getElementById('matchTable').style.display = 'none';
    document.getElementById('missingTeamsTable').style.display = 'none';
    document.getElementById('maximasTable').style.display = 'none';
    document.getElementById('maximasTable').querySelector('tbody').innerHTML = '';
}

function createNegativeMatchTable(matches, tableId, topTeams) {
    const table = document.getElementById(tableId);
    const tbody = table.querySelector('tbody');
    tbody.innerHTML = '';

    const row = document.createElement('tr');
    const topTeamsSet = new Set(topTeams);

    matches.forEach(match => {
        const cell = document.createElement('td');
        cell.textContent = `${match.teams}\n${match.score}`;

        const [team1, team2] = match.teams.split(' x ');
        const [score1, score2] = match.score.split('-').map(Number);
        const totalGoals = score1 + score2;

        if (topTeamsSet.has(team1) && topTeamsSet.has(team2)) {
            cell.classList.add('light-blue');
        } else if (topTeamsSet.has(team1) || topTeamsSet.has(team2)) {
            if (totalGoals >= 2.5) {
                cell.classList.add('light-green');
            } else {
                cell.classList.add('light-red');
            }
        }

        row.appendChild(cell);
    });

    tbody.appendChild(row);
    table.style.display = 'block';
}

function validateTopTeams(results, negativeMatches) {
    const topTeams = results.slice(0, 5).map(result => result.team);
    const matchTeams = new Set(negativeMatches.flatMap(match => match.teams.split(' x ')));

    const missingTeams = topTeams.filter(team => !matchTeams.has(team));

    const missingTbody = document.getElementById('missingTeamsTable').querySelector('tbody');
    missingTbody.innerHTML = '';

    missingTeams.forEach(team => {
        const row = document.createElement('tr');
        row.innerHTML = `<td>${team}</td>`;
        missingTbody.appendChild(row);
    });

    if (missingTeams.length > 0) {
        document.getElementById('missingTeamsTable').style.display = 'block';
    } else {
        document.getElementById('missingTeamsTable').style.display = 'none';
    }
}

function customSort(a, b) {
    const ratioA = (a.points * a.games) / a.totalGames;
    const ratioB = (b.points * b.games) / b.totalGames;

    return ratioB - ratioA;
}

function sortByPercentage() {
    results.sort((a, b) => {
        const percentageA = a.games / a.totalGames;
        const percentageB = b.games / b.totalGames;

        return percentageB - percentageA;
    });
}

function toggleSortByPercentage() {
    state = !state;
    if (state) {
        sortByPercentage();
    } else {
        results.sort(customSort);
    }
    displayResults(results);
}

function displayResults(results) {
    const tbody = document.getElementById('resultsTable').querySelector('tbody');
    tbody.innerHTML = '';

    results.forEach((result, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${result.team}</td>
            <td>${result.points}</td>
            <td>${result.totalGames}</td>
            <td>${result.games}</td>
            <td>${(result.games / result.totalGames * 100).toFixed(2)}</td>
        `;
        tbody.appendChild(row);
        document.getElementById('resultsTable').style.display = 'block';
    });
}



function generateMaximasDeTimes() {
    const data = document.getElementById('dataInput').value.replace(/['"]+/g, '');
    const games = data.trim().split(/\t|\n/);

    const matches = [];
    for (let i = 0; i < games.length; i += 2) {
        const teams = games[i].trim();
        const score = games[i + 1].trim();
        matches.push({ teams, score });
    }

    // Invertendo a ordem dos jogos para análise de trás para frente
    matches.reverse();

    const teamStats = {};

    matches.forEach(match => {
        const [team1, team2] = match.teams.split(' x ');
        const [score1, score2] = match.score.split('-').map(Number);

        if (!teamStats[team1]) {
            teamStats[team1] = { currentStreak: 0, maxNoWinsStreak: 0, sinceLastWin: 0 };
        }
        if (!teamStats[team2]) {
            teamStats[team2] = { currentStreak: 0, maxNoWinsStreak: 0, sinceLastWin: 0 };
        }

        if (score1 > score2) {
            // Team 1 wins, reset its current streak
            teamStats[team1].sinceLastWin = 0;
            // Update Team 2
            teamStats[team2].sinceLastWin++;
            if (teamStats[team2].sinceLastWin > teamStats[team2].maxNoWinsStreak) {
                teamStats[team2].maxNoWinsStreak = teamStats[team2].sinceLastWin;
            }
        } else if (score2 > score1) {
            // Team 2 wins, reset its current streak
            teamStats[team2].sinceLastWin = 0;
            // Update Team 1
            teamStats[team1].sinceLastWin++;
            if (teamStats[team1].sinceLastWin > teamStats[team1].maxNoWinsStreak) {
                teamStats[team1].maxNoWinsStreak = teamStats[team1].sinceLastWin;
            }
        } else {
            // Draw, update both teams' streaks
            teamStats[team1].sinceLastWin++;
            teamStats[team2].sinceLastWin++;
            if (teamStats[team1].sinceLastWin > teamStats[team1].maxNoWinsStreak) {
                teamStats[team1].maxNoWinsStreak = teamStats[team1].sinceLastWin;
            }
            if (teamStats[team2].sinceLastWin > teamStats[team2].maxNoWinsStreak) {
                teamStats[team2].maxNoWinsStreak = teamStats[team2].sinceLastWin;
            }
        }

        // Set the current streak for the final result
        teamStats[team1].currentStreak = teamStats[team1].sinceLastWin;
        teamStats[team2].currentStreak = teamStats[team2].sinceLastWin;
    });

    // Transformar os dados do objeto em uma array para ordenação
    const teamStatsArray = Object.keys(teamStats).map(team => ({
        team,
        currentStreak: teamStats[team].currentStreak,
        maxNoWinsStreak: teamStats[team].maxNoWinsStreak
    }));

    // Ordenar pela coluna "Máxima Atual" em ordem decrescente
    teamStatsArray.sort((a, b) => b.currentStreak - a.currentStreak);

    const maximasTable = document.getElementById('maximasTable');
    const tbody = maximasTable.querySelector('tbody');
    tbody.innerHTML = '';

    teamStatsArray.forEach(teamStat => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${teamStat.team}</td>
            <td>${teamStat.currentStreak}</td>
            <td>${teamStat.maxNoWinsStreak}</td>
        `;
        tbody.appendChild(row);
    });

    maximasTable.style.display = 'block';
}
