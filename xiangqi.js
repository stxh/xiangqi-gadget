/* xiangqi wave gadget js
*
* By StXh <stxh007@gmail.com> 2010-01-05 20:46:21
*/

HOST = "";
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
GameStarted = false;

PIECE = {
	'bing': 0,
	'shi': 1,
	'xiang': 2,
	'pao': 3,
	'ma': 4,
	'jv': 5,
	'shuai': 6
};

PIECE_MAP = {
	'b': PIECE.bing,
	's': PIECE.shi,
	'x': PIECE.xiang,
	'p': PIECE.pao,
	'm': PIECE.ma,
	'j': PIECE.jv,
	'k': PIECE.shuai
};


DEFAULT_BOARD = [
	'JMXSKSXMJ'.split(''),
	'.........'.split(''),
	'.P.....P.'.split(''),
	'B.B.B.B.B'.split(''),
	'.........'.split(''),
	'.........'.split(''),
	'b.b.b.b.b'.split(''),
	'.p.....p.'.split(''),
	'.........'.split(''),
	'jmxsksxmj'.split('')
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
	var y = (pos.y - boardPos.y) / SQUARE_SIZE;
	var x = (pos.x - boardPos.x) / SQUARE_SIZE;
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
	var img = document.createElement('img');
    var color = getColor(code);
    var src = (color == COLOR.red ? 'r' : 'b');
    src = code.toLowerCase() + src + '.png';

	if (HOST) img.src = HOST + '/' + src;
	else img.src = src;

	img.className = 'piece';
    return img;
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

function setTitle() {
	$('GameTitle').innerHTML = "红："+gameState.red+" vs 黑："+gameState.black;
}

function selectColor(color) {
	//alert("color="+color);
	if (color == COLOR.black) {
		gameState.black = getMyID();
	} else {
		gameState.red = getMyID();
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
		turnGrid(COLOR.black);
	}
}


function Piece(color, type) {
	this.color = color;
	this.type = type;
}

function getColor(ch) {
	if (ch >= 'a' && ch <= 'z') {
		return COLOR.black;
	} else if (ch >= 'A' && ch <= 'Z') {
		return COLOR.red;
	}
	throw 'Error: getColor()';
}

function getType(ch) {
	return PIECE_MAP[ch.toLowerCase()];
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

	var pos = getMousePos(e);
	coords = posToCoords(pos);
    applyRotation(coords);

	var piece=board.getPiece(coords);
	if (!playerId && piece) {
		playerId=getMyID();
        selectColor(piece.color);
       	setTitle();
	}

	if (!isMyTurn()) {
	  return;
	}
    board.onSelectSquare(coords);
};


Board.prototype.getPiece = function(coords) {
	var square = this.state[coords.row][coords.col];
	//alert("row:"+coords.row+" col:"+coords.col+" ch:"+square);
	if (square == EMPTY_SPACE) {
		return null;
	}
	return new Piece(getColor(square), getType(square));
};

Board.prototype.onSelectSquare = function(coords) {
	var prev = this.cursor;
	var piece = this.getPiece(coords);
	// If a square was selected.
	if (prev) {
		if (coordsEqual(prev, coords)) {
			// Deselect.
			this.cursor = null;
		} else {
			var prevPiece = this.getPiece(this.cursor);
			if (piece) {
				if (prevPiece.color == piece.color) {
					// Selecting a new piece.
					this.cursor = coords;
				} else {
					// Attacking another piece.
					this.attemptMove(prev, coords);
				}
			} else {
				// Moving to an empty square.
				this.attemptMove(prev, coords);
			}
		}
	} else {
		if (piece && piece.color == gameState.current) {
			this.cursor = coords;
		}
	}
	this.render();
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
	var myID=getMyID();
	if (myID != gameState.black && myID != gameState.white) {
		return;
	}
	gameState.winner = getOpponentColor();
	updateGameState();
}

function leave() {
	var myID=getMyID();
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
	var myID=getMyID();
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

function getMyID() {
	return wave.getViewer().getId();
	//return "stxh007@gmail.com";
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
