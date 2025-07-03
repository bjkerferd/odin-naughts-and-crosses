function createGameBoard () {
    // Abstract object representing the current gameboard
    // Always 3x3 grid
    // Does not police the values to be applied to the board

    const boardState = Array(3).fill().map(() => Array(3).fill(null)); // 3x3 array of null
    const winningCells = Array(3).fill().map(() => Array(3).fill(false));

    const rowCoords = Array(3).fill().map((_, i) => Array(3).fill().map((_, j) => [i, j]));
    const colCoords = Array(3).fill().map((_, i) => Array(3).fill().map((_, j) => [j, i]));
    const diagCoords = [
        [[0,0], [1,1], [2,2]],
        [[2,0], [1,1], [0,2]]
    ]

    const winnableSequences = rowCoords.concat(colCoords, diagCoords);
 
    function setCell (row, col, char) {
        // Relies on game manager to pass valid chars
        boardState[row][col] = char;
    }

    function getCell (row, col) {
        return boardState[row][col];
    }

    function _getRow(row) {
        return boardState[row];
    }

    function _getCol(col) {
        return boardState.map(row => row[col]);
    }

    function _getDiagonal(index) {
        if (index === 0) {
            return [getCell(0, 0), getCell(1, 1), getCell(2, 2)]; // return main diagonal 
        } else if (index === 1) {
            return [getCell(2, 0), getCell(1, 1), getCell(0, 2)]; // return anti diagonal
        } else {
            return null
        }
    }

    function _getSequence(sequenceCoords) {
        return sequenceCoords.map((coord) => getCell(coord[0], coord[1]));
    }

    function _markWinner(sequenceCoords) {
        sequenceCoords.forEach(([i, j]) => winningCells[i][j] = true)
    }

    function getBoard () {
        return boardState.slice(); // Return a copy of the array to prevent illegal access
    }

    function getBoardDict () {
        rows = Array(3).map((_, i) => _getRow(i));
        cols = Array(3).map((_, i) => _getCol(i));
        diags = Array(2).map((_, i) => _getDiagonal(i));
        return {rows, cols, diags}
    }

    function reset () {
        boardState.map((row, i) => row.forEach((_, j) => setCell(i, j, null)));
        winningCells.map(row => row.fill(false));
    }

    function _forceUpdateBoardState (newBoard) {
        reset();
        newBoard.forEach((row, i) => {
            row.forEach((val, j) => setCell(i, j, val));
        });
    }

    function _checkSequence (sequence) {
        // winner if sequence is all the same, otherwise returns False
        return sequence.reduce((acc, val) => {
            return val === acc ? val : null
        });
    }
    
    function checkForWin() {
        winnableSequences.forEach((sequenceCoords) => {
            const sequence = _getSequence(sequenceCoords);
            const winner = _checkSequence(sequence);
            if (winner) {
                _markWinner(sequenceCoords);
                return winner
            }
        })
        return null;
    }

    return {setCell, getCell, getBoard, reset,
        _forceUpdateBoardState,
        winnableSequences,
        winningCells,
        checkForWin
    }
};

function ConsoleArtist (getBoard, getStats) {    
    // Used to render the game in the browser console
    function _triageRow(row) {
        return row.map(item => !item ? "_" : item);
    }

    function _renderRow(row, rowNum) {
        const rowString = row.join("\t\t");
        console.log(`R${rowNum+1}:    ${rowString}`);
    }

    function _renderRoundEndRow(row, won, rowNum) {
        const highlightedRow = row.map((val, i) => won[i] ? `[${val}]` : val);
        _renderRow(highlightedRow, rowNum);
    }

    function renderBoardState() {
        // Renders the current board configuration in the console. 
        const board = getBoard();
        console.log("-".repeat(40));
        board.forEach((_, i) => {
            const row = _triageRow(board[i]);
            _renderRow(row, i);
        })
    };

    function renderStats() {
        stats = getStats()
        console.log(`P1: ${stats.P1}; P2: ${stats.P2}; Ties: ${stats.ties}`)
    }

    function renderRoundEndBoard(winningCells) {
        const board = getBoard();
        console.log("-".repeat(40))
        board.forEach((_, i) => {
            const row = _triageRow(board[i]);
            const won = winningCells[i];
            const finalRow = _renderRoundEndRow(row, won, i);
        })
    }

    function renderGameIntro(rounds) {
        console.log("Welcome to the Naught's & Crosses Championship!")
        console.log(`Today, Player 1 and Player 2 will be facing off over ${rounds} rounds.`)
    }

    function renderRoundIntro(round) {
        console.log(`ROUND ${round}`);
    }

    function renderCharacterAllocation(player) {

        console.log(`${player.getName()} is X and goes first.`)
    }

    return {
        renderBoardState, 
        renderStats,
        renderRoundEndBoard,
        renderGameIntro,
        renderRoundIntro,
        renderCharacterAllocation
    }

};

