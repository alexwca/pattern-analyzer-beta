var state = false;
var results = [];
var sortOrder = 'default';

function generateRankingWithNegatives() {
    processDataWithNegatives();
}

function processDataWithNegatives() {
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
            teamStats[team1] = { highScoringGames: 0, veryHighScoringGames: 0, homeWins: 0, awayWins: 0, draws: 0, totalGames: 0, points: 0 };
        }
        if (!teamStats[team2]) {
            teamStats[team2] = { highScoringGames: 0, veryHighScoringGames: 0, homeWins: 0, awayWins: 0, draws: 0, totalGames: 0, points: 0 };
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
        } else if (score2 > score1) {
            teamStats[team2].awayWins++;
            teamStats[team2].points += 3;
        } else {
            teamStats[team1].draws++;
            teamStats[team2].draws++;
            teamStats[team1].points += 1;
            teamStats[team2].points += 1;
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

    if (negativeData !== '') {
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
    document.getElementById('matchTable').style.display = 'block';
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
