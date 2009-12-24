HOST = 'http://xiangqi-gadget.googlecode.com/svn/trunk/';
SQUARE_SIZE = 26;
CURSOR_BORDER = 2;

EMPTY_SPACE = '.';

COLOR = {
	'red': 1,
	'black': 2
};

MAXROW = 10;
MAXCOL = 9;

RankName = {
	'K':"帅",'S':"仕",'X':"相",'M':"马",'J':"车",'P':"炮",'B':"兵",
	'k':"将",'s':"士",'x':"象",'m':"马",'j':"车",'p':"炮",'b':"卒"
};

board = null;
playerId = undefined;
opponentId = undefined;

DEFAULT_BOARD = [
	'jmxsksxmj'.split(''),
	'.........'.split(''),
	'.p.....p.'.split(''),
	'b.b.b.b.b'.split(''),
	'.........'.split(''),
	'.........'.split(''),
	'B.B.B.B.B'.split(''),
	'.P.....P.'.split(''),
	'.........'.split(''),
	'JMXSKSXMJ'.split('')
];

var MOVE_COMPASS = [
	[-1,-1], [0,-1], [1,-1], [1,0],
	[1,1], [0,1], [-1,1], [-1,0]
];

capturedPieces = [];

gameState = {
	board: null,
	moveHistory: [],
	current: COLOR.red,
	cursor: null,
	winner: -1,
	black: undefined,
	red: undefined
};

window.$ = function(id) {
	return document.getElementById(id);
};

function showElement(name) {
	$(name).className = '';
}

function hideElement(name) {
	$(name).className = 'hide';
}

function clearChildren(el) {
	while (el.firstChild) {
		el.removeChild(el.firstChild);
	}
}

function Pos(row, col) {
	this.row = row;
	this.col = col;
}

function recordMove(ch,coords) {
	gameState.moveHistory += "";
}

function isMyTurn() {
	return !self.gameOver && gameState.current == getMyColor();
}

function newPos(x, y) {
	return {'x': x, 'y': y};
}

function newCoords(row, col) {
	return {'row' : row, 'col': col};
}

function coordsToPos(coords) {
	var x = SQUARE_SIZE * coords.col;
	var y = SQUARE_SIZE * coords.row;
	return newPos(x, y);
}

function posToCoords(pos) {
	boardPos = getElementPos(board.root);
	var y = (pos.y - boardPos.y - SQUARE_SIZE/2) / SQUARE_SIZE;
	var x = (pos.x - boardPos.x - SQUARE_SIZE/2) / SQUARE_SIZE;
	y = Math.floor(y);
	x = Math.floor(x);
	return newCoords(y, x);
}

function coordsValid(c) {
	return c.col >= 0 && c.col < MAXCOL &&
	       c.row >= 0 && c.row < MAXROW;
}

function coordsEqual(a, b) {
	if (a && b) {
	  return a.row == b.row && a.col == b.col;
	}
	return false;
}

function setPos(el, pos) {
	el.style.left = pos.x + 'px';
	el.style.top = pos.y + 'px';
}

function codeToPiece(code) {
	var divPiece = document.createElement('div');
	divPiece.className="piece";

	var divBK = document.createElement('div');
	if (code > 'a') divBK.className="bkred";
	else divBK.className="bkblack";
	divBK.innerText="●";
	divPiece.appendChild(divBK);

	var divName = document.createElement('div');
	divName.className = "piecefront";
	divName.innerText = RankName[code];
	divPiece.appendChild(divName);

	return divPiece;
}

function getOtherColor(color) {
	return color == COLOR.red ? COLOR.black : COLOR.red;
}

function getElementPos(el) {
	var x = 0;
	var y = 0;
	if (el.offsetParent) {
		do {
			x += el.offsetLeft;
			y += el.offsetTop;
		} while (el = el.offsetParent);
	}
	return newPos(x, y);
}

function getMousePos(e) {
	var x = 0;
	var y = 0;
	if (!e) {
		e = window.event;
	}

	if (e.pageX || e.pageY) {
		x = e.pageX;
		y = e.pageY;
	} else if (e.clientX || e.clientY) {
		x = e.clientX + document.body.scrollLeft
			+ document.documentElement.scrollLeft;
		y = e.clientY + document.body.scrollTop
			+ document.documentElement.scrollTop;
	}
	return newPos(x, y)
}

function changePointer(type) {
	document.body.style.cursor = type;
}

function setInfo(msg) {
	$('info').innerHTML = msg;
}

function selectColor(color) {
	if (color == COLOR.black) {
		gameState.black = playerId;
		gameState.white = opponentId;
	} else {
		gameState.black = opponentId;
		gameState.white = playerId;
	}
	updateGameState();
}

function getMyColor() {
	return gameState.black == playerId ? COLOR.black : COLOR.red;
}

function getOpponentColor() {
	return gameState.black == playerId ? COLOR.red : COLOR.black;
}

function turnGrid(color) {
	var grid="123456789九八七六五四三二一";
	if (color == COLOR.black) {
        grid="一二三四五六七八九987654321";
	}
	for(i=0;i<MAXCOL;i++){
		s=$('uGrid').getElementsByTagName("td")[i];
		d=$('dGrid').getElementsByTagName("td")[i];
		s.innerText=grid.charAt(i);
		d.innerText=grid.charAt(MAXCOL+i);
	}
}

function applyRotation(coords) {
	if (getMyColor() == COLOR.black) {
		coords.col = MAXCOL - coords.col -1;
		coords.row = MAXROW - coords.row -1;
	}
}


//Board
function Board() {
	var self = this;
	this.root = $('board');
	clearChildren(this.root);

    this.setState(DEFAULT_BOARD);
    this.cursor = null;
	this.gameOver = false;
}

