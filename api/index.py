from __future__ import annotations

from dataclasses import dataclass, field
from math import inf
from secrets import choice, token_urlsafe
from string import ascii_uppercase, digits
from threading import Lock
from time import time
from typing import Optional
import os

import chess
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

app = FastAPI(title="Premium Chess API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PIECE_VALUES = {
    chess.PAWN: 100,
    chess.KNIGHT: 320,
    chess.BISHOP: 330,
    chess.ROOK: 500,
    chess.QUEEN: 900,
    chess.KING: 20_000,
}

PAWN_TABLE = [
    0, 0, 0, 0, 0, 0, 0, 0,
    50, 50, 50, 50, 50, 50, 50, 50,
    10, 10, 20, 30, 30, 20, 10, 10,
    5, 5, 10, 25, 25, 10, 5, 5,
    0, 0, 0, 20, 20, 0, 0, 0,
    5, -5, -10, 0, 0, -10, -5, 5,
    5, 10, 10, -20, -20, 10, 10, 5,
    0, 0, 0, 0, 0, 0, 0, 0,
]

KNIGHT_TABLE = [
    -50, -40, -30, -30, -30, -30, -40, -50,
    -40, -20, 0, 0, 0, 0, -20, -40,
    -30, 0, 10, 15, 15, 10, 0, -30,
    -30, 5, 15, 20, 20, 15, 5, -30,
    -30, 0, 15, 20, 20, 15, 0, -30,
    -30, 5, 10, 15, 15, 10, 5, -30,
    -40, -20, 0, 5, 5, 0, -20, -40,
    -50, -40, -30, -30, -30, -30, -40, -50,
]

BISHOP_TABLE = [
    -20, -10, -10, -10, -10, -10, -10, -20,
    -10, 0, 0, 0, 0, 0, 0, -10,
    -10, 0, 5, 10, 10, 5, 0, -10,
    -10, 5, 5, 10, 10, 5, 5, -10,
    -10, 0, 10, 10, 10, 10, 0, -10,
    -10, 10, 10, 10, 10, 10, 10, -10,
    -10, 5, 0, 0, 0, 0, 5, -10,
    -20, -10, -10, -10, -10, -10, -10, -20,
]

ROOK_TABLE = [
    0, 0, 0, 5, 5, 0, 0, 0,
    -5, 0, 0, 0, 0, 0, 0, -5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    5, 10, 10, 10, 10, 10, 10, 5,
    0, 0, 0, 0, 0, 0, 0, 0,
]

QUEEN_TABLE = [
    -20, -10, -10, -5, -5, -10, -10, -20,
    -10, 0, 0, 0, 0, 0, 0, -10,
    -10, 0, 5, 5, 5, 5, 0, -10,
    -5, 0, 5, 5, 5, 5, 0, -5,
    0, 0, 5, 5, 5, 5, 0, -5,
    -10, 5, 5, 5, 5, 5, 0, -10,
    -10, 0, 5, 0, 0, 0, 0, -10,
    -20, -10, -10, -5, -5, -10, -10, -20,
]

KING_TABLE = [
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -20, -30, -30, -40, -40, -30, -30, -20,
    -10, -20, -20, -20, -20, -20, -20, -10,
    20, 20, 0, 0, 0, 0, 20, 20,
    20, 30, 10, 0, 0, 10, 30, 20,
]

PIECE_SQUARE_TABLES = {
    chess.PAWN: PAWN_TABLE,
    chess.KNIGHT: KNIGHT_TABLE,
    chess.BISHOP: BISHOP_TABLE,
    chess.ROOK: ROOK_TABLE,
    chess.QUEEN: QUEEN_TABLE,
    chess.KING: KING_TABLE,
}

CHECKMATE_SCORE = 100_000
MAX_DEPTH = 4


class BestMoveRequest(BaseModel):
    fen: str = Field(..., min_length=2)
    depth: int = Field(default=2, ge=1, le=MAX_DEPTH)


class BestMoveResponse(BaseModel):
    best_move: str
    san: str
    evaluation: int
    depth: int
    source: str
    is_checkmate: bool


class ValidateMoveRequest(BaseModel):
    fen: str = Field(..., min_length=2)
    move_uci: str = Field(..., min_length=4, max_length=5)


class ValidateMoveResponse(BaseModel):
    legal: bool
    fen: Optional[str] = None
    san: Optional[str] = None
    is_check: bool = False
    is_game_over: bool = False


class RoomCreateRequest(BaseModel):
    display_name: str = Field(default="You", min_length=1, max_length=24)


class RoomJoinRequest(BaseModel):
    room_code: str = Field(..., min_length=4, max_length=10)
    display_name: str = Field(default="Friend", min_length=1, max_length=24)


class RoomSyncRequest(BaseModel):
    player_token: str = Field(..., min_length=12)
    moves: list[str] = Field(default_factory=list)