function createPlayer (name) {
    const wins = 0;
    let char;

    function addWin() {
        wins += 1;
    }

    function getWins() {
        return wins
    }

    function setChar(newChar) {
        char = newChar;
    }

    function getChar() {
        return char;
    }

    function getName() {
        return name
    }

    function getMove(getCell) {
        while (true) {
            const row = Number.parseInt(prompt(`${name}, enter your row.`))
            const col = Number.parseInt(prompt(`${name}, enter your col.`))
            if (!getCell(row, col)) {
                return {row, col}
            } else {
                console.log("Please enter an available grid cell coordinate.")
            }
        }
    }

    return {
        getName,
        getWins,
        addWin,
        getChar,
        setChar,
        getMove
    }
}

const GameManager = (function () {
    const ties = 0; // Individual players keep track of wins. Manager tracks draws
    
    const board = createGameBoard();
    const artist = ConsoleArtist(board.getBoard, getStats);

    const P1 = createPlayer("Player 1");
    const P2 = createPlayer("Player 2");

    playGame(3);

    function getStats () {
        return {
            ties,
            "P1": P1.getWins(),
            "P2": P2.getWins()
        }
    } 

    function _checkForChampion() {
        return P1.getWins() >= 2 || P2.getWins() >= 2;
    }

    function _allocateCharacters() {
        // Allocate X randomly
        const chars = ['X', 'O'];
        const lottery = Math.random();
        if (lottery > 0.5) {
            players = [P1, P2];
        } else {
            players = [P2, P1];
        }

        players.forEach((player, i) => player.setChar(chars[i]));
        artist.renderCharacterAllocation(players[0])
        return players
    }

    function playGame(rounds) {
        if (!rounds) rounds=3;
        artist.renderGameIntro(rounds);
        let currentRound = 1;    
        while (rounds > 0 && !_checkForChampion()) {
            artist.renderRoundIntro(currentRound);
            const winner = _playRound();
            artist.renderRoundEnd(winner, board);

            rounds--
            currentRound++
        } 
        
        artist.renderGameEnd()
    }
    
    function _playRound () {
        const players = _allocateCharacters();

        for (turn=0; turn<9; turn++) { // 9 is safe - maximum number of moves
            const player = players[turn % 2];
            const {row, col} = player.getMove(board.getCell);
            board.setCell(row, col, player.getChar());
            winner = board.checkForWin()
            if (winner) {
                winner.addWin()
                return winner()
            } 
            artist.renderBoardState();
        }
        ties += 1
        return null;
    }

    function checkForChampion () {
        // Check if a player has won enough rounds to be the winner
    
    }

    function checkForRoundOver () {

    }



    function isBoardFull() {

    }

    function isRoundWon() {

    }

    return {
        board, // for testing
        artist, // for testing
        P1,
        P2,
        getStats
    }

})();

// Test Code for GameBoard

// GameManager.artist.renderBoardState()
// GameManager.board.setCell(2, 1, "X");
// GameManager.artist.renderBoardState();
// GameManager.artist.renderStats();

// // Test checkForWin
// console.log(GameManager.board.checkForWin())
// GameManager.artist.renderGameEndBoard(GameManager.board.winningCells)

// GameManager.board._forceUpdateBoardState([
//     ["A", "A", "A"],
//     ["A", "A", "B"],
//     ["A", "B", "A"]
// ]);

// console.log(GameManager.board.checkForWin())
// GameManager.artist.renderGameEndBoard(GameManager.board.winningCells)
    
// GameManager.board._forceUpdateBoardState([
//     ["A", "D", "D"],
//     ["C", "A", "B"],
//     ["C", "B", "A"]
// ]);

// console.log(GameManager.board.checkForWin())
// GameManager.artist.renderGameEndBoard(GameManager.board.winningCells)


// Example module for reference from https://dev.to/tomekbuszewski/module-pattern-in-javascript-56jm

// const documentMock = (() => ({
//   querySelector: (selector) => ({
//     innerHTML: null,
//   }),
// }))();

// const Formatter = (function(doc) {
//   const log = (message) => console.log(`[${Date.now()}] Logger: ${message}`);

//   const makeUppercase = (text) => {
//     log("Making uppercase");
//     return text.toUpperCase();
//   };

//   const writeToDOM = (selector, message) => {
//     doc.querySelector(selector).innerHTML = message;
//   }

//   return {
//     makeUppercase,
//     writeToDOM,
//   }
// })(document || documentMock);