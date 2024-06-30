function generateMaximasDeTimes() {
    const data = document.getElementById('dataInput').value.replace(/['"]+/g, '').replace(/\+/g, '').trim();
    if (!data) {
        alert("Por favor, insira os dados dos jogos.");
        return;
    }

    const games = data.split(/\t|\n/).filter(line => line.trim() !== '');

    const matches = [];
    for (let i = 0; i < games.length; i += 2) {
        if (i + 1 < games.length) {
            const teams = games[i].trim();
            const score = games[i + 1].trim();
            if (teams && score) {
                matches.push({ teams, score });
            }
        }
    }

    // Invertendo a ordem dos jogos para análise de trás para frente
    matches.reverse();

    const teamStats = {};

    matches.forEach(match => {
        const [team1, team2] = match.teams.split(' x ').map(team => team.trim());
        const [score1, score2] = match.score.split('-').map(Number);

        if (!teamStats[team1]) {
            teamStats[team1] = { currentWithoutWin: 0, maxNoWinsStreak: 0 };
        }
        if (!teamStats[team2]) {
            teamStats[team2] = { currentWithoutWin: 0, maxNoWinsStreak: 0 };
        }

        if (score1 > score2) {
            // Team 1 wins, reset its current streak
            teamStats[team1].currentWithoutWin = 0;

            // Update Team 2
            teamStats[team2].currentWithoutWin++;
            if (teamStats[team2].currentWithoutWin > teamStats[team2].maxNoWinsStreak) {
                teamStats[team2].maxNoWinsStreak = teamStats[team2].currentWithoutWin;
            }
        } else if (score2 > score1) {
            // Team 2 wins, reset its current streak
            teamStats[team2].currentWithoutWin = 0;

            // Update Team 1
            teamStats[team1].currentWithoutWin++;
            if (teamStats[team1].currentWithoutWin > teamStats[team1].maxNoWinsStreak) {
                teamStats[team1].maxNoWinsStreak = teamStats[team1].currentWithoutWin;
            }
        } else {
            // Draw, update both teams' streaks
            teamStats[team1].currentWithoutWin++;
            teamStats[team2].currentWithoutWin++;
            if (teamStats[team1].currentWithoutWin > teamStats[team1].maxNoWinsStreak) {
                teamStats[team1].maxNoWinsStreak = teamStats[team1].currentWithoutWin;
            }
            if (teamStats[team2].currentWithoutWin > teamStats[team2].maxNoWinsStreak) {
                teamStats[team2].maxNoWinsStreak = teamStats[team2].currentWithoutWin;
            }
        }

        if(teamStats[team1] == "Coreia do Sul") {

            console.log(a)
        }
    });


    

    // Transformar os dados do objeto em uma array para ordenação
    const teamStatsArray = Object.keys(teamStats).map(team => ({
        team,
        currentWithoutWin: teamStats[team].currentWithoutWin,
        maxNoWinsStreak: teamStats[team].maxNoWinsStreak
    }));

    // Ordenar pela coluna "Máxima Atual" em ordem decrescente
    teamStatsArray.sort((a, b) => b.maxNoWinsStreak - a.maxNoWinsStreak);

    const maximasTable = document.getElementById('maximasTable');
    const tbody = maximasTable.querySelector('tbody');
    tbody.innerHTML = '';

    teamStatsArray.forEach(teamStat => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${teamStat.team}</td>
            <td>${teamStat.currentWithoutWin}</td>
            <td>${teamStat.maxNoWinsStreak}</td>
        `;
        tbody.appendChild(row);
    });

    maximasTable.style.display = 'block';
}