class RoomLeaveRequest(BaseModel):
    player_token: str = Field(..., min_length=12)


class RoomStateResponse(BaseModel):
    room_code: str
    invite_path: str
    host_name: str
    guest_name: Optional[str] = None
    moves: list[str]
    version: int
    has_guest: bool
    updated_at: float


class RoomSessionResponse(RoomStateResponse):
    player_token: str
    player_color: str


@dataclass
class RoomRecord:
    code: str
    host_token: str
    host_name: str
    guest_token: Optional[str] = None
    guest_name: Optional[str] = None
    moves: list[str] = field(default_factory=list)
    version: int = 0
    created_at: float = field(default_factory=time)
    updated_at: float = field(default_factory=time)


ROOMS: dict[str, RoomRecord] = {}
ROOMS_LOCK = Lock()
ROOM_TTL_SECONDS = 60 * 60 * 24


def load_board(fen: str) -> chess.Board:
    try:
        return chess.Board(fen)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=f"Invalid FEN: {exc}") from exc


def score_move(board: chess.Board, move: chess.Move) -> int:
    score = 0
    attacker = board.piece_at(move.from_square)
    captured_piece = board.piece_at(move.to_square)

    if board.is_capture(move):
        if captured_piece and attacker:
            score += 10 * PIECE_VALUES[captured_piece.piece_type] - PIECE_VALUES[attacker.piece_type]
        else:
            score += 250

    if move.promotion:
        score += PIECE_VALUES.get(move.promotion, 0) + 400

    if board.gives_check(move):
        score += 300

    if board.is_castling(move):
        score += 120

    return score


def ordered_moves(board: chess.Board) -> list[chess.Move]:
    return sorted(board.legal_moves, key=lambda move: score_move(board, move), reverse=True)


def raw_evaluation(board: chess.Board) -> int:
    if board.is_checkmate():
        return -CHECKMATE_SCORE if board.turn == chess.WHITE else CHECKMATE_SCORE

    if board.is_stalemate() or board.is_insufficient_material() or board.can_claim_draw():
        return 0

    score = 0
    for square, piece in board.piece_map().items():
        square_index = square if piece.color == chess.WHITE else chess.square_mirror(square)
        positional_value = PIECE_SQUARE_TABLES[piece.piece_type][square_index]
        signed_value = PIECE_VALUES[piece.piece_type] + positional_value
        score += signed_value if piece.color == chess.WHITE else -signed_value

    mobility = board.legal_moves.count()
    score += mobility * 2 if board.turn == chess.WHITE else -mobility * 2
    return score


def evaluate_for_color(board: chess.Board, color: chess.Color) -> int:
    base_score = raw_evaluation(board)
    return base_score if color == chess.WHITE else -base_score


def minimax(
    board: chess.Board,
    depth: int,
    alpha: float,
    beta: float,
    maximizing: bool,
    ai_color: chess.Color,
) -> tuple[int, Optional[chess.Move]]:
    if depth == 0 or board.is_game_over(claim_draw=True):
        return evaluate_for_color(board, ai_color), None

    best_move: Optional[chess.Move] = None

    if maximizing:
        best_score = -inf
        for move in ordered_moves(board):
            board.push(move)
            score, _ = minimax(board, depth - 1, alpha, beta, False, ai_color)
            board.pop()

            if score > best_score:
                best_score = score
                best_move = move

            alpha = max(alpha, best_score)
            if beta <= alpha:
                break

        return int(best_score), best_move

    best_score = inf
    for move in ordered_moves(board):
        board.push(move)
        score, _ = minimax(board, depth - 1, alpha, beta, True, ai_color)
        board.pop()

        if score < best_score:
            best_score = score
            best_move = move

        beta = min(beta, best_score)
        if beta <= alpha:
            break

    return int(best_score), best_move


def compute_best_move(board: chess.Board, depth: int) -> tuple[chess.Move, int]:
    if board.is_game_over(claim_draw=True):
        raise HTTPException(status_code=400, detail="Game is already over for this position.")

    if depth < 1 or depth > MAX_DEPTH:
        raise HTTPException(status_code=400, detail=f"Depth must be between 1 and {MAX_DEPTH}.")

    score, move = minimax(board, depth, -inf, inf, True, board.turn)
    if move is None:
        raise HTTPException(status_code=400, detail="No legal move available for this position.")
    return move, score


def normalize_room_code(room_code: str) -> str:
    return room_code.strip().upper()


def build_room_snapshot(room: RoomRecord) -> RoomStateResponse:
    return RoomStateResponse(
        room_code=room.code,
        invite_path=f"?room={room.code}",
        host_name=room.host_name,
        guest_name=room.guest_name,
        moves=list(room.moves),
        version=room.version,
        has_guest=room.guest_token is not None,
        updated_at=room.updated_at,
    )