Board.onClick = function(e) {
	if (!board) {
	  return;
	}
	if (!isMyTurn()) {
	  return;
	}
	var pos = getMousePos(e);
	coords = posToCoords(pos);
	if (!board.isValidMove(coords)) return;

	board.putAStone(coords);
};

Board.prototype.checkCapture = function(ch) {
	this.checkCaptureColor(getOtherColor(ch));
	this.checkCaptureColor(ch);
}


Board.onMouseMove = function(e) {
	if (!board) {
	  	return;
	}
	if (!isMyTurn()) {
	  	return false;
	}

	var pos = getMousePos(e);
	var coords = posToCoords(pos);
	if (board.isValidMove(coords)) {
		changePointer("pointer");
	} else {
		changePointer("default");
	}
};

Board.onMouseOut = function(e) {
	changePointer('default');
};

Board.prototype.setState = function(state) {
	this.state = [];
	for (var i = 0; i < MAXROW; ++i) {
		var row = [];
		for (var j = 0; j < MAXCOL; ++j) {
			row.push(state[i][j]);
		}
		this.state.push(row);
	}
}

Board.prototype.isValidMove = function(coords) {
	if (coords.row<0 || coords.col<0 || coords.row>GAME_SIZE-1 || coords.col>GAME_SIZE-1) return false;
	if (board.state[coords.row][coords.col] != EMPTY_SPACE) return false;
	return true;
};

Board.prototype.endTurn = function() {
	gameState.current = getOtherColor(gameState.current);
	updateGameState();
};

Board.prototype.clearBoard = function() {
	$('void').appendChild($('cursor'));
	clearChildren(this.root);
}

Board.prototype.render = function() {
	this.clearBoard();

	for (var i = 0; i < MAXROW; ++i) {
		for (var j = 0; j < MAXCOL; ++j) {
			var ch = this.state[i][j];
			if (ch == EMPTY_SPACE) {
				continue;
			}
			var divPiece = codeToPiece(ch);
			var coords = newCoords(i, j);
			applyRotation(coords);
			setPos(divPiece, coordsToPos(coords));
			this.root.appendChild(divPiece);
		}
	}

	/*
	if (!gameState.black) {
		if (opponentId)
			this.root.appendChild($('selectColor'));
		hideElement('resign');
	} else {
		showElement('resign');
	}

	var msg = '';
	if (gameState.winner != -1) {
		msg = gameState.winner == COLOR.red ? 'White' : 'Black';
		msg += ' wins!';
		hideElement('resign');
		showElement('rematch');
	} else {
		if (gameState.current == COLOR.red) {
			msg = 'White to Move';
		} else {
			msg = 'Black to Move';
		}
		hideElement('rematch');
	}
	setInfo(msg);

	if (gameState.last) {
		var cursor = $("cursor");
		cursor.className = 'cursor';
		setPos(cursor, coordsToPos(gameState.last));
        this.root.appendChild(cursor);
		//alert("add cursor "+gameState.last.row+","+gamestate.last.col);
	}
	*/
};

  function resign() {
	var myID=wave.getViewer().getId();
	if (myID != gameState.black && myID != gameState.white) {
		return;
	}
    gameState.winner = getOpponentColor();
    updateGameState();
  }

function leave() {
	var myID=wave.getViewer().getId();
	if (myID == gameState.black) {
	    gameState.black = undefined;
		gameState.blackName = undefined;
	} else if (myID == gameState.white) {
		gameState.white = undefined;
		gameState.whiteName = undefined;
	} else {
		return;
	}
	updateGameState();
}

function rematch() {
	var myID=wave.getViewer().getId();
	if (myID != gameState.black && myID != gameState.white) {
		return;
	}
	resetGame();
	updateGameState();
}

function resetGame() {
	gameState.current = COLOR.black;
	gameState.moveHistory = "";
	gameState.winner = -1;
	gameState.last = "";
	gameState.black = "";
	gameState.red = "";
	board = new Board();
	board.render();
}

function onLanguageChange(selectedLang) {
	lang= selectedLang;
}

function setGameTitle() {
    $('blackname').innerHTML = gameState.blackName;
    $('whitename').innerHTML = gameState.whiteName;
}

function getPlayerName(pid) {
	var parts = wave.getParticipants();
	for(var i=0;i<parts.length;i++){
		var id = parts[i].getId();
		if (id==pid){
			return parts[i].getDisplayName();
		}
	}
	return "";
}

function onStateChange(state) {
	if (!state) {
		return;
	}

	if (!board)
		return;

	if (!playerId) {
		playerId = wave.getViewer().getId();
	}

	var tempState = JSON.parse(state.get('gameState','{}'));
	if (tempState && tempState.board){
		if (!opponentId && tempState.white && tempState.black){
			opponentId = playerId==tempState.white?tempState.black:tempState.white;
		}
		gameState = tempState;
		board.setState(gameState.board);
        setGameTitle();
		board.render();
	}
}

function onParticipantsChange() {
	if (opponentId||gameState.black)
		return;

	var parts = wave.getParticipants();
	if (parts.length>1){
		if (!playerId)  {
			playerId = wave.getViewer().getId();
		}
		for(var i=0;i<parts.length;i++){
			var id = parts[i].getId();
			if (id!=playerId){
				opponentId = id;
				resetGame();
				updateGameState();
				return;
			}
		}
	}
}

function updateGameState() {
	gameState.board = JSON.stringify(board.state);
	gameState.blackName=getPlayerName(gameState.black);
    gameState.whiteName=getPlayerName(gameState.white);
	wave.getState().submitDelta({gameState:JSON.stringify(gameState)});
}
