window.addEventListener('DOMContentLoaded', () => {
    console.log('Page loaded');

    // Function to fetch data from the API
    async function fetchData() {
        try {
            const response = await fetch('https://api.freefoodparty.com/observablelist_all');
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            console.log('API response:', data);
            findESOCLobbyA(data);
        } catch (error) {
            console.error('Error fetching data from the API:', error);
            document.getElementById('result').textContent = 'Error fetching data from the API';
        }
    }

    // Function to find the game named "ESOC Lobby A"
    function findESOCLobbyA(data) {
        try {
            const games = data.observableMatchInfo;
            if (!games) {
                throw new Error('No games found in the API data');
            }

            const esocLobbyAGame = games.find(game => game.gameName === "ESOC Lobby A");

            if (esocLobbyAGame) {
                const playerIDs = esocLobbyAGame.obeservableMatchPlayerInfo
                    .filter(player => player.idPlayer !== -1)
                    .map(player => ({
                        idPlayer: player.idPlayer,
                        idCiv: player.idCiv
                    }));

                console.log('Player IDs:', playerIDs);
                getPlayerStats(playerIDs);
            } else {
                throw new Error('ESOC Lobby A not found');
            }
        } catch (error) {
            console.error('Error finding ESOC Lobby A:', error);
            document.getElementById('result').textContent = 'Error finding ESOC Lobby A';
        }
    }

    // Function to fetch player stats based on player IDs
    async function getPlayerStats(playerIDs) {
        try {
            const validPlayerIDs = playerIDs.filter(player => player.idPlayer !== -1);
            if (validPlayerIDs.length === 0) {
                console.log('No valid player IDs found');
                document.getElementById('result').textContent = 'No valid player IDs found';
                return;
            }

            const playerPromises = validPlayerIDs.map(player =>
                fetch(`https://api.freefoodparty.com/player/playerprofile?idPlayer=${player.idPlayer}`)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Network response was not ok');
                        }
                        return response.json();
                    })
                    .then(data => ({
                        playerInfo: data.playerInfos,
                        idCiv: player.idCiv
                    }))
            );

            const playerInfos = await Promise.all(playerPromises);
            console.log('Player infos:', playerInfos);
            getPlayerWinPercentages(playerInfos);
        } catch (error) {
            console.error('Error fetching player data from the API:', error);
            document.getElementById('result').textContent = 'Error fetching player data from the API';
        }
    }

    // Function to fetch player win percentages based on player IDs
    async function getPlayerWinPercentages(playerInfos) {
        try {
            const playerWinPercentagePromises = playerInfos.map(player =>
                fetch(`https://api.freefoodparty.com/chart/chartwinrategamecount?gameMode=2&idPatch=0&ratingMin=0&ratingMax=2500&idPlayer=${player.playerInfo.idPlayer}`)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Network response was not ok');
                        }
                        return response.json();
                    })
                    .then(data => ({
                        winPercentageData: data,
                        idCiv: player.idCiv
                    }))
            );

            const playerWinPercentages = await Promise.all(playerWinPercentagePromises);
            console.log('Player win percentages:', playerWinPercentages);
            displayPlayerStats(playerInfos, playerWinPercentages);
        } catch (error) {
            console.error('Error fetching player win percentages from the API:', error);
            document.getElementById('result').textContent = 'Error fetching player win percentages from the API';
        }
    }

    // Function to display player stats
    function displayPlayerStats(playerInfos, playerWinPercentages) {
        if (playerInfos.length > 0) {
            playerInfos.forEach((player, index) => {
                const playerStats = player.playerInfo.playerElo.find(elo => elo.gameMode === 2);
                const winPercentage = playerWinPercentages[index].winPercentageData.find(data => data.idciv === player.idCiv);
                const rank = player.playerInfo.playerElo.find(elo => elo.gameMode === 2)?.rank || 'N/A';
                console.log('Player stats:', playerStats);
                console.log('Win percentage:', winPercentage);
                console.log('Rank:', rank);
                if (playerStats) {
                    const playerElement = index === 0 ? document.getElementById('player1') : document.getElementById('player2');
                    playerElement.innerHTML = `
                        <p>${player.playerInfo.name}</p>
                        <p>Rank: #${rank}</p>
                        <p>Curr. ELO: ${playerStats.rating}</p>
                        <p>Max ELO: ${playerStats.ratingMax}</p>
                        <p>Wins: ${playerStats.wins}</p>
                        <p>Losses: ${playerStats.losses}</p>
                        <p>Civ Win %: ${winPercentage ? winPercentage.winPercentage.toFixed(2) + '%' : 'N/A'}</p>
                    `;
                } else {
                    document.getElementById('result').textContent = 'Player stats not found';
                }
            });
        } else {
            document.getElementById('result').textContent = 'No player data found';
        }
    }

    // Fetch data initially when the page loads
    fetchData();

    // Auto-refresh data every 30 seconds
    setInterval(fetchData, 300);

    // Function to fetch data initially and start the interval
    function initialize() {
        fetchDataAndProcess(); // Fetch data initially
        // Schedule fetchDataAndProcess to run every 30 seconds
        setInterval(fetchDataAndProcess, 3000);
    }

    // Initialize the process
    initialize();
});