def purge_stale_rooms() -> None:
    cutoff = time() - ROOM_TTL_SECONDS
    stale_codes = [code for code, room in ROOMS.items() if room.updated_at < cutoff]
    for code in stale_codes:
        ROOMS.pop(code, None)


def generate_room_code() -> str:
    alphabet = ascii_uppercase + digits
    while True:
        room_code = "".join(choice(alphabet) for _ in range(6))
        if room_code not in ROOMS:
            return room_code


def ensure_room(room_code: str) -> RoomRecord:
    normalized = normalize_room_code(room_code)
    room = ROOMS.get(normalized)
    if room is None:
        raise HTTPException(status_code=404, detail="Room not found.")
    return room


def ensure_room_membership(room: RoomRecord, player_token: str) -> str:
    if player_token == room.host_token:
        return "w"
    if player_token == room.guest_token:
        return "b"
    raise HTTPException(status_code=403, detail="You are not a member of this room.")


# Mount static files
app.mount("/static", StaticFiles(directory="public"), name="static")


# Serve index.html for root and unknown routes
@app.get("/")
def root() -> FileResponse:
    return FileResponse("public/index.html")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "healthy"}


@app.post("/api/best-move", response_model=BestMoveResponse)
def best_move(payload: BestMoveRequest) -> BestMoveResponse:
    board = load_board(payload.fen)
    move, evaluation = compute_best_move(board, payload.depth)
    san = board.san(move)
    board.push(move)

    return BestMoveResponse(
        best_move=move.uci(),
        san=san,
        evaluation=evaluation,
        depth=payload.depth,
        source="minimax-alpha-beta",
        is_checkmate=board.is_checkmate(),
    )


@app.post("/api/validate-move", response_model=ValidateMoveResponse)
def validate_move(payload: ValidateMoveRequest) -> ValidateMoveResponse:
    board = load_board(payload.fen)

    try:
        move = chess.Move.from_uci(payload.move_uci)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=f"Invalid move: {exc}") from exc

    if move not in board.legal_moves:
        return ValidateMoveResponse(legal=False)

    san = board.san(move)
    board.push(move)

    return ValidateMoveResponse(
        legal=True,
        fen=board.fen(),
        san=san,
        is_check=board.is_check(),
        is_game_over=board.is_game_over(claim_draw=True),
    )


@app.post("/api/rooms/create", response_model=RoomSessionResponse)
def create_room(payload: RoomCreateRequest) -> RoomSessionResponse:
    with ROOMS_LOCK:
        purge_stale_rooms()
        room_code = generate_room_code()
        room = RoomRecord(
            code=room_code,
            host_token=token_urlsafe(18),
            host_name=payload.display_name.strip(),
        )
        ROOMS[room_code] = room
        snapshot = build_room_snapshot(room)

    return RoomSessionResponse(
        **snapshot.model_dump(),
        player_token=room.host_token,
        player_color="w",
    )


@app.post("/api/rooms/join", response_model=RoomSessionResponse)
def join_room(payload: RoomJoinRequest) -> RoomSessionResponse:
    with ROOMS_LOCK:
        purge_stale_rooms()
        room = ensure_room(payload.room_code)

        if room.guest_token is not None:
            raise HTTPException(status_code=409, detail="This room already has two players.")

        room.guest_token = token_urlsafe(18)
        room.guest_name = payload.display_name.strip()
        room.version += 1
        room.updated_at = time()
        snapshot = build_room_snapshot(room)

    return RoomSessionResponse(
        **snapshot.model_dump(),
        player_token=room.guest_token,
        player_color="b",
    )


@app.get("/api/rooms/{room_code}", response_model=RoomStateResponse)
def get_room(room_code: str) -> RoomStateResponse:
    with ROOMS_LOCK:
        purge_stale_rooms()
        room = ensure_room(room_code)
        return build_room_snapshot(room)


@app.post("/api/rooms/{room_code}/sync", response_model=RoomStateResponse)
def sync_room(room_code: str, payload: RoomSyncRequest) -> RoomStateResponse:
    with ROOMS_LOCK:
        purge_stale_rooms()
        room = ensure_room(room_code)
        ensure_room_membership(room, payload.player_token)

        if len(payload.moves) >= len(room.moves) and payload.moves != room.moves:
            room.moves = list(payload.moves)
            room.version += 1

        room.updated_at = time()
        return build_room_snapshot(room)


@app.post("/api/rooms/{room_code}/leave")
def leave_room(room_code: str, payload: RoomLeaveRequest) -> dict[str, str]:
    with ROOMS_LOCK:
        purge_stale_rooms()
        room = ensure_room(room_code)
        member_color = ensure_room_membership(room, payload.player_token)

        if member_color == "w":
            ROOMS.pop(room.code, None)
            return {"status": "closed"}

        room.guest_token = None
        room.guest_name = None
        room.version += 1
        room.updated_at = time()
        return {"status": "left"}


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
